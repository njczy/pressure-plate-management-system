import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Select, Button, Space, Row, Col } from 'antd';
import { MinusOutlined, ExpandOutlined, CloseOutlined } from '@ant-design/icons';
import './PressurePlateTerminologyModal.css';
import { getTerminologyConfig, setTerminologyConfig, TerminologyKey } from '../lib/terminologyConfig';

const { Option } = Select;

interface PressurePlateTerminologyModalProps {
  visible: boolean;
  onClose: () => void;
}

const PressurePlateTerminologyModal: React.FC<PressurePlateTerminologyModalProps> = ({
  visible,
  onClose
}) => {
  // 所有可选项
  const allOptions = ['保护屏', '设备间隔', '压板名称'];

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

  // 下拉框可选项：每个下拉都固定提供三项，不互斥
  const hardPlateOptions = useMemo(() => ({
    protectionScreen: allOptions,
    deviceInterval: allOptions,
    plateName: allOptions
  }), []);

  const softPlateOptions = useMemo(() => ({
    protectionScreen: allOptions,
    deviceInterval: allOptions,
    plateName: allOptions
  }), []);

  // 初始化为已保存的配置
  useEffect(() => {
    if (visible) {
      const cfg = getTerminologyConfig();
      // 将数组顺序映射回三个框；保留原对象 status 字段
      const getValues = (arr: TerminologyKey[]) => ({
        protectionScreen: (arr[0] || '') as any,
        deviceInterval: (arr[1] || '') as any,
        plateName: (arr[2] || '') as any
      });
      setHardPlateConfig(prev => ({ ...prev, ...getValues(cfg.hard) }));
      setSoftPlateConfig(prev => ({ ...prev, ...getValues(cfg.soft) }));
    }
  }, [visible]);

  const handleConfirm = () => {
    // 读取三个框的顺序，空值自动过滤
    const hardOrder: TerminologyKey[] = [
      hardPlateConfig.protectionScreen,
      hardPlateConfig.deviceInterval,
      hardPlateConfig.plateName
    ].filter(Boolean) as TerminologyKey[];
    const softOrder: TerminologyKey[] = [
      softPlateConfig.protectionScreen,
      softPlateConfig.deviceInterval,
      softPlateConfig.plateName
    ].filter(Boolean) as TerminologyKey[];

    setTerminologyConfig({ hard: hardOrder, soft: softOrder });
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
        backgroundColor: '#0f8a80',
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
              allowClear
            >
              {hardPlateOptions.protectionScreen.map(option => (
                <Option key={option} value={option}>{option}</Option>
              ))}
            </Select>
            <span className="config-separator">+</span>
            <Select
              placeholder="设备间隔"
              style={{ width: 120 }}
              size="small"
              value={hardPlateConfig.deviceInterval}
              onChange={(value) => setHardPlateConfig(prev => ({ ...prev, deviceInterval: value }))}
              allowClear
            >
              {hardPlateOptions.deviceInterval.map(option => (
                <Option key={option} value={option}>{option}</Option>
              ))}
            </Select>
            <span className="config-separator">+</span>
            <Select
              placeholder="压板名称"
              style={{ width: 120 }}
              size="small"
              value={hardPlateConfig.plateName}
              onChange={(value) => setHardPlateConfig(prev => ({ ...prev, plateName: value }))}
              allowClear
            >
              {hardPlateOptions.plateName.map(option => (
                <Option key={option} value={option}>{option}</Option>
              ))}
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
              allowClear
            >
              {softPlateOptions.protectionScreen.map(option => (
                <Option key={option} value={option}>{option}</Option>
              ))}
            </Select>
            <span className="config-separator">+</span>
            <Select
              placeholder="设备间隔"
              style={{ width: 120 }}
              size="small"
              value={softPlateConfig.deviceInterval}
              onChange={(value) => setSoftPlateConfig(prev => ({ ...prev, deviceInterval: value }))}
              allowClear
            >
              {softPlateOptions.deviceInterval.map(option => (
                <Option key={option} value={option}>{option}</Option>
              ))}
            </Select>
            <span className="config-separator">+</span>
            <Select
              placeholder="压板名称"
              style={{ width: 120 }}
              size="small"
              value={softPlateConfig.plateName}
              onChange={(value) => setSoftPlateConfig(prev => ({ ...prev, plateName: value }))}
              allowClear
            >
              {softPlateOptions.plateName.map(option => (
                <Option key={option} value={option}>{option}</Option>
              ))}
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
              style={{ backgroundColor: '#0f8a80', borderColor: '#0f8a80' }}
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
