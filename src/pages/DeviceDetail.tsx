import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  message,
  Space,
  InputNumber
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { localDataService, Device } from '../lib/localData';

const { Option } = Select;
const { TextArea } = Input;

interface DeviceDetailProps {}

const DeviceDetail: React.FC<DeviceDetailProps> = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const stateDevice = (location.state as any)?.device as Device | undefined;
  const isEdit = !!id;

  // 获取设备详情
  const fetchDeviceDetail = async (deviceId: string) => {
    setLoading(true);
    try {
      const { data, error } = await localDataService.getDeviceById(parseInt(deviceId));
      
      if (error) {
        message.error('获取设备详情失败: ' + error.message);
        return;
      }
      
      form.setFieldsValue(data);
    } catch (error) {
      message.error('获取设备详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 先用路由状态中的设备数据预填，确保与列表一致
    if (stateDevice) {
      form.setFieldsValue(stateDevice);
    }
    if (isEdit && id) {
      fetchDeviceDetail(id);
    }
  }, [id, isEdit, stateDevice]);

  // 提交表单
  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        // 更新设备
        const { error } = await localDataService.updateDevice(parseInt(id!), {
          ...values,
          updated_at: new Date().toISOString()
        });
        
        if (error) {
          message.error('更新设备失败: ' + error.message);
          return;
        }
        
        message.success('更新设备成功');
      } else {
        // 新增设备
        const deviceData = {
          ...values,
          pressure_plate_status: '投入',
          last_changed_by: '',
          last_changed_at: new Date().toISOString(),
          change_remarks: ''
        };
        const { error } = await localDataService.createDevice(deviceData);
        
        if (error) {
          message.error('新增设备失败: ' + error.message);
          return;
        }
        
        message.success('新增设备成功');
      }
      
      navigate('/devices');
    } catch (error) {
      message.error(isEdit ? '更新设备失败' : '新增设备失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '16px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/devices')}
            >
              返回
            </Button>
            <span>{isEdit ? '编辑设备' : '新增设备'}</span>
          </Space>
        }
        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'hard',
            pressure_plate_box: 'XXXX',
            pressure_plate_time: '投入、退出'
          }}
        >
          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item
                label="序号"
                name="sequence"
                rules={[{ required: true, message: '请输入序号' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入序号"
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="所属电站"
                name="power_station"
                rules={[{ required: true, message: '请输入所属电站' }]}
              >
                <Input placeholder="请输入所属电站" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col span={24}>
              <Form.Item
                label="保护屏"
                name="protection_screen"
                rules={[{ required: true, message: '请输入保护屏' }]}
              >
                <Input placeholder="请输入保护屏" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item
                label="设备问题"
                name="device_issue"
                rules={[{ required: true, message: '请输入设备问题' }]}
              >
                <Input placeholder="请输入设备问题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="压板名称"
                name="pressure_plate_name"
                rules={[{ required: true, message: '请输入压板名称' }]}
              >
                <Input placeholder="请输入压板名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item
                label="类型"
                name="type"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select placeholder="请选择类型">
                  <Option value="soft">软压板</Option>
                  <Option value="hard">硬压板</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="压板术语"
                name="pressure_plate_box"
              >
                <Input placeholder="请输入压板术语" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col span={24}>
              <Form.Item
                label="压板动词"
                name="pressure_plate_time"
                rules={[{ required: true, message: '请输入压板动词' }]}
              >
                <Input placeholder="请输入压板动词（如：投入、退出）" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col span={24}>
              <Form.Item
                label="压板总称"
                name="pressure_plate_general_name"
                rules={[{ required: true, message: '请输入压板总称' }]}
              >
                <Input placeholder="请输入压板总称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item 
                label="压板颜色"
                name="pressure_plate_type_color"
                rules={[{ required: true, message: '请选择压板颜色' }]}
              >
                <Select placeholder="请选择压板颜色">
                  <Option value="red">红</Option>
                  <Option value="yellow">黄</Option>
                  <Option value="gray">黑</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="压板位置"
                name="pressure_plate_position"
                rules={[{ required: true, message: '请选择压板位置' }]}
              >
                <Select placeholder="请选择压板位置">
                  <Option value="top">上</Option>
                  <Option value="middle">中</Option>
                  <Option value="bottom">下</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Form.Item
                label="压板位置X轴"
                name="pressure_plate_position_x"
                rules={[{ required: true, message: '请输入压板位置X轴' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入X轴坐标"
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="压板位置Y轴"
                name="pressure_plate_position_y"
                rules={[{ required: true, message: '请输入压板位置Y轴' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入Y轴坐标"
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col span={24}>
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    icon={<SaveOutlined />}
                    style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2' }}
                  >
                    {isEdit ? '更新' : '保存'}
                  </Button>
                  <Button onClick={() => navigate('/devices')}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default DeviceDetail;
