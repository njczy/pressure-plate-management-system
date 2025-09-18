import React, { useState, useEffect } from 'react';
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Checkbox,
  message,
  Modal,
  Tree,
  Pagination,
  Switch,
  Dropdown,
  Form,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  SettingOutlined,
  DownOutlined,
  CloudUploadOutlined,
  FileExcelOutlined,
  CloseOutlined,
  ExpandOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { localDataService, Device } from '../lib/localData';
import type { ColumnsType } from 'antd/es/table';
import PressurePlateTerminologyModal from '../components/PressurePlateTerminologyModal';
import PressurePlatePositionModal from '../components/PressurePlatePositionModal';
import { getTerminologyConfig } from '../lib/terminologyConfig';
import './DeviceManagement.css';

const { Option } = Select;

interface DeviceManagementProps {}

const DeviceManagement: React.FC<DeviceManagementProps> = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editForm] = Form.useForm();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();

  const [terminologyModalVisible, setTerminologyModalVisible] = useState(false);
  const [positionModalVisible, setPositionModalVisible] = useState(false);
  const navigate = useNavigate();
  
  // 搜索筛选状态
  const [filters, setFilters] = useState({
    protectionScreen: '',
    deviceIssue: '',
    pressurePlateName: '',
    type: ''
  });

  // 获取设备数据
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const filterParams: any = {};
      if (filters.protectionScreen) filterParams.protectionScreen = filters.protectionScreen;
      if (filters.deviceIssue) filterParams.deviceIssue = filters.deviceIssue;
      if (filters.pressurePlateName) filterParams.pressurePlateName = filters.pressurePlateName;
      if (filters.type) filterParams.type = filters.type;
      
      const { data, error } = await localDataService.getDevices(filterParams);
      
      if (error) {
        message.error('获取设备数据失败: ' + error.message);
        return;
      }
      
      setDevices(data || []);
    } catch (error) {
      message.error('获取设备数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [filters]);

  // 分页状态（将分页控件移到表格下方底部显示）
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const total = devices.length;

  // 启用/弃用 胶囊切换状态（仅UI切换，后续可绑定批量操作）
  const [enabled, setEnabled] = useState<boolean>(true);

  const pagedData = devices.slice((page - 1) * pageSize, page * pageSize);

  // 处理筛选条件变化
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 重置筛选条件
  const handleReset = () => {
    setFilters({
      protectionScreen: '',
      deviceIssue: '',
      pressurePlateName: '',
      type: ''
    });
    setSelectedRowKeys([]);
  };

  // 编辑（修改）所选记录
  const handleEdit = () => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请仅选择一条记录进行修改');
      return;
    }
    const id = Number(selectedRowKeys[0]);
    const record = devices.find(d => d.id === id);
    if (!record) {
      message.error('未找到所选记录');
      return;
    }
    setEditingDevice(record);
    // 预填表单（补充列表缺失字段）
    editForm.setFieldsValue({
      sequence: record.sequence,
      power_station: record.power_station,
      protection_screen: record.protection_screen,
      device_issue: record.device_issue,
      pressure_plate_name: record.pressure_plate_name,
      pressure_plate_time: record.pressure_plate_time,
      pressure_plate_box: record.pressure_plate_box,
      // 术语展示为根据规则拼接的只读字段，避免与真实字段混淆
      terminology_display: [record.protection_screen, record.device_issue, record.pressure_plate_name, '压板'].filter(Boolean).join(' '),
      type: record.type,
      pressure_plate_type_color: record.pressure_plate_type_color,
      pressure_plate_position: record.pressure_plate_position,
      pressure_plate_position_x: record.pressure_plate_position_x,
      pressure_plate_position_y: record.pressure_plate_position_y
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      if (!editingDevice) return;
      const { terminology_display, ...updates } = values as any;
      const { error } = await localDataService.updateDevice(editingDevice.id, {
        ...updates,
        updated_at: new Date().toISOString()
      });
      if (error) {
        message.error('更新失败: ' + error.message);
        return;
      }
      message.success('更新成功');
      setEditModalVisible(false);
      setEditingDevice(null);
      await fetchDevices();
    } catch (e) {
      // 表单校验失败时不处理
    }
  };

  // 删除所选记录
  const handleDelete = () => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择要删除的记录');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: `确认删除选中的 ${selectedRowKeys.length} 条记录？`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setLoading(true);
          for (const key of selectedRowKeys) {
            await localDataService.deleteDevice(Number(key));
          }
          await fetchDevices();
          setSelectedRowKeys([]);
          message.success('删除成功');
        } catch (e) {
          message.error('删除失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 下载导入模板
  const downloadTemplate = () => {
    const templateData = [
      ['序号', '变电站名称', '保护屏', '设备间隔', '压板名称', '压板类型', '压板动词', '压板颜色'],
      [1, '溪洛渡变', '示例保护屏', '示例设备间隔', '示例压板名称', '软压板', '投入、退出', '红']
    ];
    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', '设备导入模板.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };





  // 表格列定义
  const columns: ColumnsType<Device> = [
    {
      title: '序号',
      dataIndex: 'sequence',
      key: 'sequence',
      width: 80,
      align: 'center'
    },
    {
      title: '所属电站',
      dataIndex: 'power_station',
      key: 'power_station',
      width: 140,
      
    },
    {
      title: '保护屏',
      dataIndex: 'protection_screen',
      key: 'protection_screen',
      width: 120,
      
      onCell: () => ({ style: { whiteSpace: 'nowrap' } })
    },
    {
      title: '设备间隔',
      dataIndex: 'device_issue',
      key: 'device_issue',
      width: 120,
      
      onCell: () => ({ style: { whiteSpace: 'nowrap' } })
    },
    {
      title: '压板名称',
      dataIndex: 'pressure_plate_name',
      key: 'pressure_plate_name',
      width: 160,
      
      onCell: () => ({ style: { whiteSpace: 'nowrap' } })
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      align: 'center',
      render: (type: string) => (
        <span style={{ color: type === 'soft' ? '#52c41a' : '#1890ff' }}>
          {type === 'soft' ? '软压板' : '硬压板'}
        </span>
      )
    },
    {
      title: '压板术语',
      dataIndex: 'pressure_plate_box',
      key: 'pressure_plate_box',
      width: 220,
      align: 'left',
      onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      render: (_: any, record: Device) => buildTerminology(record)
    },
    {
      title: '压板动词',
      dataIndex: 'pressure_plate_time',
      key: 'pressure_plate_time',
      width: 90,
      onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      render: () => '投入、退出'
    },
    {
      title: '压板颜色',
      dataIndex: 'pressure_plate_type_color',
      key: 'pressure_plate_type_color',
      width: 130,
      align: 'center',
      onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      render: (color: string) => {
        const colorMap = {
          red: { text: '出口压板（红色）', color: '#ff4d4f' },
          yellow: { text: '功能压板（黄色）', color: '#faad14' },
          gray: { text: '备用压板（灰色）', color: '#8c8c8c' },
          black: { text: '其他压板（黑色）', color: '#000000' },
        };
        const config = colorMap[color as keyof typeof colorMap] || colorMap.black;
        return (
          <span style={{ color: config.color, fontWeight: 500 }}>
            {config.text}
          </span>
        );
      }
    },
    {
      title: '压板位置',
      dataIndex: 'pressure_plate_position',
      key: 'pressure_plate_position',
      width: 100,
      align: 'center',
      onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      render: (position: string) => {
        const positionMap = {
          'top': '上',
          'middle': '中',
          'bottom': '下'
        };
        return positionMap[position as keyof typeof positionMap] || position;
      }
    },
    {
      title: '位置X轴',
      dataIndex: 'pressure_plate_position_x',
      key: 'pressure_plate_position_x',
      width: 80,
      align: 'center',
      onCell: () => ({ style: { whiteSpace: 'nowrap' } })
    },
    {
      title: '位置Y轴',
      dataIndex: 'pressure_plate_position_y',
      key: 'pressure_plate_position_y',
      width: 80,
      align: 'center',
      onCell: () => ({ style: { whiteSpace: 'nowrap' } })
    }
  ];

  // 根据术语配置规则拼接“压板术语”显示（不包含“压板状态/动词”）
  const buildTerminology = (device: Device) => {
    // 读取配置（硬/软），按配置顺序拼接，不包含状态/动词，末尾追加“压板”
    const cfg = getTerminologyConfig();
    const order = (device.type === 'hard' ? cfg.hard : cfg.soft) || [];
    const map: Record<string, string | undefined> = {
      '保护屏': device.protection_screen,
      '设备间隔': device.device_issue,
      '压板名称': device.pressure_plate_name
    };
    const parts = order.map(k => map[k]).filter(Boolean) as string[];
    parts.push('压板');
    return parts.join(' ');
  };



  return (
    <div className="dm-page">
      <div className="dm-header">保护压板配置管理</div>

      <div className="dm-main">
        {/* 右侧筛选 + 工具条 + 表格 */}
        <div className="dm-right">
          {/* 顶部区域（15% 高度）：筛选 + 操作条 */}
          <div className="dm-top">
            {/* 筛选区：一行四项 */}
            <div className="dm-filters">
              <Row gutter={[12, 12]} align="middle">
                <Col span={6}>
                  <div className="dm-filter-item">
                    <label>保护屏</label>
                    <Input placeholder="请输入" value={filters.protectionScreen} onChange={(e) => handleFilterChange('protectionScreen', e.target.value)} />
                  </div>
                </Col>
                <Col span={6}>
                  <div className="dm-filter-item">
                    <label>设备间隔</label>
                    <Input placeholder="请输入" value={filters.deviceIssue} onChange={(e) => handleFilterChange('deviceIssue', e.target.value)} />
                  </div>
                </Col>
                <Col span={6}>
                  <div className="dm-filter-item">
                    <label>压板名称</label>
                    <Input placeholder="请输入" value={filters.pressurePlateName} onChange={(e) => handleFilterChange('pressurePlateName', e.target.value)} />
                  </div>
                </Col>
                <Col span={6}>
                  <div className="dm-filter-item">
                    <label>压板类型</label>
                    <Select placeholder="请选择" style={{ width: '100%' }} value={filters.type || undefined} onChange={(v) => handleFilterChange('type', v || '')} allowClear>
                      <Option value="soft">软压板</Option>
                      <Option value="hard">硬压板</Option>
                  </Select>
                  </div>
                </Col>
              </Row>
            </div>
            <div className="dm-filter-actions" style={{ marginTop: 8 }}>
              <Button onClick={handleReset}>重置</Button>
              <Button type="primary" style={{ backgroundColor: '#0f8a80', borderColor: '#0f8a80' }} onClick={fetchDevices}>查询</Button>
            </div>

            {/* 工具条 */}
            <div className="dm-toolbar">
              <Space wrap>
                <Button type="primary" icon={<PlusOutlined />} style={{ backgroundColor: '#0f8a80', borderColor: '#0f8a80' }} onClick={() => { addForm.resetFields(); setAddModalVisible(true); }}>
                  新增
                </Button>
                <Button disabled={selectedRowKeys.length !== 1} onClick={handleEdit}>修改</Button>
                <Button disabled={!selectedRowKeys.length} onClick={handleDelete}>删除</Button>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'tpl', label: '下载导入模板', icon: <FileExcelOutlined /> },
                      { key: 'import', label: '导入保护压板', icon: <CloudUploadOutlined /> }
                    ],
                    onClick: ({ key }) => {
                      if (key === 'tpl') downloadTemplate();
                      if (key === 'import') navigate('/import');
                    }
                  }}
                >
                  <Button type="primary" style={{ backgroundColor: '#0f8a80', borderColor: '#0f8a80' }}>
                    <Space>
                      导入
                      <DownOutlined />
                    </Space>
                  </Button>
                </Dropdown>
                <Button icon={<SettingOutlined />} onClick={() => setTerminologyModalVisible(true)}>压板术语配置</Button>
              </Space>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>是否启用电站</span>
                <Switch
                  checked={enabled}
                  onChange={setEnabled}
                  checkedChildren="启用"
                  unCheckedChildren="弃用"
                />
              </div>
            </div>
          </div>

          {/* 中部区域（80%）：表格 */}
          <div className="dm-center">
            <div className="dm-table">
              <Table
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys)
                }}
                columns={columns}
                dataSource={pagedData}
                rowKey="id"
                loading={loading}
                pagination={false}
                scroll={{ x: 1300 }}
                size="middle"
                components={{
                  body: {
                    cell: (props: any) => (
                      <td {...props} className="nowrap-cell" style={{ ...props.style }} />
                    )
                  }
                }}
              />
            </div>
          </div>

          {/* 底部区域（5%）：分页 */}
          <div className="dm-bottom">
            <div className="dm-pagination">
              <Space size={12} align="center">
                <span className="dm-total">共 {total} 条</span>
                <Select
                  size="small"
                  value={pageSize}
                  style={{ width: 100 }}
                  onChange={(v) => { setPageSize(v); setPage(1); }}
                  options={[10,20,50,100].map(v => ({ value: v, label: `${v}条/页` }))}
                />
                <Pagination
                  simple={false}
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger={false}
                  onChange={(p) => setPage(p)}
                />
                <span className="dm-jump-text">前往</span>
                <Input
                  size="small"
                  style={{ width: 56 }}
                  value={page}
                  onChange={(e) => {
                    const v = Number(e.target.value || 1);
                    if (!Number.isNaN(v)) setPage(v);
                  }}
                  onPressEnter={(e: any) => {
                    let v = Number(e.target.value || 1);
                    if (Number.isNaN(v)) v = 1;
                    v = Math.max(1, Math.min(v, Math.max(1, Math.ceil(total / pageSize))));
                    setPage(v);
                  }}
                />
                <span className="dm-jump-text">页</span>
              </Space>
            </div>
          </div>
        </div>
      </div>
      
      {/* 压板术语配置弹窗 */}
      <PressurePlateTerminologyModal
        visible={terminologyModalVisible}
        onClose={() => setTerminologyModalVisible(false)}
      />
      
      {/* 压板位置示意图弹窗 */}
      <PressurePlatePositionModal
        visible={positionModalVisible}
        onClose={() => setPositionModalVisible(false)}
      />

      {/* 编辑设备弹窗（约占页面20%面积，居中） */}
      <Modal
        title={null}
        open={editModalVisible}
        onCancel={() => { setEditModalVisible(false); setEditingDevice(null); }}
        footer={null}
        centered
        width="50%"
        className="dm-modal"
        styles={{
          content: { borderRadius: 0 },
          body: { padding: 0, maxHeight: '50vh', overflow: 'auto' }
        }}
        style={{ paddingBottom: 0 }}
        closable={false}
      >
        {/* 自定义标题栏，绿底白字 + 右侧控制按钮 */}
        <div
          style={{
            backgroundColor: '#0f8a80',
            color: 'white',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500 }}>修改保护压板</span>
          <div className="window-controls">
            <Button type="text" size="small" icon={<ExpandOutlined />} style={{ color: 'white' }} />
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => { setEditModalVisible(false); setEditingDevice(null); }} style={{ color: 'white' }} />
          </div>
        </div>

        <div style={{ padding: 0 }}>
        <Form
          form={editForm}
          layout="vertical"
          style={{ padding: '12px 16px' }}
          initialValues={{ 
            type: 'hard', 
            pressure_plate_time: '投入、退出',
            pressure_plate_type_color: 'red',
            pressure_plate_position: 'middle'
          }}
        >
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Form.Item label="所属电站" name="power_station" rules={[{ required: true, message: '请输入所属电站' }]}> 
                <Input placeholder="请输入所属电站" readOnly style={{ backgroundColor: '#e8e8e8', color: '#666', border: 'none' }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="保护屏" name="protection_screen" rules={[{ required: true, message: '请输入保护屏' }]}> 
                <Input placeholder="请输入保护屏" readOnly style={{ backgroundColor: '#e8e8e8', color: '#666', border: 'none' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="设备间隔" name="device_issue" rules={[{ required: true, message: '请输入设备间隔' }]}> 
                <Input placeholder="请输入设备间隔" readOnly style={{ backgroundColor: '#e8e8e8', color: '#666', border: 'none' }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="压板名称" name="pressure_plate_name" rules={[{ required: true, message: '请输入压板名称' }]}> 
                <Input placeholder="请输入压板名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="压板动词" name="pressure_plate_time" rules={[{ required: true, message: '请输入压板动词' }]}> 
                <Input placeholder="如：投入、退出" />
              </Form.Item>
            </Col>

            {/* 压板术语、术语展示：根据需求隐藏，不在编辑页显示 */}
            <Col span={12}>
              <Form.Item label="压板类型" name="type" rules={[{ required: true, message: '请选择压板类型' }]}> 
                <Select placeholder="请选择">
                  <Option value="soft">软压板</Option>
                  <Option value="hard">硬压板</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="压板颜色" name="pressure_plate_type_color" rules={[{ required: true, message: '请选择颜色' }]}> 
                <Select placeholder="请选择">
                  <Option value="red">红</Option>
                  <Option value="yellow">黄</Option>
                  <Option value="gray">黑</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="压板位置" name="pressure_plate_position" rules={[{ required: true, message: '请选择位置' }]}> 
                <Select placeholder="请选择">
                  <Option value="top">上</Option>
                  <Option value="middle">中</Option>
                  <Option value="bottom">下</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="位置X轴" name="pressure_plate_position_x" rules={[{ required: true, message: '请输入X轴' }]}> 
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="位置Y轴" name="pressure_plate_position_y" rules={[{ required: true, message: '请输入Y轴' }]}> 
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <Space>
              <Button onClick={() => { setEditModalVisible(false); setEditingDevice(null); }}>取消</Button>
              <Button type="primary" onClick={handleEditSubmit} style={{ backgroundColor: '#0f8a80', borderColor: '#0f8a80' }}>确定</Button>
            </Space>
          </div>
        </Form>
        </div>
      </Modal>

      {/* 新增设备弹窗（样式参照修改弹窗） */}
      <Modal
        title={null}
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        centered
        width="50%"
        className="dm-modal"
        styles={{
          content: { borderRadius: 0 },
          body: { padding: 0, maxHeight: '60vh', overflow: 'auto' }
        }}
        style={{ paddingBottom: 0 }}
        closable={false}
      >
        {/* 绿色标题栏 */}
        <div
          style={{
            backgroundColor: '#0f8a80',
            color: 'white',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500 }}>新增保护压板</span>
          <div className="window-controls">
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setAddModalVisible(false)} style={{ color: 'white' }} />
          </div>
        </div>

        <div style={{ padding: 0 }}>
          <Form
            form={addForm}
            layout="vertical"
            style={{ padding: '12px 16px' }}
            initialValues={{
              type: 'hard',
              pressure_plate_time: '投入、退出',
              pressure_plate_box: 'XXXX',
              pressure_plate_type_color: 'red',
              pressure_plate_position: 'middle',
              pressure_plate_position_x: 1,
              pressure_plate_position_y: 1,
              power_station: '华能电站',
              voltageLevel: '220KV',
              maintenanceTeam: '华能电站运维班组'
            }}
          >
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Form.Item label="所属电站" name="power_station" rules={[{ required: true, message: '请输入所属电站' }]}> 
                  <Input placeholder="请输入所属电站" readOnly style={{ backgroundColor: '#e8e8e8', color: '#666', border: 'none' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="变电站电压等级" name="voltageLevel" rules={[{ required: true, message: '请输入电压等级' }]}> 
                  <Input placeholder="如：交流110kV" readOnly style={{ backgroundColor: '#e8e8e8', color: '#666', border: 'none' }} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="运维班组" name="maintenanceTeam" rules={[{ required: true, message: '请输入运维班组' }]}> 
                  <Input placeholder="请输入运维班组" readOnly style={{ backgroundColor: '#e8e8e8', color: '#666', border: 'none' }} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="保护屏" name="protection_screen" rules={[{ required: true, message: '请输入保护屏' }]}> 
                  <Input placeholder="请输入保护屏" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="设备间隔" name="device_issue" rules={[{ required: true, message: '请输入设备间隔' }]}> 
                  <Input placeholder="请输入设备间隔" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="压板名称" name="pressure_plate_name" rules={[{ required: true, message: '请输入压板名称' }]}> 
                  <Input placeholder="请输入压板名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="压板动词" name="pressure_plate_time" rules={[{ required: true, message: '请输入压板动词' }]}> 
                  <Input placeholder="如：投入、退出" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="压板类型" name="type" rules={[{ required: true, message: '请选择压板类型' }]}> 
                  <Select placeholder="请选择">
                    <Option value="soft">软压板</Option>
                    <Option value="hard">硬压板</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
              <Form.Item label="压板颜色" name="pressure_plate_type_color" rules={[{ required: true, message: '请选择颜色' }]}> 
                  <Select placeholder="请选择">
                    <Option value="red">红</Option>
                    <Option value="yellow">黄</Option>
                    <Option value="gray">黑</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="压板位置" name="pressure_plate_position" rules={[{ required: true, message: '请选择位置' }]}> 
                  <Select placeholder="请选择">
                    <Option value="top">上</Option>
                    <Option value="middle">中</Option>
                    <Option value="bottom">下</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="位置X轴" name="pressure_plate_position_x" rules={[{ required: true, message: '请输入X轴' }]}> 
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="位置Y轴" name="pressure_plate_position_y" rules={[{ required: true, message: '请输入Y轴' }]}> 
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <Space>
                <Button onClick={() => setAddModalVisible(false)}>取消</Button>
                <Button
                  type="primary"
                  style={{ backgroundColor: '#0f8a80', borderColor: '#0f8a80' }}
                  onClick={async () => {
                    try {
                      const values = await addForm.validateFields();
                      const nextSeq = Math.max(0, ...devices.map(d => d.sequence || 0)) + 1;
                      // 从表单值中剔除非设备实体字段
                      const { voltageLevel, maintenanceTeam, ...restValues } = values as any;
                      const payload = {
                        ...restValues,
                        sequence: values.sequence ?? nextSeq,
                        pressure_plate_box: values.pressure_plate_box ?? 'XXXX',
                        pressure_plate_general_name: values.pressure_plate_name,
                        pressure_plate_status: '投入',
                        last_changed_by: '',
                        last_changed_at: new Date().toISOString(),
                        change_remarks: ''
                      } as any;
                      const { error } = await localDataService.createDevice(payload);
                      if (error) {
                        message.error('新增失败: ' + error.message);
                        return;
                      }
                      message.success('新增成功');
                      setAddModalVisible(false);
                      addForm.resetFields();
                      await fetchDevices();
                    } catch (e) {
                      // 校验失败不提示
                    }
                  }}
                >
                  确定
                </Button>
              </Space>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default DeviceManagement;
