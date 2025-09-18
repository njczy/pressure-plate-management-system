import React, { useEffect, useMemo, useState, useLayoutEffect } from 'react';
import { Button, DatePicker, Input, Modal, Pagination, Select, Space, Table, message, Drawer } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { Device, localDataService } from '../lib/localData';
import '../pages/DeviceManagement.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

export interface UpdateLogsModalProps {
  visible: boolean;
  onClose: () => void;
  deviceId?: number; // 不传则展示全部日志
}

interface LogItem {
  id: number;
  sequence: number;
  power_station: string;
  protection_screen: string;
  device_issue: string;
  pressure_plate_name: string;
  type: 'soft' | 'hard';
  change_type: string;
  change_source: string;
  change_time: string; // ISO string
  pressure_plate_status: string;
  hidden?: boolean; // 删除仅隐藏
}

const UpdateLogsModal: React.FC<UpdateLogsModalProps> = ({ visible, onClose, deviceId }) => {
  const [baseDevice, setBaseDevice] = useState<Device | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // filters
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [changeType, setChangeType] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [source, setSource] = useState<string>('');

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreRange, setRestoreRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  // 动态尺寸（与右侧区域一致）
  const [modalWidth, setModalWidth] = useState<number | string>('100%');
  const [modalBodyMaxH, setModalBodyMaxH] = useState<number | undefined>(undefined);
  const [modalLeft, setModalLeft] = useState<number>(0);
  const [modalTop, setModalTop] = useState<number>(0);

  const fetchBase = async () => {
    if (!visible) return;
    setLoading(true);
    try {
      if (!deviceId) {
        const { data: allLogs } = await localDataService.getUpdateLogs();
        setBaseDevice(null);
        setLogs(allLogs || []);
      } else {
        const { data, error } = await localDataService.getDeviceById(deviceId);
        if (error || !data) {
          message.error('未找到设备，无法展示日志');
          setLogs([]);
        } else {
          setBaseDevice(data);
          const { data: deviceLogs } = await localDataService.getUpdateLogs({ deviceId });
          setLogs(deviceLogs || []);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, deviceId]);

  // 当弹窗可见时，强制覆盖整个网页右侧区域
  useLayoutEffect(() => {
    if (!visible) return;
    const calc = () => {
      const sider = document.querySelector('.ml-sider') as HTMLElement | null;
      
      if (!sider) return;
      
      const siderRect = sider.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      
      // 弹框从左侧导航栏右边开始，占据剩余的所有宽度
      setModalWidth(windowWidth - siderRect.width);
      setModalBodyMaxH(window.innerHeight);
      setModalLeft(Math.floor(siderRect.width));
      setModalTop(0);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [visible]);

  const filtered = useMemo(() => {
    return logs.filter(item => {
      if (item.hidden) return false;
      if (changeType && item.change_type !== changeType) return false;
      if (status && item.pressure_plate_status !== status) return false;
      if (source && !item.change_source.includes(source)) return false;
      if (range && (range[0] || range[1])) {
        const ts = dayjs(item.change_time);
        const start = range[0] ? (range[0] as Dayjs).startOf('day') : null;
        const end = range[1] ? (range[1] as Dayjs).endOf('day') : null;
        if (start && ts.isBefore(start)) return false;
        if (end && ts.isAfter(end)) return false;
      }
      return true;
    });
  }, [logs, changeType, status, source, range]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const columns: ColumnsType<LogItem> = [
    { title: '序号', dataIndex: 'sequence', key: 'sequence', width: 70, align: 'center' },
    { title: '所属电站', dataIndex: 'power_station', key: 'power_station', width: 120 },
    { title: '保护屏', dataIndex: 'protection_screen', key: 'protection_screen', width: 120 },
    { title: '设备间隔', dataIndex: 'device_issue', key: 'device_issue', width: 140 },
    { title: '压板名称', dataIndex: 'pressure_plate_name', key: 'pressure_plate_name', width: 220 },
    { title: '压板类型', dataIndex: 'type', key: 'type', width: 90, render: (t: string) => t === 'soft' ? '软压板' : '硬压板' },
    { title: '变更类型', dataIndex: 'change_type', key: 'change_type', width: 100 },
    { title: '变更来源', dataIndex: 'change_source', key: 'change_source', width: 120 },
    { title: '变更时间', dataIndex: 'change_time', key: 'change_time', width: 170, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    { title: '保护压板状态', dataIndex: 'pressure_plate_status', key: 'pressure_plate_status', width: 120 },
  ];

  const handleExport = () => {
    const header = ['序号','所属电站','保护屏','设备间隔','压板名称','压板类型','变更类型','变更来源','变更时间','保护压板状态'];
    const rows = filtered.map(r => [
      r.sequence,
      r.power_station,
      r.protection_screen,
      r.device_issue,
      r.pressure_plate_name,
      r.type === 'soft' ? '软压板' : '硬压板',
      r.change_type,
      r.change_source,
      dayjs(r.change_time).format('YYYY-MM-DD HH:mm:ss'),
      r.pressure_plate_status
    ]);
    const csv = [header.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '更新日志.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 删除=隐藏所选日志
  const handleHideSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的日志');
      return;
    }
    await localDataService.setLogsHiddenByIds(selectedRowKeys as number[], true);
    const { data: refreshed } = await localDataService.getUpdateLogs(deviceId ? { deviceId } : undefined);
    setLogs(refreshed || []);
    setSelectedRowKeys([]);
    message.success('已隐藏所选日志');
  };

  // 打开恢复弹窗：默认选中最近的隐藏日志日期
  const openRestoreModal = () => {
    const hiddenLogs = logs.filter(l => l.hidden);
    if (hiddenLogs.length === 0) {
      message.info('没有被隐藏的日志');
      return;
    }
    const latest = hiddenLogs.reduce((acc, cur) => {
      const ts = dayjs(cur.change_time);
      return !acc || ts.isAfter(acc) ? ts : acc;
    }, null as dayjs.Dayjs | null);
    const d = latest ? latest.startOf('day') : null;
    setRestoreRange(d ? [d, d] : [null, null]);
    setRestoreModalOpen(true);
  };

  // 根据选择的日期恢复隐藏日志（到天）
  const handleConfirmRestore = async () => {
    if (!restoreRange || (!restoreRange[0] && !restoreRange[1])) {
      message.warning('请选择要恢复的日期范围');
      return;
    }
    const start = restoreRange[0] ? (restoreRange[0] as Dayjs).startOf('day').toISOString() : null;
    const end = restoreRange[1] ? (restoreRange[1] as Dayjs).endOf('day').toISOString() : null;
    const res = await localDataService.setLogsHiddenByRange(deviceId || null, start, end, false);
    setRestoreModalOpen(false);
    const { data: refreshed } = await localDataService.getUpdateLogs(deviceId ? { deviceId } : undefined);
    setLogs(refreshed || []);
    if ((res.data || 0) > 0) {
      message.success(`已恢复 ${res.data} 条所选范围内的日志`);
    } else {
      message.info('所选日期没有被隐藏的日志');
    }
  };

  return (
    <Modal
      className="dm-modal logs-modal-fill"
      title={<span style={{ color: '#fff', fontWeight: 600 }}>更新日志{baseDevice ? ` - ${baseDevice.pressure_plate_name}` : ''}</span>}
      open={visible}
      onCancel={onClose}
      width={modalWidth}
      footer={null}
      centered={false}
      mask={false}
      closable
      closeIcon={<CloseOutlined style={{ color: '#fff' }} />}
      getContainer={() => document.body}
      zIndex={2000}
      style={{ 
        top: 0,
        left: modalLeft,
        right: 0,
        bottom: 0,
        margin: 0,
        position: 'fixed',
        height: '100vh',
        width: modalWidth
      }}
      styles={{ 
        header: { background: '#0f8a80', color: '#fff', padding: '8px 16px', height: '48px', lineHeight: '32px' }, 
        body: { paddingTop: 0, height: 'calc(100vh - 48px)', overflow: 'hidden' } 
      }}
    >
      <div className="dm-right" style={{ height: '100%' }}>
        {/* 顶部筛选栏（标题已在 Drawer Header，移除重复标题行） */}
        <div className="dm-top">
          <div className="dm-filters">
            <Space wrap style={{ width: '100%' }} size={12}>
              <div className="dm-filter-item" style={{ minWidth: 260 }}>
                <label>变更时间</label>
                <RangePicker 
                  style={{ width: '100%' }} 
                  format="YYYY-MM-DD"
                  value={range as any} 
                  onChange={(v) => setRange(v as any)} 
                />
              </div>
              <div className="dm-filter-item" style={{ minWidth: 200 }}>
                <label>变更类型</label>
                <Select allowClear placeholder="请选择" style={{ width: '100%' }} value={changeType} onChange={setChangeType}>
                  <Option value="手动变更">手动变更</Option>
                  <Option value="系统变更">系统变更</Option>
                </Select>
              </div>
              <div className="dm-filter-item" style={{ minWidth: 200 }}>
                <label>保护压板状态</label>
                <Select allowClear placeholder="请选择" style={{ width: '100%' }} value={status} onChange={setStatus}>
                  <Option value="投入">投入</Option>
                  <Option value="退出">退出</Option>
                </Select>
              </div>
              <div className="dm-filter-item" style={{ minWidth: 220 }}>
                <label>变更来源</label>
                <Input placeholder="请输入变更来源" value={source} onChange={(e) => setSource(e.target.value)} />
              </div>
            </Space>
          </div>
          <div className="dm-filter-actions" style={{ marginTop: 8 }}>
            <Button onClick={() => { setRange(null); setChangeType(undefined); setStatus(undefined); setSource(''); }}>重置</Button>
            <Button type="primary" style={{ backgroundColor: '#0f8a80', borderColor: '#0f8a80' }} onClick={() => setPage(1)}>查询</Button>
          </div>
        </div>

        {/* 工具条 */}
        <div className="dm-toolbar">
          <Space>
            <Button onClick={handleExport}>导出</Button>
            <Button
              type="primary"
              style={{ backgroundColor: '#0f8a80', borderColor: '#0f8a80' }}
              onClick={() => {
                if (selectedRowKeys.length === 0) {
                  message.warning('请先选择要删除的日志');
                  return;
                }
                Modal.confirm({
                  title: '确认删除',
                  content: `将隐藏选中的 ${selectedRowKeys.length} 条日志，是否继续？`,
                  okText: '删除',
                  cancelText: '取消',
                  centered: true,
                  okButtonProps: { style: { backgroundColor: '#0f8a80', borderColor: '#0f8a80' } },
                  onOk: () => handleHideSelected(),
                });
              }}
            >
              删除
            </Button>
            <Button type="primary" style={{ backgroundColor: '#0f8a80', borderColor: '#0f8a80' }} onClick={openRestoreModal}>恢复</Button>
          </Space>
        </div>

        {/* 表格区域 */}
        <div className="dm-center" style={{ marginTop: 8 }}>
          <div className="dm-table">
            <Table
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
              columns={columns}
              dataSource={paged}
              rowKey={(r) => r.id}
              loading={loading}
              pagination={false}
              size="middle"
              scroll={{ x: 900, y: Math.max(300, (modalBodyMaxH || 0) - 260) }}
            />
          </div>
        </div>

        {/* 分页 */}
        <div className="dm-bottom">
          <div className="dm-pagination">
            <Space size={12} align="center">
              <span className="dm-total">共 {filtered.length} 条</span>
              <Select size="small" value={pageSize} style={{ width: 100 }} onChange={(v) => { setPageSize(v); setPage(1); }} options={[10,20,50,100].map(v => ({ value: v, label: `${v}条/页` }))} />
              <Pagination
                simple={false}
                current={page}
                pageSize={pageSize}
                total={filtered.length}
                showSizeChanger={false}
                onChange={(p) => setPage(p)}
              />
            </Space>
          </div>
        </div>
      </div>

      {/* 恢复弹窗 */}
      <Modal
        title="选择恢复日期"
        open={restoreModalOpen}
        onCancel={() => setRestoreModalOpen(false)}
        onOk={handleConfirmRestore}
        okText="恢复"
        cancelText="取消"
        centered
        width={340}
        okButtonProps={{ style: { backgroundColor: '#0f8a80', borderColor: '#0f8a80' } }}
        getContainer={() => (document.querySelector('.dm-right') as HTMLElement) || document.body}
      >
        <div style={{ marginTop: 8 }}>
          <RangePicker
            value={restoreRange as any}
            onChange={(v) => setRestoreRange(v as any)}
            style={{ width: 260 }}
            format="YYYY-MM-DD"
          />
        </div>
      </Modal>
    </Modal>
  );
};

export default UpdateLogsModal;
