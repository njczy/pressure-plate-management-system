import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Button, Col, Input, Pagination, Row, Select, Space, Table, Tree, message, Modal } from 'antd';
import { ExportOutlined, EyeOutlined, SettingOutlined, ImportOutlined } from '@ant-design/icons';
import './DeviceManagement.css';
import { localDataService, Device } from '../lib/localData';
import PressurePlatePositionModal from '../components/PressurePlatePositionModal';
import PressurePlateAdjustModal from '../components/PressurePlateAdjustModal';
import UpdateLogsModal from '../components/UpdateLogsModal';
import { useNavigate } from 'react-router-dom';

// 扩展window类型
declare global {
  interface Window {
    updateDeviceStatus?: (deviceId: number, updatedDevice: Device) => void;
  }
}

const { Option } = Select;

export default function PlateManage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [positionModalVisible, setPositionModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [logsDeviceId, setLogsDeviceId] = useState<number | undefined>(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const navigate = useNavigate();

  // 筛选
  const [filters, setFilters] = useState({
    protectionScreen: '',
    deviceIssue: '',
    plateName: '',
    type: '',
    status: '',
    changeType: '',
    changeSource: '',
  });

  const fetchDevices = async () => {
    setLoading(true);
    try {
      console.log('=== 开始获取本地设备数据 ===');
      
      const filterParams: any = {};
      if (filters.protectionScreen) filterParams.protectionScreen = filters.protectionScreen;
      if (filters.deviceIssue) filterParams.deviceIssue = filters.deviceIssue;
      if (filters.plateName) filterParams.pressurePlateName = filters.plateName;
      if (filters.type) filterParams.type = filters.type;
      if (filters.status) filterParams.pressurePlateStatus = filters.status;
      if (filters.changeSource) filterParams.lastChangedBy = filters.changeSource;
      
      const { data, error } = await localDataService.getDevices(filterParams);
      
      console.log('本地数据查询结果:');
      console.log('- 数据条数:', data?.length || 0);
      console.log('- 错误信息:', error);
      
      if (data && data.length > 0) {
         console.log('获取设备数据成功，共', data.length, '条记录');
         console.log('第一条记录的字段:', Object.keys(data[0]));
         console.log('第一条记录示例:', data[0]);
       }
      
      if (error) {
        console.error('获取数据错误:', error);
        message.error('获取数据失败: ' + error.message);
        return;
      }
      
      // “变更类型”目前仅支持手动/系统占位；如果选择了值，则在前端过滤
      let list = data || [];
      if (filters.changeType) {
        if (filters.changeType === '手动变更') {
          list = list; // 目前全部为手动变更，占位
        } else {
          list = []; // 无系统变更数据
        }
      }
      setDevices(list);
       console.log('设备数据已设置到状态中');
     } catch (e) {
       console.error('获取数据异常:', e);
       message.error('获取数据失败');
     } finally {
       setLoading(false);
     }
   };

  useEffect(() => { fetchDevices(); }, [filters]);

  // 添加全局函数用于本地状态更新
  useEffect(() => {
    window.updateDeviceStatus = (deviceId: number, updatedDevice: Device) => {
      console.log('本地更新设备状态:', deviceId, updatedDevice);
      setDevices(prev => prev.map(device => 
        device.id === deviceId ? { ...device, ...updatedDevice } : device
      ));
    };
    
    return () => {
      delete window.updateDeviceStatus;
    };
  }, []);

  // 分页
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpPage, setJumpPage] = useState('');
  const total = devices.length;
  const pagedData = useMemo(() => devices.slice((page - 1) * pageSize, page * pageSize), [devices, page, pageSize]);

  const handleReset = () => {
    setFilters({ protectionScreen: '', deviceIssue: '', plateName: '', type: '', status: '', changeType: '', changeSource: '' });
    setPage(1);
  };

  // 查看更新日志（占位实现，可接入真实日志数据源）
  const handleShowLogs = (record: Device) => {
    setLogsDeviceId(record.id);
    setLogsModalVisible(true);
  };

  const columns = [
    // 1. 序号
    {
      title: '序号',
      dataIndex: 'sequence',
      key: 'sequence',
      width: 80,
      align: 'center' as const
    },
    // 2. 保护屏
    { title: '保护屏', dataIndex: 'protection_screen', key: 'protection_screen', width: 200 },
    // 3. 设备间隔
    { title: '设备间隔', dataIndex: 'device_issue', key: 'device_issue', width: 180 },
    // 4. 压板名称
    { title: '压板名称', dataIndex: 'pressure_plate_name', key: 'pressure_plate_name', width: 220 },
    // 5. 变更类型（无字段，固定文案）
    { title: '变更类型', dataIndex: 'changeType', key: 'changeType', width: 120, render: () => '手动变更' },
    // 6. 变更来源（与更新日志一致，取自 last_changed_by；由“压板调整”中的“变更人”维护）
    { title: '变更来源', dataIndex: 'last_changed_by', key: 'changeSource', width: 120, render: (v: string) => v || '系统' },
    // 7. 最新更新时间（优先显示 last_changed_at，否则显示 updated_at）
    { 
      title: '最新更新时间', 
      dataIndex: 'last_changed_at', 
      key: 'latest_update_time', 
      width: 200,
      render: (_: any, record: Device) => {
        const ts = record.last_changed_at || record.updated_at;
        return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '——';
      }
    },
    // 8. 压板类型
    {
      title: '压板类型', dataIndex: 'type', key: 'type', width: 100, align: 'center' as const,
      render: (t: string) => (
        <span style={{ color: t === 'soft' ? '#52c41a' : '#1890ff' }}>
          {t === 'soft' ? '软压板' : '硬压板'}
        </span>
      )
    },
    // 9. 压板动词
    {
      title: '压板动词',
      dataIndex: 'pressure_plate_time',
      key: 'pressure_plate_time',
      width: 100,
      render: (v: string) => (v && v.trim()) ? v : '投入、退出'
    },
    // 10. 保护压板状态
    {
      title: '保护压板状态',
      dataIndex: 'pressure_plate_status',
      key: 'pressure_plate_status',
      width: 120,
      align: 'center' as const,
      render: (status: string) => {
        const displayStatus = status || '投入';
        return (
          <span style={{ 
            color: displayStatus === '投入' ? '#0f8a80' : '#ff4d4f',
            fontWeight: 'bold'
          }}>
            {displayStatus}
          </span>
        );
      }
    },
    // 11. 备注
    { title: '备注', dataIndex: 'change_remarks', key: 'change_remarks', width: 160, render: (v: string) => v || '——' },
    // 12. 操作
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: Device) => (
        <Space size={8}>
          <Button 
            type="primary" 
            style={{ backgroundColor: '#0f8a80', borderColor: '#0f8a80' }} 
            onClick={() => handleShowLogs(record)}
          >
            更新日志
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="dm-page">
      <div className="dm-header">保护压板管理</div>
      <div className="dm-main">
        {/* 右侧 */}
        <div className="dm-right">
          {/* 顶部区域（15%） */}
          <div className="dm-top">
            {/* 筛选区 */}
            <div className="dm-filters" style={{ paddingBottom: 8, marginBottom: 8 }}>
              {/* 第一行：保护屏 / 设备间隔 / 压板名称 / 变更来源 */}
              <Row gutter={[12, 12]} align="middle">
                <Col span={6}>
                  <div className="dm-filter-item">
                    <label>保护屏</label>
                    <Input placeholder="请输入保护屏" value={filters.protectionScreen} onChange={(e) => setFilters(prev => ({ ...prev, protectionScreen: e.target.value }))} />
                  </div>
                </Col>
                <Col span={6}>
                  <div className="dm-filter-item">
                    <label>设备间隔</label>
                    <Input placeholder="请输入设备间隔" value={filters.deviceIssue} onChange={(e) => setFilters(prev => ({ ...prev, deviceIssue: e.target.value }))} />
                  </div>
                </Col>
                <Col span={6}>
                  <div className="dm-filter-item">
                    <label>压板名称</label>
                    <Input placeholder="请输入压板名称" value={filters.plateName} onChange={(e) => setFilters(prev => ({ ...prev, plateName: e.target.value }))} />
                  </div>
                </Col>
                <Col span={6}>
                  <div className="dm-filter-item">
                    <label>变更来源</label>
                    <Input placeholder="请输入变更来源" value={filters.changeSource} onChange={(e) => setFilters(prev => ({ ...prev, changeSource: e.target.value }))} />
                  </div>
                </Col>
              </Row>

              {/* 第二行：压板类型 / 保护压板状态 / 变更类型 + 右侧按钮 */}
              <Row gutter={[12, 12]} align="middle" style={{ marginTop: 8 }}>
                <Col span={6}>
                  <div className="dm-filter-item">
                    <label>压板类型</label>
                    <Select placeholder="请选择压板类型" style={{ width: '100%' }} value={filters.type || undefined} onChange={(v) => setFilters(prev => ({ ...prev, type: v || '' }))} allowClear>
                    <Option value="soft">软压板</Option>
                    <Option value="hard">硬压板</Option>
                  </Select>
                </div>
              </Col>
                <Col span={6}>
                  <div className="dm-filter-item">
                    <label>保护压板状态</label>
                    <Select placeholder="请选择保护压板状态" style={{ width: '100%' }} value={filters.status || undefined} onChange={(v) => setFilters(prev => ({ ...prev, status: v || '' }))} allowClear>
                      <Option value="投入">投入</Option>
                      <Option value="退出">退出</Option>
                    </Select>
                  </div>
                </Col>
                <Col span={6}>
                  <div className="dm-filter-item">
                    <label>变更类型</label>
                    <Select placeholder="请选择变更类型" style={{ width: '100%' }} value={filters.changeType || undefined} onChange={(v) => setFilters(prev => ({ ...prev, changeType: v || '' }))} allowClear>
                      <Option value="手动变更">手动变更</Option>
                      <Option value="系统变更">系统变更</Option>
                    </Select>
                  </div>
                </Col>
                <Col span={6}>
                  <div className="dm-filter-actions" style={{ padding: 0, justifyContent: 'flex-end' }}>
                    <Button type="primary" style={{ backgroundColor: '#0f8a80', borderColor: '#0f8a80', marginRight: 8 }} onClick={fetchDevices}>查询</Button>
                    <Button onClick={handleReset}>重置</Button>
                  </div>
                </Col>
              </Row>
            </div>

            {/* 工具条 */}
            <div className="dm-toolbar">
              <Space>
                <Button 
                  icon={<EyeOutlined />} 
                  type="primary" 
                  style={{ backgroundColor: '#0f8a80', borderColor: '#0f8a80' }}
                  onClick={() => {
                    console.log('=== 点击调整压板状态按钮 ===');
                    console.log('选中的行数:', selectedRowKeys.length);
                    console.log('选中的行键:', selectedRowKeys);
                    
                    if (selectedRowKeys.length === 1) {
                      const device = devices.find(d => d.id === selectedRowKeys[0]);
                      console.log('找到的设备:', device);
                      console.log('设备ID匹配:', device?.id === selectedRowKeys[0]);
                      console.log('设备压板状态字段:', device?.pressure_plate_status);
                      console.log('设备变更人字段:', device?.last_changed_by);
                      
                      if (device) {
                        console.log('设置选中设备并打开模态框');
                        setSelectedDevice(device);
                        setAdjustModalVisible(true);
                      } else {
                        console.error('未找到对应的设备数据');
                        message.error('未找到对应的设备数据');
                      }
                    } else {
                      console.warn('未选择设备或选择了多个设备');
                      message.warning('请选择一条记录进行调整');
                    }
                  }}
                >压板调整</Button>
                <Button icon={<ExportOutlined />}>导出</Button>
                <Button icon={<ImportOutlined />} onClick={() => navigate('/import')}>导入</Button>
                <Button icon={<SettingOutlined />} onClick={() => setPositionModalVisible(true)}>压板位置示意图</Button>
              </Space>
            </div>
          </div>

          {/* 表格 */}
          <div className="dm-center">
            <div className="dm-table">
              <Table
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys),
                  getCheckboxProps: (record: Device) => ({
                    disabled: false,
                    name: record.pressure_plate_name,
                  }),
                }}
                columns={columns as any}
                dataSource={pagedData}
                rowKey="id"
                loading={loading}
                pagination={false}
                size="middle"
                scroll={{ x: 1200 }}
              />
            </div>
          </div>

          {/* 分页（底部5%） */}
          <div className="dm-bottom">
            <div className="dm-pagination">
              <Space size={12} align="center">
                <span className="dm-total">共 {total} 条</span>
                <Select size="small" value={pageSize} style={{ width: 100 }} onChange={(v) => { setPageSize(v); setPage(1); }} options={[10,20,50,100].map(v => ({ value: v, label: `${v}条/页` }))} />
                <Pagination
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
                  value={jumpPage}
                  placeholder={String(page)}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onPressEnter={(e: any) => {
                    let v = Number(e.target.value || 1);
                    if (Number.isNaN(v)) v = 1;
                    v = Math.max(1, Math.min(v, Math.max(1, Math.ceil(total / pageSize))));
                    setPage(v);
                    setJumpPage('');
                  }}
                />
                <span className="dm-jump-text">页</span>
              </Space>
            </div>
          </div>
        </div>
      </div>
      
      {/* 压板位置示意图弹窗 */}
      <PressurePlatePositionModal
        visible={positionModalVisible}
        onClose={() => setPositionModalVisible(false)}
        devices={devices}
      />
      
      {/* 调整压板状态弹窗 */}
      <PressurePlateAdjustModal
        visible={adjustModalVisible}
        onClose={() => {
          setAdjustModalVisible(false);
          setSelectedDevice(null);
          setSelectedRowKeys([]);
        }}
        device={selectedDevice}
        onSuccess={() => {
          // 保存成功后重新获取数据
          fetchDevices();
        }}
      />

      {/* 更新日志弹窗 */}
      <UpdateLogsModal
        visible={logsModalVisible}
        onClose={() => setLogsModalVisible(false)}
        deviceId={logsDeviceId}
      />
    </div>
  );
}
