import React, { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Input, Pagination, Select, Space, Table, message, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { Device, localDataService } from '../lib/localData';

const { RangePicker } = DatePicker;
const { Option } = Select;

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

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const UpdateLogs: React.FC = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const deviceId = Number(query.get('deviceId') || 0);

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

  // 从本地服务获取日志

  const fetchBase = async () => {
    setLoading(true);
    try {
      if (!deviceId) {
        // 未指定设备，显示全部日志
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
  }, [deviceId]);

  const filtered = useMemo(() => {
    return logs.filter(item => {
      // 隐藏项不展示
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
    { title: '序号', dataIndex: 'sequence', key: 'sequence', width: 80, align: 'center' },
    { title: '所属电站', dataIndex: 'power_station', key: 'power_station' },
    { title: '保护屏', dataIndex: 'protection_screen', key: 'protection_screen' },
    { title: '设备间隔', dataIndex: 'device_issue', key: 'device_issue' },
    { title: '压板名称', dataIndex: 'pressure_plate_name', key: 'pressure_plate_name' },
    { title: '压板类型', dataIndex: 'type', key: 'type', width: 100, render: (t: string) => t === 'soft' ? '软压板' : '硬压板' },
    { title: '变更类型', dataIndex: 'change_type', key: 'change_type', width: 100 },
    { title: '变更来源', dataIndex: 'change_source', key: 'change_source' },
    { 
      title: '变更时间', 
      dataIndex: 'change_time', 
      key: 'change_time', 
      width: 200,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss')
    },
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
      dayjs(r.change_time).format('YYYY-MM-DD'),
      r.pressure_plate_status
    ]);
    const csv = [header, ...rows].map(a => a.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
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
    // 找到最近日期
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
    <div className="dm-page">
      <div className="dm-header">更新日志</div>
      <div className="dm-main">
        <div className="dm-right">
          {/* 顶部筛选栏 */}
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

          {/* 工具条：删除=隐藏；恢复=取消隐藏 */}
          <div className="dm-toolbar" style={{ marginTop: 8 }}>
            <Space>
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
              <Button icon={undefined} onClick={handleExport}>导出</Button>
            </Space>
            <div style={{ marginLeft: 'auto' }}>
              <Button onClick={() => navigate(-1)}>返回</Button>
            </div>
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
                scroll={{ x: 1200 }}
              />
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
      </div>
    </div>
  );
};

export default UpdateLogs;
