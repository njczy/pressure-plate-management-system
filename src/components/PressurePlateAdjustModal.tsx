import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { Device, localDataService } from '../lib/localData';

const { TextArea } = Input;
const { Option } = Select;

interface PressurePlateAdjustModalProps {
  visible: boolean;
  onClose: () => void;
  device?: Device | null;
  onSuccess?: () => void; // 成功保存后的回调函数
}

const PressurePlateAdjustModal: React.FC<PressurePlateAdjustModalProps> = ({
  visible,
  onClose,
  device,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 当弹窗打开时，填充设备信息
  useEffect(() => {
    if (visible && device) {
      console.log('填充设备数据:', device); // 调试日志
      form.setFieldsValue({
        powerStation: device.power_station || '邳蒋青山泉变',
        voltageLevel: '220KV',
        maintenanceTeam: '华能电站运维班组',
        protectionScreen: device.protection_screen || '',
        deviceInterval: device.device_issue || '',
        pressurePlateName: device.pressure_plate_name || '',
        type: device.type === 'soft' ? '软压板' : '硬压板',
        changer: '运维人员张三',
        pressurePlateStatus: device.pressure_plate_status || '投入',
        remarks: ''
      });
    } else if (visible && !device) {
      // 如果没有设备数据，显示默认值
      form.setFieldsValue({
        powerStation: '邳蒋青山泉变',
        voltageLevel: '220KV',
        maintenanceTeam: '华能电站运维班组',
        protectionScreen: '',
        deviceInterval: '',
        pressurePlateName: '',
        type: '',
        changer: '运维人员张三',
        pressurePlateStatus: '投入',
        remarks: ''
      });
    }
  }, [visible, device, form]);

  // 处理确定按钮
  const handleOk = async () => {
    try {
      setLoading(true);
      console.log('=== 开始压板状态调整流程 ===');
      
      const values = await form.validateFields();
      console.log('表单验证通过，表单值:', values);
      
      if (!device) {
        console.error('设备信息为空');
        message.error('未找到设备信息');
        setLoading(false);
        return;
      }
      
      console.log('当前设备信息:', device);

      // 先测试读取当前数据
      console.log('测试读取设备数据 ID:', device.id);
      const { data: currentData, error: readError } = await localDataService.getDeviceById(device.id);

      console.log('当前设备数据:', currentData);
      console.log('读取错误:', readError);

      if (readError) {
        console.error('读取设备数据失败:', readError);
        message.error(`读取设备数据失败: ${readError.message}`);
        setLoading(false);
        return;
      }

      // 准备更新数据
      const statusValue = values.pressurePlateStatus;
      const changerValue = values.changer || '系统用户';
      const remarksValue = values.remarks || '';
      
      console.log('准备更新的数据:');
      console.log('- 压板状态:', statusValue);
      console.log('- 变更人:', changerValue);
      console.log('- 备注:', remarksValue);
      console.log('- 设备ID:', device.id);

      // 执行本地数据更新
      console.log('开始执行本地数据更新...');
      
      const { data, error } = await localDataService.updateDevice(device.id, {
        pressure_plate_status: statusValue,
        last_changed_by: changerValue,
        last_changed_at: new Date().toISOString(),
        change_remarks: remarksValue
      });
      
      console.log('本地数据更新结果:', { data, error });

      if (error) {
        console.error('本地数据更新失败:', error);
        message.error(`压板状态调整失败: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log('本地数据更新成功:', data);
      // 追加更新日志记录
      console.log('写入更新日志...');
      await localDataService.addUpdateLog({
        device_id: device.id,
        power_station: device.power_station,
        protection_screen: device.protection_screen,
        device_issue: device.device_issue,
        pressure_plate_name: device.pressure_plate_name,
        type: device.type,
        change_type: '手动变更',
        change_source: changerValue,
        change_time: new Date().toISOString(),
        pressure_plate_status: statusValue,
      });
      message.success('压板状态调整成功');
      
      // 调用成功回调，刷新父组件数据
      console.log('调用成功回调函数...');
      if (onSuccess) {
        onSuccess();
      }
      
      console.log('关闭弹窗...');
      onClose();
      console.log('=== 压板状态调整流程完成 ===');
    } catch (error) {
      console.error('操作异常:', error);
      message.error('操作失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 处理取消按钮
  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width="70%"
      centered
      closable={false}
      className="pressure-plate-adjust-modal"
      styles={{
        body: { padding: 0 }
      }}
    >
      {/* 自定义头部 */}
      <div
        style={{
          backgroundColor: '#0f8a80',
          color: 'white',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 500 }}>压板调整</span>
        <Button 
          type="text" 
          size="small" 
          icon={<CloseOutlined />} 
          onClick={handleCancel}
          style={{ color: 'white' }}
        />
      </div>

      {/* 表单内容 */}
      <div style={{ padding: '20px' }}>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* 左列 */}
            <div>
              <Form.Item 
                label={<span><span style={{ color: 'red' }}>*</span>变电站</span>}
                name="powerStation"
                rules={[{ required: true, message: '请输入变电站' }]}
              >
                <Input 
                  style={{ 
                    backgroundColor: '#e8e8e8', 
                    color: '#666',
                    border: 'none'
                  }} 
                  readOnly 
                />
              </Form.Item>

              <Form.Item 
                label={<span><span style={{ color: 'red' }}>*</span>电压等级</span>}
                name="voltageLevel"
                rules={[{ required: true, message: '请选择电压等级' }]}
              >
                <Input 
                  style={{ 
                    backgroundColor: '#e8e8e8', 
                    color: '#666',
                    border: 'none'
                  }} 
                  readOnly 
                />
              </Form.Item>

              <Form.Item 
                label={<span><span style={{ color: 'red' }}>*</span>运维班组</span>}
                name="maintenanceTeam"
                rules={[{ required: true, message: '请输入运维班组' }]}
              >
                <Input 
                  style={{ 
                    backgroundColor: '#e8e8e8', 
                    color: '#666',
                    border: 'none'
                  }} 
                  readOnly 
                />
              </Form.Item>

              <Form.Item 
                label={<span><span style={{ color: 'red' }}>*</span>保护屏</span>}
                name="protectionScreen"
                rules={[{ required: true, message: '请输入保护屏' }]}
              >
                <Input 
                  placeholder="请输入保护屏名称" 
                  readOnly 
                  style={{ 
                    backgroundColor: '#e8e8e8', 
                    color: '#666',
                    border: 'none'
                  }} 
                />
              </Form.Item>

              <Form.Item 
                label={<span><span style={{ color: 'red' }}>*</span>变更人</span>}
                name="changer"
                rules={[{ required: true, message: '请输入变更人' }]}
              >
                <Input 
                  placeholder="请输入变更人姓名" 
                  readOnly 
                  style={{ 
                    backgroundColor: '#e8e8e8', 
                    color: '#666',
                    border: 'none'
                  }} 
                />
              </Form.Item>
            </div>

            {/* 右列 */}
            <div>
              <Form.Item 
                label={<span><span style={{ color: 'red' }}>*</span>设备间隔</span>}
                name="deviceInterval"
                rules={[{ required: true, message: '请输入设备间隔' }]}
              >
                <Input 
                  placeholder="请输入设备间隔名称" 
                  readOnly 
                  style={{ 
                    backgroundColor: '#e8e8e8', 
                    color: '#666',
                    border: 'none'
                  }} 
                />
              </Form.Item>

              <Form.Item 
                label={<span><span style={{ color: 'red' }}>*</span>压板名称</span>}
                name="pressurePlateName"
                rules={[{ required: true, message: '请输入压板名称' }]}
              >
                <Input 
                  placeholder="请输入压板名称" 
                  readOnly 
                  style={{ 
                    backgroundColor: '#e8e8e8', 
                    color: '#666',
                    border: 'none'
                  }} 
                />
              </Form.Item>

              <Form.Item 
                label={<span><span style={{ color: 'red' }}>*</span>类型</span>}
                name="type"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Input 
                  placeholder="压板类型" 
                  readOnly 
                  style={{ 
                    backgroundColor: '#e8e8e8', 
                    color: '#666',
                    border: 'none'
                  }} 
                />
              </Form.Item>

              <Form.Item 
                label={<span><span style={{ color: 'red' }}>*</span>压板状态</span>}
                name="pressurePlateStatus"
                rules={[{ required: true, message: '请选择压板状态' }]}
              >
                <Select placeholder="请选择压板状态">
                  <Option value="投入">投入</Option>
                  <Option value="退出">退出</Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          {/* 备注 - 跨两列 */}
          <Form.Item 
            label="备注"
            name="remarks"
          >
            <TextArea 
              rows={4} 
              placeholder="请输入内容"
              style={{ 
                resize: 'none',
                
              }}
            />
          </Form.Item>
        </Form>

        {/* 底部按钮 */}
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <Space>
            <Button onClick={handleCancel} size="large">
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={handleOk}
              loading={loading}
              size="large"
              style={{ 
                backgroundColor: '#0f8a80', 
                borderColor: '#0f8a80',
                minWidth: '80px'
              }}
            >
              确定
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default PressurePlateAdjustModal;
