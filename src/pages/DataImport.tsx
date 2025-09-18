import React, { useState } from 'react';
import {
  Card,
  Upload,
  Button,
  Table,
  message,
  Space,
  Progress,
  Alert,
  Divider,
  Typography
} from 'antd';
import {
  InboxOutlined,
  DownloadOutlined,
  UploadOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { localDataService, Device } from '../lib/localData';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface ImportData {
  sequence: number;
  power_station: string;
  protection_screen: string;
  device_issue: string;
  pressure_plate_name: string;
  type: string;
  pressure_plate_box: string;
  pressure_plate_time: string;
  status?: 'success' | 'error';
  error?: string;
}

const DataImport: React.FC = () => {
  const [importData, setImportData] = useState<ImportData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  // 解析Excel文件
  const parseExcelFile = (file: File): Promise<ImportData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // 这里简化处理，实际项目中需要使用xlsx库解析Excel
          // 模拟解析结果
          const mockData: ImportData[] = [
            {
              sequence: 7,
              power_station: '溪洛渡变',
              protection_screen: '测试保护屏',
              device_issue: '测试设备问题',
              pressure_plate_name: '测试压板名称',
              type: 'hard',
              pressure_plate_box: 'XXXX',
              pressure_plate_time: '投入、退出'
            }
          ];
          resolve(mockData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  };

  // 上传文件处理
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    
    setUploading(true);
    try {
      const data = await parseExcelFile(file as File);
      setImportData(data);
      message.success('文件解析成功');
      onSuccess?.(data);
    } catch (error) {
      message.error('文件解析失败');
      onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  // 执行导入
  const handleImport = async () => {
    if (importData.length === 0) {
      message.warning('请先上传文件');
      return;
    }

    setImporting(true);
    setProgress(0);
    
    const results: ImportData[] = [];
    
    for (let i = 0; i < importData.length; i++) {
      const item = importData[i];
      try {
        const { error } = await localDataService.createDevice({
          sequence: item.sequence,
          power_station: item.power_station,
          protection_screen: item.protection_screen,
          device_issue: item.device_issue,
          pressure_plate_name: item.pressure_plate_name,
          pressure_plate_general_name: item.pressure_plate_name,
          // 统一为硬压板
          type: 'hard',
          pressure_plate_box: item.pressure_plate_box,
          pressure_plate_time: item.pressure_plate_time,
          pressure_plate_status: '投入',
          pressure_plate_position: 'middle',
          pressure_plate_position_x: 1,
          pressure_plate_position_y: 1,
          pressure_plate_type_color: 'red',
          last_changed_by: '',
          last_changed_at: new Date().toISOString(),
          change_remarks: ''
        });
        
        if (error) {
          results.push({ ...item, status: 'error', error: error.message });
        } else {
          results.push({ ...item, status: 'success' });
        }
      } catch (error) {
        results.push({ ...item, status: 'error', error: '导入失败' });
      }
      
      setProgress(Math.round(((i + 1) / importData.length) * 100));
    }
    
    setImportData(results);
    setImporting(false);
    
    const successCount = results.filter(item => item.status === 'success').length;
    const errorCount = results.filter(item => item.status === 'error').length;
    
    if (errorCount === 0) {
      message.success(`导入成功！共导入 ${successCount} 条数据`);
    } else {
      message.warning(`导入完成！成功 ${successCount} 条，失败 ${errorCount} 条`);
    }
  };

  // 下载模板
  const downloadTemplate = () => {
    // 创建模板数据
    const templateData = [
      ['序号', '所属电站', '保护屏', '设备问题', '压板名称', '类型', '压板术语', '压板动词'],
      [1, '溪洛渡变', '示例保护屏', '示例设备问题', '示例压板名称', 'hard', 'XXXX', '投入、退出']
    ];
    
    // 创建CSV内容
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
    }
  };

  // 表格列定义
  const columns: ColumnsType<ImportData> = [
    {
      title: '序号',
      dataIndex: 'sequence',
      key: 'sequence',
      width: 80
    },
    {
      title: '所属电站',
      dataIndex: 'power_station',
      key: 'power_station',
      width: 120
    },
    {
      title: '保护屏',
      dataIndex: 'protection_screen',
      key: 'protection_screen',
      width: 200,
      ellipsis: true
    },
    {
      title: '设备问题',
      dataIndex: 'device_issue',
      key: 'device_issue',
      width: 150,
      ellipsis: true
    },
    {
      title: '压板名称',
      dataIndex: 'pressure_plate_name',
      key: 'pressure_plate_name',
      width: 200,
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
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
      width: 100
    },
    {
      title: '压板动词',
      dataIndex: 'pressure_plate_time',
      key: 'pressure_plate_time',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: ImportData) => {
        if (!status) return '-';
        if (status === 'success') {
          return <span style={{ color: '#52c41a' }}>成功</span>;
        }
        return (
          <span style={{ color: '#ff4d4f' }} title={record.error}>
            失败
          </span>
        );
      }
    }
  ];

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
            <span>数据导入</span>
          </Space>
        }
        style={{ marginBottom: '16px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      >
        <Alert
          message="导入说明"
          description="请下载模板文件，按照模板格式填写数据后上传。支持Excel(.xlsx)和CSV(.csv)格式文件。"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Space style={{ marginBottom: '16px' }}>
          <Button
            icon={<DownloadOutlined />}
            onClick={downloadTemplate}
          >
            下载模板
          </Button>
        </Space>
        
        <Dragger
          name="file"
          multiple={false}
          accept=".xlsx,.xls,.csv"
          customRequest={handleUpload}
          showUploadList={false}
          disabled={uploading}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {uploading ? '解析中...' : '点击或拖拽文件到此区域上传'}
          </p>
          <p className="ant-upload-hint">
            支持Excel(.xlsx)和CSV(.csv)格式文件
          </p>
        </Dragger>
      </Card>

      {importData.length > 0 && (
        <Card
          title="预览数据"
          extra={
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={importing}
              onClick={handleImport}
              style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2' }}
            >
              开始导入
            </Button>
          }
          style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          {importing && (
            <div style={{ marginBottom: '16px' }}>
              <Text>导入进度：</Text>
              <Progress percent={progress} status="active" />
            </div>
          )}
          
          <Table
            columns={columns}
            dataSource={importData}
            rowKey={(record, index) => index?.toString() || '0'}
            pagination={false}
            scroll={{ x: 1200 }}
            size="middle"
          />
        </Card>
      )}
    </div>
  );
};

export default DataImport;
