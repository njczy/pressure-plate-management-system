import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { Modal, Spin, message, Select, Button, Space } from 'antd';
import { MinusOutlined, ExpandOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import './PressurePlateTerminologyModal.css';
import { localDataService, Device } from '../lib/localData';

interface PressurePlatePositionModalProps {
  visible: boolean;
  onClose: () => void;
  devices?: Device[];
}

function statusToState(status?: string): 'on' | 'off' {
  return status === '退出' ? 'off' : 'on';
}

const PressurePlatePositionModal: React.FC<PressurePlatePositionModalProps> = ({
  visible,
  onClose,
  devices: propDevices
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [screensPerRow, setScreensPerRow] = useState<number>(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);
  const detailWrapRef = useRef<HTMLDivElement | null>(null);
  const [detailScale, setDetailScale] = useState(1);
  const [limitAxis, setLimitAxis] = useState<'h' | 'w'>('h');
  const [gapX, setGapX] = useState(32);
  const [gapY, setGapY] = useState(24);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const { data, error } = await localDataService.getDevices();
      if (error) {
        message.error('获取设备数据失败: ' + error.message);
        return;
      }
      setDevices((data || []).sort((a, b) => a.sequence - b.sequence));
    } catch (e) {
      message.error('获取设备数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    setCurrentScreen(null);
    if (propDevices && propDevices.length > 0) {
      setDevices([...propDevices].sort((a, b) => a.sequence - b.sequence));
    } else {
      fetchDevices();
    }
  }, [visible, propDevices]);

  const byScreen = useMemo(() => {
    const map = new Map<string, Device[]>();
    for (const d of devices) {
      const list = map.get(d.protection_screen) || [];
      list.push(d);
      map.set(d.protection_screen, list);
    }
    for (const [k, list] of map) {
      list.sort((a, b) => a.sequence - b.sequence);
      map.set(k, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [devices]);

  // 详情视图：根据可用空间动态缩放拨片尺寸，力求一页展示
  useLayoutEffect(() => {
    if (!visible || !currentScreen) return;
    const onResize = () => {
      const wrapper = detailWrapRef.current;
      if (!wrapper) return;
      const list = (byScreen.find(([name]) => name === currentScreen)?.[1] || []);
      const rows = Math.max(1, ...list.map(d => d.pressure_plate_position_x || 1)); // 动态行数
      const cols = Math.max(1, ...list.map(d => d.pressure_plate_position_y || 1)); // 动态列数
      // 可用空间：以容器实际尺寸为准，预留少量内边距
      const availW = Math.max(300, (wrapper.clientWidth || 0) - 16);
      const availH = Math.max(300, (wrapper.clientHeight || 0) - 24);
      // 基准尺寸（与样式中一致） - 根据行列数调整基准尺寸
      const isLargeGrid = rows > 6 || cols > 6; // 9x9网格需要更紧凑
      const base = isLargeGrid 
        ? { slotW: 45, bezelW: 32, bezelH: 50, plateW: 7, plateH: 32, gapX: 8, gapY: 4, pad: 6 }
        : { slotW: 70, bezelW: 45, bezelH: 80, plateW: 12, plateH: 50, gapX: 20, gapY: 12, pad: 12 };
      // 文字与坐标额外高度（名称多行 + 坐标）
      const textExtra = isLargeGrid ? 28 : 44;
      const baseGridW = cols * base.slotW + (cols - 1) * base.gapX + 2 * base.pad;
      const baseGridH = rows * (base.bezelH + textExtra) + (rows - 1) * base.gapY + 2 * base.pad;
      const sW = availW / baseGridW;
      const sH = availH / baseGridH;
      const s = Math.min(sW, sH, 1);
      // 标记受限方向：高度更紧则为 'h'，否则为 'w'
      setLimitAxis(sH <= sW ? 'h' : 'w');
      setDetailScale(s > 0 ? s : 1);

      // 根据剩余空间再分配间距，优先确保所有内容可见
      const slotW = base.slotW * s;
      const baseGapX = base.gapX * s;
      const baseGapY = base.gapY * s;
      const gridW = cols * slotW + (cols - 1) * baseGapX + 2 * base.pad;
      const gridH = rows * (base.bezelH * s + textExtra) + (rows - 1) * baseGapY + 2 * base.pad;
      const extraW = Math.max(0, availW - gridW);
      const extraH = Math.max(0, availH - gridH);
      
      // 如果行数较多，减少纵向间距以确保内容可见
      let newGapY = baseGapY;
      if (rows > 6) {
        newGapY = Math.max(1, baseGapY * 0.2); // 9x9网格时，间距极小，最小1px
      } else if (rows > 4) {
        newGapY = Math.max(4, baseGapY * 0.5); // 行数超过4时，间距减半，最小4px
      } else if (extraH > 0 && rows > 1) {
        newGapY = baseGapY + Math.min(extraH / (rows - 1), baseGapY * 0.5);
      }
      
      const newGapX = baseGapX + (cols > 1 ? extraW / (cols - 1) : 0);
      setGapX(Math.max(4, Math.min(newGapX, 64))); // 减小最小横向间距
      setGapY(Math.max(1, Math.min(newGapY, 32))); // 进一步减小最小纵向间距
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, currentScreen, byScreen]);

  // 将名称按每行10个字符分段
  const chunkName = (name: string, size: number = 10) => {
    const chunks: string[] = [];
    if (!name) return chunks;
    let i = 0;
    while (i < name.length) {
      chunks.push(name.slice(i, i + size));
      i += size;
    }
    return chunks;
  };

  

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={isFullscreen ? "100vw" : "60%"}
      centered={!isFullscreen}
      closable={false}
      className="pressure-plate-modal"
      styles={{
        body: isFullscreen ? {
          padding: 0,
          height: '100vh',
          overflow: 'hidden',
          margin: 0
        } : { padding: 0, height: '80vh', overflow: 'hidden', margin: 0 },
        header: { padding: 0 },
        mask: isFullscreen ? { backgroundColor: 'rgba(0, 0, 0, 0.8)' } : undefined
      }}
      style={isFullscreen ? {
        top: 0,
        height: '100vh',
        maxWidth: '100vw',
        margin: 0,
        paddingBottom: 0
      } : undefined}
    >
      {/* 合并的固定头部区域 - 包含标题栏和工具条 */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}
      >
        {/* 绿色标题栏 */}
        <div
          style={{
            backgroundColor: '#0f8a80',
            color: 'white',
            padding: '8px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500 }}>压板位置示意图</span>
          <div className="window-controls">
            <Button type="text" size="small" icon={<MinusOutlined />} />
            <Button 
              type="text" 
              size="small" 
              icon={<ExpandOutlined />} 
              onClick={toggleFullscreen}
              style={{ color: 'white' }}
            />
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
          </div>
        </div>
        
        {/* 工具条区域 */}
        <div 
          style={{ 
            backgroundColor: '#f5f5f5',
            padding: '16px 16px 8px 16px',
            borderBottom: '1px solid #e0e0e0'
          }}
        >
          {/* 顶部工具条：列表视图显示"每行显示"，详情视图显示返回 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
            {currentScreen ? (
              <Space>
                <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => setCurrentScreen(null)}>返回</Button>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{currentScreen} 压板详情</span>
              </Space>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <span style={{ fontSize: 12, color: '#666' }}>每行显示</span>
                <Select
                  size="small"
                  style={{ width: 80 }}
                  value={screensPerRow}
                  onChange={(v) => setScreensPerRow(v)}
                  options={Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
                />
                <span style={{ fontSize: 12, color: '#666' }}>个保护屏</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Spin spinning={loading} style={{ display: 'block' }}>
        
        {/* 可滚动的内容区域 */}
        <div style={{ padding: '8px 16px 16px 16px', backgroundColor: '#f5f5f5' }}>

          {/* 列表视图：baohuping 风格柜体卡片 */}
          {!currentScreen && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${screensPerRow}, minmax(240px, 1fr))`, gap: 16, marginTop: 28 }}>
              <style>{`
                .cabinet-frame { width: 240px; height: 480px; background: linear-gradient(145deg,#f8f9fa 0%,#e9ecef 50%,#dee2e6 100%); border:3px solid #8d9499; border-radius:8px; box-shadow:0 15px 30px rgba(0,0,0,.2), inset 0 3px 6px rgba(255,255,255,.8), inset 0 -3px 6px rgba(0,0,0,.15), inset 0 0 0 1px rgba(255,255,255,.4); padding:12px; position: relative; box-sizing: border-box; cursor: pointer; }
                .cabinet-title { position:absolute; top:-24px; left:50%; transform:translateX(-50%); background:linear-gradient(#e9ecef,#dee2e6); border:2px solid #8d9499; border-radius:4px; padding:2px 8px; font-size:12px; font-weight:bold; color:#495057; }
                /* 右侧为把手预留足够空间，避免被指标覆盖 */
                .cabinet-door { width:100%; height:100%; background:rgba(35,45,55,.8); border-radius:8px; border:1px solid rgba(255,255,255,.1); box-shadow: inset 0 2px 4px rgba(0,0,0,.3), inset 0 0 12px rgba(0,0,0,.2), 0 0 0 1px rgba(255,255,255,.05); display:flex; justify-content:center; align-items:center; position:relative; padding:10px 44px 10px 5px; box-sizing:border-box; overflow:hidden; }
                .handle { position:absolute; right:8px; top:50%; transform:translateY(-50%); width:28px; height:28px; background: radial-gradient(circle at 30% 30%, #fff 0%, #f8f9fa 30%, #e9ecef 70%, #dee2e6 100%); border-radius:50%; border:2px solid #adb5bd; box-shadow:0 3px 8px rgba(0,0,0,.25), inset 0 1px 2px rgba(255,255,255,.8), inset 0 -1px 2px rgba(0,0,0,.1); display:flex; justify-content:center; align-items:center; z-index:10; }
                .handle::after { content:''; width:4px; height:10px; background:linear-gradient(#6c757d,#495057); border-radius:2px; box-shadow: inset 0 1px 1px rgba(255,255,255,.3); }
                :root { --slot-w:45px; --plate-w:13px; --plate-h:36px; --bezel-w:32px; --bezel-h:40px; --gap-y:4px; --text:#c8d1da; }
                .indicator-grid { display:grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, auto); row-gap: 50px; column-gap: 6px; width:100%; height:auto; align-content:center; justify-items:start; padding:0; box-sizing:border-box; overflow:visible; }
                .yaban { width:var(--slot-w); display:flex; flex-direction:column; align-items:center; color:var(--text); }
                .bezel { position:relative; width:var(--bezel-w); height:var(--bezel-h); border-radius:6px; background:linear-gradient(135deg,#f2ede4 0%,#e9e1d6 30%,#d6ccbf 70%,#c8beb1 100%); border:2px solid #a99f90; box-shadow: inset 0 2px 4px rgba(255,255,255,.9), inset 0 -1px 2px rgba(0,0,0,.1), 0 3px 6px rgba(114,104,92,.3), 0 1px 2px rgba(114,104,92,.1); }
                .screw{position:absolute;width:6px;height:6px;border-radius:50%; background:radial-gradient(circle at 30% 30%, #ffffff 0%, #e9ecef 20%, #b6b0a6 40%, #857d71 80%, #6c6258 100%); border:1px solid #857d71; box-shadow:0 1px 2px rgba(0,0,0,.3), inset 0 1px 1px rgba(255,255,255,.4) }
                .screw.tl{left:6px;top:6px} .screw.br{right:6px;bottom:6px}
                .plate{ position:absolute; left:50%; top:50%; width:var(--plate-w); height:var(--plate-h); border-radius:3px; border:1px solid rgba(0,0,0,.28); box-shadow: inset 0 1px 0 rgba(255,255,255,.65), inset 0 -1px 0 rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.25); transform-origin:50% 50%; transform: translate(-50%,-50%) }
                .yaban[data-state="on"] .plate{ transform: translate(-50%,-50%) rotateZ(0deg) }
                .yaban[data-state="off"] .plate{ transform: translate(-50%,-50%) rotateZ(-25deg) }
                .yaban[data-color="red"] .plate{ background:linear-gradient(#B71C1C, #D32F2F) }
                .yaban[data-color="yellow"] .plate{ background:linear-gradient(#F57F17, #F9A825) }
                .yaban[data-color="gray"] .plate{ background:linear-gradient(#616161, #8E8E8E) }
                .yaban[data-color="black"] .plate{ background:linear-gradient(#212121, #424242) }
                .label{ margin-top:2px; width:100%; text-align:center; font-size:9px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.1; text-shadow:0 1px 1px rgba(0,0,0,.3); }
              `}</style>

              {byScreen.map(([screenName, list]) => (
                <div key={screenName} onClick={() => setCurrentScreen(screenName)} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className="cabinet-frame">
                    <div className="cabinet-title">{screenName}</div>
                    <div className="cabinet-door">
                      <div className="handle"></div>
                      <div className="indicator-grid">
                        {/* 使用 baohuping.html 的固定示意布局，不依赖数据 */}
                        {/* 第1行：红 红 红 红（交替 on/off） */}
                        <div className="yaban" data-color="red" data-state="on"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        <div className="yaban" data-color="red" data-state="off"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        <div className="yaban" data-color="red" data-state="on"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        <div className="yaban" data-color="red" data-state="off"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        {/* 第2行：红 红 红 黄 */}
                        <div className="yaban" data-color="red" data-state="on"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        <div className="yaban" data-color="red" data-state="off"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        <div className="yaban" data-color="red" data-state="on"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        <div className="yaban" data-color="yellow" data-state="on"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        {/* 第3行：黄 黄 黄 黄（交替 on/off） */}
                        <div className="yaban" data-color="yellow" data-state="off"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        <div className="yaban" data-color="yellow" data-state="on"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        <div className="yaban" data-color="yellow" data-state="off"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        <div className="yaban" data-color="yellow" data-state="on"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        {/* 第4行：灰 灰 黑 黑（交替 on/off） */}
                        <div className="yaban" data-color="gray" data-state="on"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        <div className="yaban" data-color="gray" data-state="off"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        <div className="yaban" data-color="black" data-state="on"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                        <div className="yaban" data-color="black" data-state="off"><div className="bezel"><div className="screw tl"></div><div className="screw br"></div><div className="plate"></div></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 详情视图：yabanzj 风格 */}
          {currentScreen && (
            <div
              ref={detailWrapRef}
              style={{
                padding: 8,
                height: isFullscreen ? 'calc(100vh - 110px)' : 'calc(80vh - 110px)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <style>{`
                :root{ --slot-w: 70px; --plate-w: 12px; --plate-h: 50px; --bezel-w: 45px; --bezel-h: 80px; --gap-x: 20px; --gap-y: 12px; --text: #333; }
                .board { display:grid; gap: var(--gap-y) var(--gap-x); padding:12px; background:#f5f7f9; border:1px solid #cfd4da; border-radius:12px; width: 100%; margin:8px auto; }
                .yaban{ width: var(--slot-w); display:flex; flex-direction:column; align-items:center; color:var(--text); }
                .bezel{ position:relative; width:var(--bezel-w); height:var(--bezel-h); border-radius:6px; background:linear-gradient(#e9e1d6,#d6ccbf); border:1px solid #a99f90; box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 2px 4px rgba(114,104,92,.2); }
                .screw{position:absolute;width:4px;height:4px;border-radius:50%; background:radial-gradient(circle at 35% 35%, #fff 0 25%, #b6b0a6 26% 65%, #857d71 66% 100%); box-shadow:0 0 0 1px #a69d8f }
                .screw.tl{left:4px;top:4px} .screw.br{right:4px;bottom:4px}
                .plate{ position:absolute; left:50%; top:50%; width:var(--plate-w); height:var(--plate-h); border-radius:3px; border:1px solid rgba(0,0,0,.28); box-shadow: inset 0 1px 0 rgba(255,255,255,.65), inset 0 -1px 0 rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.25); transform-origin:50% 50%; transform: translate(-50%,-50%) }
                .yaban[data-state="on"]  .plate{ transform: translate(-50%,-50%) rotateZ(0deg) }
                .yaban[data-state="off"] .plate{ transform: translate(-50%,-50%) rotateZ(-18deg) }
                .yaban[data-color="red"]    .plate{ background:linear-gradient(#B71C1C, #D32F2F) }
                .yaban[data-color="yellow"] .plate{ background:linear-gradient(#F57F17, #F9A825) }
                .yaban[data-color="gray"]   .plate{ background:linear-gradient(#616161, #8E8E8E) }
                .yaban[data-color="black"]  .plate{ background:linear-gradient(#0a0a0a, #222222) }
                /* 详情页：标签文字每行固定10字（不在段内换行） */
                .label{ margin-top:4px; width:100%; text-align:center; white-space:normal; overflow:visible; text-overflow:clip; line-height:1.05; word-break:normal; overflow-wrap:normal; font-size: calc(var(--slot-w) / 10 - 1px); }
                .label .seg{ display:inline-block; white-space:nowrap; }
                .coord{ font-size:9px; color:#666; margin-top:1px; }
                .slot-empty{ width: var(--slot-w); height: calc(var(--bezel-h) + 16px); }
                
                /* 大网格样式 - 适用于9x9等大布局 */
                .board.large-grid { padding: 6px; }
                .board.large-grid .yaban{ --slot-w: 45px; --plate-w: 7px; --plate-h: 32px; --bezel-w: 32px; --bezel-h: 50px; }
                .board.large-grid .label{ margin-top:1px; font-size: calc(var(--slot-w) / 10 - 0.8px); line-height:1.0; }
                .board.large-grid .coord{ font-size:6px; margin-top:0px; }
                .board.large-grid .screw{width:2.5px;height:2.5px;}
                .board.large-grid .screw.tl{left:2.5px;top:2.5px} 
                .board.large-grid .screw.br{right:2.5px;bottom:2.5px}
                .board.large-grid .slot-empty{ width: var(--slot-w); height: calc(var(--bezel-h) + 10px); }
              `}</style>

              {(() => {
                const list = (byScreen.find(([name]) => name === currentScreen)?.[1] || []);
                // 动态计算网格布局尺寸
                const rows = Math.max(1, ...list.map(d => d.pressure_plate_position_x || 1));
                const cols = Math.max(1, ...list.map(d => d.pressure_plate_position_y || 1));
                const isLargeGrid = rows > 6 || cols > 6;
                const matrix: (Device | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
                
                // 根据pressure_plate_position_x和pressure_plate_position_y填充矩阵
                for (const d of list) {
                  const x = (d.pressure_plate_position_x || 1) - 1; // 行索引
                  const y = (d.pressure_plate_position_y || 1) - 1; // 列索引
                  if (x >= 0 && x < rows && y >= 0 && y < cols) {
                    matrix[x][y] = d;
                  }
                }

                // 根据网格大小选择基准尺寸
                const baseSize = isLargeGrid 
                  ? { slotW: 45, bezelW: 32, bezelH: 50, plateW: 7, plateH: 32 }
                  : { slotW: 70, bezelW: 45, bezelH: 80, plateW: 12, plateH: 50 };

                return (
                  <div
                    className={`board ${isLargeGrid ? 'large-grid' : ''}`}
                    style={{
                      gridTemplateColumns: `repeat(${cols}, var(--slot-w))`,
                      gridTemplateRows: `repeat(${rows}, auto)`,
                      justifyContent: 'center',
                      width: 'fit-content',
                      margin: isLargeGrid ? '3px auto' : '10px auto',
                      ['--slot-w' as any]: `${baseSize.slotW * detailScale}px`,
                      ['--bezel-w' as any]: `${baseSize.bezelW * detailScale}px`,
                      ['--bezel-h' as any]: `${baseSize.bezelH * detailScale}px`,
                      ['--plate-w' as any]: `${baseSize.plateW * detailScale}px`,
                      ['--plate-h' as any]: `${baseSize.plateH * detailScale}px`,
                      ['--gap-x' as any]: `${gapX}px`,
                      ['--gap-y' as any]: `${gapY}px`,
                    } as React.CSSProperties}
                  >
                    {matrix.map((row, rowIdx) =>
                      row.map((d, colIdx) => (
                        d ? (
                          <div className="yaban" key={`d-${d.id}`} data-color={d.pressure_plate_type_color} data-state={statusToState(d.pressure_plate_status)}>
                            <div className="bezel">
                              <div className="screw tl"></div>
                              <div className="screw br"></div>
                              <div className="plate"></div>
                            </div>
                            <div className="label">
                              {chunkName(d.pressure_plate_name, 10).map((seg, idx, arr) => (
                                <span className="seg" key={idx}>
                                  {seg}
                                  {idx < arr.length - 1 ? <br /> : null}
                                </span>
                              ))}
                            </div>
                            <div className="coord">（{rowIdx + 1}，{colIdx + 1}）</div>
                          </div>
                        ) : (
                          <div key={`e-${rowIdx}-${colIdx}`} className="slot-empty" />
                        )
                      ))
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </Spin>
    </Modal>
  );
};

export default PressurePlatePositionModal;
