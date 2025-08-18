import React, { useState, useEffect } from 'react';
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Card,
  Row,
  Col,
  Checkbox,
  message,
  Modal
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { supabase, Device } from '../lib/supabase';
import type { ColumnsType } from 'antd/es/table';
import PressurePlateTerminologyModal from '../components/PressurePlateTerminologyModal';
import PressurePlatePositionModal from '../components/PressurePlatePositionModal';

const { Option } = Select;

interface DeviceManagementProps {}

const DeviceManagement: React.FC<DeviceManagementProps> = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

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
      let query = supabase.from('devices').select('*').order('sequence', { ascending: true });
      
      // 应用筛选条件
      if (filters.protectionScreen) {
        query = query.ilike('protection_screen', `%${filters.protectionScreen}%`);
      }
      if (filters.deviceIssue) {
        query = query.ilike('device_issue', `%${filters.deviceIssue}%`);
      }
      if (filters.pressurePlateName) {
        query = query.ilike('pressure_plate_name', `%${filters.pressurePlateName}%`);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      const { data, error } = await query;
      
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
  };





  // 表格列定义
  const columns: ColumnsType<Device> = [
    {
      title: '序号',
      dataIndex: 'sequence',
      key: 'sequence',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.sequence - b.sequence
    },
    {
      title: '所属电站',
      dataIndex: 'power_station',
      key: 'power_station',
      width: 120,
      sorter: (a, b) => a.power_station.localeCompare(b.power_station)
    },
    {
      title: '保护屏',
      dataIndex: 'protection_screen',
      key: 'protection_screen',
      width: 200,
      ellipsis: true,
      sorter: (a, b) => a.protection_screen.localeCompare(b.protection_screen)
    },
    {
      title: '设备问题',
      dataIndex: 'device_issue',
      key: 'device_issue',
      width: 150,
      ellipsis: true,
      sorter: (a, b) => a.device_issue.localeCompare(b.device_issue)
    },
    {
      title: '压板名称',
      dataIndex: 'pressure_plate_name',
      key: 'pressure_plate_name',
      width: 200,
      ellipsis: true,
      sorter: (a, b) => a.pressure_plate_name.localeCompare(b.pressure_plate_name)
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.type.localeCompare(b.type),
      render: (type: string) => (
        <span style={{ color: type === 'soft' ? '#52c41a' : '#1890ff' }}>
          {type === 'soft' ? '软' : '硬'}
        </span>
      )
    },
    {
      title: '压板术语',
      dataIndex: 'pressure_plate_box',
      key: 'pressure_plate_box',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.pressure_plate_box.localeCompare(b.pressure_plate_box)
    },
    {
      title: '压板动词',
      dataIndex: 'pressure_plate_time',
      key: 'pressure_plate_time',
      width: 120,
      sorter: (a, b) => a.pressure_plate_time.localeCompare(b.pressure_plate_time)
    },
    {
      title: '压板总称',
      dataIndex: 'pressure_plate_general_name',
      key: 'pressure_plate_general_name',
      width: 150,
      ellipsis: true,
      sorter: (a, b) => a.pressure_plate_general_name.localeCompare(b.pressure_plate_general_name)
    },
    {
      title: '压板类型颜色',
      dataIndex: 'pressure_plate_type_color',
      key: 'pressure_plate_type_color',
      width: 120,
      align: 'center',
      sorter: (a, b) => a.pressure_plate_type_color.localeCompare(b.pressure_plate_type_color),
      render: (color: string) => {
        const colorMap = {
          'outlet': { text: '出口', color: '#ff4d4f' },
          'pressure_plate': { text: '压板', color: '#1890ff' },
          'backup': { text: '备用', color: '#52c41a' }
        };
        const config = colorMap[color as keyof typeof colorMap] || { text: color, color: '#666' };
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
      sorter: (a, b) => a.pressure_plate_position.localeCompare(b.pressure_plate_position),
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
      width: 100,
      align: 'center',
      sorter: (a, b) => a.pressure_plate_position_x - b.pressure_plate_position_x
    },
    {
      title: '位置Y轴',
      dataIndex: 'pressure_plate_position_y',
      key: 'pressure_plate_position_y',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.pressure_plate_position_y - b.pressure_plate_position_y
    }
  ];



  return (
    <div style={{ padding: '16px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: '16px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {/* 搜索筛选区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col span={6}>
            <div style={{ marginBottom: '8px', fontWeight: 500 }}>保护屏</div>
            <Input
              placeholder="请输入"
              value={filters.protectionScreen}
              onChange={(e) => handleFilterChange('protectionScreen', e.target.value)}
            />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: '8px', fontWeight: 500 }}>设备问题</div>
            <Input
              placeholder="请输入"
              value={filters.deviceIssue}
              onChange={(e) => handleFilterChange('deviceIssue', e.target.value)}
            />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: '8px', fontWeight: 500 }}>压板名称</div>
            <Input
              placeholder="请输入"
              value={filters.pressurePlateName}
              onChange={(e) => handleFilterChange('pressurePlateName', e.target.value)}
            />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: '8px', fontWeight: 500 }}>压板类型</div>
            <Select
              placeholder="请选择"
              style={{ width: '100%' }}
              value={filters.type || undefined}
              onChange={(value) => handleFilterChange('type', value || '')}
              allowClear
            >
              <Option value="soft">软</Option>
              <Option value="hard">硬</Option>
            </Select>
          </Col>
        </Row>
        
        {/* 功能按钮区域 */}
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2' }}
                onClick={() => navigate('/devices/new')}
              >
                新增
              </Button>

              <Button
                icon={<ImportOutlined />}
                onClick={() => navigate('/import')}
              >
                导入
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setTerminologyModalVisible(true)}
              >
                压板术语配置
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setPositionModalVisible(true)}
              >
                压板位置示意图
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button onClick={handleReset}>重置</Button>
              <Button type="primary" style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2' }} onClick={fetchDevices}>查询</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card>
        <div style={{ marginBottom: '16px', color: '#666' }}>
          电站管理系统用户
        </div>
        <Table
          columns={columns}
          dataSource={devices}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>
      
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
    </div>
  );
};

export default DeviceManagement;