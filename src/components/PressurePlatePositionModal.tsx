import React, { useState, useEffect } from 'react';
import { Modal, Card, Row, Col, Spin, message } from 'antd';
import { supabase, Device } from '../lib/supabase';

interface PressurePlatePositionModalProps {
  visible: boolean;
  onClose: () => void;
}

interface PressurePlateGrid {
  [key: string]: Device[];
}

interface ProtectionScreenGrid {
  [screenName: string]: PressurePlateGrid;
}

const PressurePlatePositionModal: React.FC<PressurePlatePositionModalProps> = ({
  visible,
  onClose
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取设备数据
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('pressure_plate_position_x')
        .order('pressure_plate_position_y');
      
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
    if (visible) {
      fetchDevices();
    }
  }, [visible]);

  // 按保护屏和压板位置分组设备
  const groupDevicesByProtectionScreen = (devices: Device[]): ProtectionScreenGrid => {
    const screenGroups: ProtectionScreenGrid = {};

    devices.forEach(device => {
      const screenName = device.protection_screen;
      
      if (!screenGroups[screenName]) {
        screenGroups[screenName] = {
          '上': [],
          '中': [],
          '下': []
        };
      }

      const position = device.pressure_plate_position;
      let positionKey = '';
      
      switch (position) {
        case 'top':
          positionKey = '上';
          break;
        case 'middle':
          positionKey = '中';
          break;
        case 'bottom':
          positionKey = '下';
          break;
        default:
          positionKey = position;
      }
      
      if (screenGroups[screenName][positionKey]) {
        screenGroups[screenName][positionKey].push(device);
      }
    });

    return screenGroups;
  };

  // 创建网格布局
  const createGrid = (devices: Device[], maxRows: number = 4, maxCols: number = 3) => {
    const grid: (Device | null)[][] = [];
    
    // 初始化网格
    for (let i = 0; i < maxRows; i++) {
      grid[i] = new Array(maxCols).fill(null);
    }
    
    // 将设备放置到网格中
    devices.forEach(device => {
      const x = device.pressure_plate_position_x - 1; // 转换为0索引
      const y = device.pressure_plate_position_y - 1; // 转换为0索引
      
      if (x >= 0 && x < maxRows && y >= 0 && y < maxCols) {
        grid[x][y] = device;
      }
    });
    
    return grid;
  };

  // 获取压板颜色
  const getPressurePlateColor = (colorType: string) => {
    switch (colorType) {
      case '红色':
        return '#ff4d4f';
      case '灰色':
        return '#8c8c8c';
      case '黄色':
        return '#faad14';
      default:
        return '#1890ff';
    }
  };

  // 渲染压板格子
  const renderPressurePlate = (device: Device | null, rowIndex: number, colIndex: number) => {
    if (!device) {
      return (
        <div
          key={`empty-${rowIndex}-${colIndex}`}
          style={{
            width: '60px',
            height: '40px',
            border: '1px dashed #d9d9d9',
            borderRadius: '4px',
            margin: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fafafa'
          }}
        >
          <span style={{ color: '#bfbfbf', fontSize: '12px' }}>空</span>
        </div>
      );
    }

    return (
      <div
        key={`device-${device.id}`}
        style={{
          width: '60px',
          height: '40px',
          backgroundColor: getPressurePlateColor(device.pressure_plate_type_color),
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          margin: '2px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        title={`${device.pressure_plate_name}\n位置: (${device.pressure_plate_position_x}, ${device.pressure_plate_position_y})\n颜色: ${device.pressure_plate_type_color}`}
      >
        <div style={{ color: 'white', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', lineHeight: '12px' }}>
          {device.sequence}
        </div>
        <div style={{ color: 'white', fontSize: '8px', textAlign: 'center' }}>
          {device.pressure_plate_position_x},{device.pressure_plate_position_y}
        </div>
      </div>
    );
  };

  // 渲染网格
  const renderGrid = (devices: Device[], title: string) => {
    const grid = createGrid(devices);
    
    return (
      <Card 
        title={title} 
        size="small" 
        style={{ marginBottom: '16px' }}
        headStyle={{ backgroundColor: '#f0f2f5', fontWeight: 'bold' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: 'flex' }}>
              {row.map((device, colIndex) => 
                renderPressurePlate(device, rowIndex, colIndex)
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          共 {devices.length} 个压板
        </div>
      </Card>
    );
  };

  const groupedDevices = groupDevicesByProtectionScreen(devices);

  return (
    <Modal
      title="压板位置示意图"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      style={{ top: 20 }}
    >
      <Spin spinning={loading}>
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#1890ff' }}>保护柜压板布局图</h3>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
              每个格子代表一个压板位置，颜色表示压板类型
            </p>
          </div>
          
          {/* 按保护屏分组展示 */}
          {Object.entries(groupedDevices)
            .sort(([a], [b]) => a.localeCompare(b)) // 按保护屏名称排序
            .map(([screenName, positionGroups], screenIndex) => (
            <div key={screenName} style={{ marginBottom: '24px' }}>
              {/* 保护屏标题 */}
              <div style={{ 
                marginBottom: '16px', 
                padding: '12px 16px',
                backgroundColor: '#f0f2f5',
                borderRadius: '6px',
                borderLeft: '4px solid #1890ff'
              }}>
                <h4 style={{ margin: 0, color: '#1890ff', fontSize: '16px', fontWeight: 'bold' }}>
                  {screenName}
                </h4>
              </div>
              
              {/* 压板位置分组 */}
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  {renderGrid(positionGroups['上'], '上层压板')}
                </Col>
                <Col span={8}>
                  {renderGrid(positionGroups['中'], '中层压板')}
                </Col>
                <Col span={8}>
                  {renderGrid(positionGroups['下'], '下层压板')}
                </Col>
              </Row>
              
              {/* 分隔线 */}
              {screenIndex < Object.keys(groupedDevices).length - 1 && (
                <div style={{ 
                  margin: '24px 0', 
                  height: '1px', 
                  backgroundColor: '#e8e8e8' 
                }} />
              )}
            </div>
          ))}
          
          {/* 颜色说明 */}
          <Card title="颜色说明" size="small" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: '#ff4d4f', borderRadius: '2px' }}></div>
                <span>红色压板</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: '#8c8c8c', borderRadius: '2px' }}></div>
                <span>灰色压板</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: '#faad14', borderRadius: '2px' }}></div>
                <span>黄色压板</span>
              </div>
            </div>
          </Card>
        </div>
      </Spin>
    </Modal>
  );
};

export default PressurePlatePositionModal;