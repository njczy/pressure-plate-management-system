import React, { useState } from 'react';
import { Modal, Select, Button, Space, Row, Col } from 'antd';
import { MinusOutlined, ExpandOutlined, CloseOutlined } from '@ant-design/icons';
import './PressurePlateTerminologyModal.css';

const { Option } = Select;

interface PressurePlateTerminologyModalProps {
  visible: boolean;
  onClose: () => void;
}

const PressurePlateTerminologyModal: React.FC<PressurePlateTerminologyModalProps> = ({
  visible,
  onClose
}) => {
  const [hardPlateConfig, setHardPlateConfig] = useState({
    status: '',
    protectionScreen: '',
    deviceInterval: '',
    plateName: ''
  });

  const [softPlateConfig, setSoftPlateConfig] = useState({
    status: '',
    protectionScreen: '',
    deviceInterval: '',
    plateName: ''
  });

  const handleConfirm = () => {
    // 处理确定逻辑
    console.log('硬压板配置:', hardPlateConfig);
    console.log('软压板配置:', softPlateConfig);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      closable={false}
      styles={{
        body: { padding: 0 },
        header: { padding: 0 }
      }}
      className="pressure-plate-modal"
    >
      <div style={{ 
        backgroundColor: '#5a9f9f',
        color: 'white',
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>压板术语配置</span>
        <div className="window-controls">
          <Button
            type="text"
            size="small"
            icon={<MinusOutlined />}
          />
          <Button
            type="text"
            size="small"
            icon={<ExpandOutlined />}
          />
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={onClose}
          />
        </div>
      </div>
      
      <div style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
        {/* 硬压板术语配置 */}
        <div style={{ marginBottom: '24px' }}>
          <div className="config-row">
            <span className="config-label">硬压板术语：</span>
            <span className="config-text">压板状态</span>
            <span className="config-separator">+</span>
            <Select
              placeholder="保护屏"
              style={{ width: 120 }}
              size="small"
              value={hardPlateConfig.protectionScreen}
              onChange={(value) => setHardPlateConfig(prev => ({ ...prev, protectionScreen: value }))}
            >
              <Option value="保护屏">保护屏</Option>
              <Option value="设备间隔">设备间隔</Option>
              <Option value="压板名称">压板名称</Option>
            </Select>
            <span className="config-separator">+</span>
            <Select
              placeholder="设备间隔"
              style={{ width: 120 }}
              size="small"
              value={hardPlateConfig.deviceInterval}
              onChange={(value) => setHardPlateConfig(prev => ({ ...prev, deviceInterval: value }))}
            >
              <Option value="保护屏">保护屏</Option>
              <Option value="设备间隔">设备间隔</Option>
              <Option value="压板名称">压板名称</Option>
            </Select>
            <span className="config-separator">+</span>
            <Select
              placeholder="压板名称"
              style={{ width: 120 }}
              size="small"
              value={hardPlateConfig.plateName}
              onChange={(value) => setHardPlateConfig(prev => ({ ...prev, plateName: value }))}
            >
              <Option value="保护屏">保护屏</Option>
              <Option value="设备间隔">设备间隔</Option>
              <Option value="压板名称">压板名称</Option>
            </Select>
            <span className="config-separator">+</span>
            <span className="config-result">压板</span>
          </div>
        </div>

        {/* 软压板术语配置 */}
        <div style={{ marginBottom: '32px' }}>
          <div className="config-row">
            <span className="config-label">软压板术语：</span>
            <span className="config-text">压板状态</span>
            <span className="config-separator">+</span>
            <Select
              placeholder="保护屏"
              style={{ width: 120 }}
              size="small"
              value={softPlateConfig.protectionScreen}
              onChange={(value) => setSoftPlateConfig(prev => ({ ...prev, protectionScreen: value }))}
            >
              <Option value="保护屏">保护屏</Option>
              <Option value="设备间隔">设备间隔</Option>
              <Option value="压板名称">压板名称</Option>
            </Select>
            <span className="config-separator">+</span>
            <Select
              placeholder="设备间隔"
              style={{ width: 120 }}
              size="small"
              value={softPlateConfig.deviceInterval}
              onChange={(value) => setSoftPlateConfig(prev => ({ ...prev, deviceInterval: value }))}
            >
              <Option value="保护屏">保护屏</Option>
              <Option value="设备间隔">设备间隔</Option>
              <Option value="压板名称">压板名称</Option>
            </Select>
            <span className="config-separator">+</span>
            <Select
              placeholder="压板名称"
              style={{ width: 120 }}
              size="small"
              value={softPlateConfig.plateName}
              onChange={(value) => setSoftPlateConfig(prev => ({ ...prev, plateName: value }))}
            >
              <Option value="保护屏">保护屏</Option>
              <Option value="设备间隔">设备间隔</Option>
              <Option value="压板名称">压板名称</Option>
            </Select>
            <span className="config-separator">+</span>
            <span className="config-result">软压板</span>
          </div>
        </div>

        {/* 底部按钮 */}
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel}>取消</Button>
            <Button 
              type="primary" 
              style={{ backgroundColor: '#5a9f9f', borderColor: '#5a9f9f' }}
              onClick={handleConfirm}
            >
              确定
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default PressurePlateTerminologyModal;