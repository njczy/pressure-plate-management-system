// 本地数据管理系统
import devicesData from '../data/devices.json';

// 数据库表类型定义
export interface Device {
  id: number
  sequence: number
  power_station: string
  protection_screen: string
  device_issue: string
  pressure_plate_name: string
  type: 'soft' | 'hard'
  pressure_plate_box: string
  pressure_plate_time: string
  pressure_plate_general_name: string
  pressure_plate_type_color: 'red' | 'yellow' | 'gray' | 'black'
  pressure_plate_position: 'top' | 'middle' | 'bottom'
  pressure_plate_position_x: number
  pressure_plate_position_y: number
  pressure_plate_status?: string
  last_changed_by?: string
  last_changed_at?: string
  change_remarks?: string
  created_at?: string
  updated_at?: string
}

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'operator' | 'viewer'
  created_at?: string
  updated_at?: string
}

export interface OperationLog {
  id: number
  user_id: string
  device_id: number
  operation_type: 'create' | 'update' | 'delete' | 'import'
  operation_details: string
  created_at?: string
}

// 更新日志项（用于“更新日志”页面）
export interface UpdateLogItem {
  id: number
  device_id: number
  sequence: number
  power_station: string
  protection_screen: string
  device_issue: string
  pressure_plate_name: string
  type: 'soft' | 'hard'
  change_type: string
  change_source: string
  change_time: string
  pressure_plate_status: string
  hidden?: boolean
}

// 本地存储key
const STORAGE_KEY = 'pressure_plate_devices';
const DATA_VERSION_KEY = 'pressure_plate_data_version';
const LOGS_STORAGE_KEY = 'pressure_plate_update_logs';
const CURRENT_DATA_VERSION = '3.3'; // 名称为变电站常见压板，长度10-20字

// 本地数据管理类
class LocalDataService {
  private devices: Device[] = [];
  private logs: UpdateLogItem[] = [];

  constructor() {
    this.initializeData();
  }

  // 生成贴近变电站场景、10-20字的压板名称
  private buildPlateName(): string {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const subjects = [
      '主变压器', '母线', '线路', '发电机', '母联', '备用电源', '厂用变', '站用电',
      '电容器组', '消弧线圈', 'PT回路', 'CT回路', '低压侧', '高压侧', '母线分段'
    ];
    const funcs = [
      '差动保护', '后备保护', '过流保护', '距离保护', '零序保护', '过负荷保护', '母差保护',
      '重合闸', '跳闸回路', '信号回路', '备自投', '备用跳闸'
    ];
    const qualifiers = [
      '投入', '退出', '允许', '禁止', '复归', '试验', '检修', '闭锁', '遥控', '就地', '远方', '投退'
    ];
    const extras = ['控制', '操作', '运行', '监视', '选择', '定值区'];

    const patterns: Array<(s: string, f: string, q: string) => string> = [
      (s, f, q) => `${s}${f}${q}压板`,
      (s, f, q) => `${s}${f}${q}控制压板`,
      (s, f, q) => `${s}${f}回路${q}压板`,
      (s, f, q) => `${s}${q}${f}操作压板`
    ];
    const s = pick(subjects);
    const f = pick(funcs);
    const q = pick(qualifiers);
    let name = pick(patterns)(s, f, q);
    while (name.length < 10) {
      const ex = pick(extras);
      name = name.replace('压板', `${ex}压板`);
    }
    if (name.length > 20) {
      name = name.replace('控制', '').replace('操作', '').replace('回路', '');
    }
    if (name.length > 20) name = name.slice(0, 20);
    return name;
  }

  // 初始化数据
  private initializeData() {
    const savedVersion = localStorage.getItem(DATA_VERSION_KEY);
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
    
    console.log('当前数据版本检查:');
    console.log('- 保存的版本:', savedVersion);
    console.log('- 当前版本:', CURRENT_DATA_VERSION);
    console.log('- 版本匹配:', savedVersion === CURRENT_DATA_VERSION);
    
    // 如果版本不匹配或没有数据，重新加载默认数据
    if (savedVersion !== CURRENT_DATA_VERSION || !savedData) {
      console.log('🔄 数据版本更新或首次加载，生成新的模拟数据...');
      console.log('- 保护屏A: 9x9=81个压板 (长名称+指定颜色分布+3:1状态比例)');
      console.log('- 保护屏B/C: 5x4=40个压板，总计121条');
      this.devices = this.generateDevices();
      this.saveToStorage();
      localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
      console.log('✅ 数据生成完成！压板总数:', this.devices.length);
    } else {
      try {
        this.devices = JSON.parse(savedData);
        console.log('📁 从本地存储加载数据，压板总数:', this.devices.length);
        // 验证数据完整性 - 保护屏A:81 + 保护屏B/C:40 = 121
        if (this.devices.length !== 121) {
          console.log('⚠️ 数据不完整或旧版本，重新生成...');
          this.devices = this.generateDevices();
          this.saveToStorage();
          localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
        } else {
          // 迁移：统一硬压板 + 名称长度校正（10-20字）
          let changed = false;
          const normalizeName = (name: string) => {
            if (!name || name.length < 10 || name.length > 20) return this.buildPlateName();
            return name;
          };
          this.devices = this.devices.map((d) => {
            const newType: Device['type'] = 'hard';
            const newName = normalizeName(d.pressure_plate_name);
            if (d.type !== newType || newName !== d.pressure_plate_name) changed = true;
            return { ...d, type: newType, pressure_plate_name: newName };
          });
          if (changed) {
            console.log('🔧 已对现有本地数据进行规范化处理（硬压板 + 名称长度10-20字）');
            this.saveToStorage();
          }
        }
      } catch (error) {
        console.error('❌ 解析本地存储数据失败:', error);
        this.devices = this.generateDevices();
        this.saveToStorage();
        localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
      }
    }

    // 初始化日志
    try {
      this.logs = savedLogs ? JSON.parse(savedLogs) : [];
      if (!Array.isArray(this.logs)) this.logs = [];
    } catch {
      this.logs = [];
    }
  }

  // 生成设备数据：保护屏A为9x9=81条，保护屏B/C为5x4=20条
  private generateDevices(): Device[] {
    const now = new Date().toISOString();
    const devices: Device[] = [];
    let globalSeq = 1;
    let globalId = 1;

    // 生成10-20个字、贴近变电站场景的压板名称
    const generatePlateName = (_screenName: string, _idx: number): string => this.buildPlateName();

    // 保护屏A: 9x9 = 81个压板
    const screenA = '保护屏A';
    for (let x = 1; x <= 9; x++) {
      for (let y = 1; y <= 9; y++) {
        const idxWithin = (x - 1) * 9 + y; // 1..81
        // 行映射到层：1-3 上，4-6 中，7-9 下
        const layer: Device['pressure_plate_position'] = x <= 3 ? 'top' : (x <= 6 ? 'middle' : 'bottom');
        
        // 颜色分配：前30个红色，中间28个黄色，再15个灰色，最后8个黑色
        let color: Device['pressure_plate_type_color'];
        if (idxWithin <= 30) {
          color = 'red';
        } else if (idxWithin <= 58) { // 30 + 28
          color = 'yellow';
        } else if (idxWithin <= 73) { // 58 + 15
          color = 'gray';
        } else {
          color = 'black';
        }
        
        // 状态比例3:1（投入:退出）
        const status = ((idxWithin - 1) % 4 < 3) ? '投入' : '退出';
        const type: Device['type'] = 'hard';
        
        const device: Device = {
          id: globalId++,
          sequence: globalSeq++,
          power_station: '华能电站',
          protection_screen: screenA,
          device_issue: `设备间隔${idxWithin}`,
          pressure_plate_name: generatePlateName(screenA, idxWithin),
          type,
          pressure_plate_box: 'XXXX',
          pressure_plate_time: '投入、退出',
          pressure_plate_general_name: '通用压板',
          pressure_plate_type_color: color,
          pressure_plate_position: layer,
          pressure_plate_position_x: x,
          pressure_plate_position_y: y,
          pressure_plate_status: status,
          last_changed_by: '系统生成',
          last_changed_at: now,
          change_remarks: '',
          created_at: now,
          updated_at: now
        };
        devices.push(device);
      }
    }
    
    // 统计保护屏A的颜色分布
    const screenADevices = devices.filter(d => d.protection_screen === screenA);
    const colorStats = {
      red: screenADevices.filter(d => d.pressure_plate_type_color === 'red').length,
      yellow: screenADevices.filter(d => d.pressure_plate_type_color === 'yellow').length,
      gray: screenADevices.filter(d => d.pressure_plate_type_color === 'gray').length,
      black: screenADevices.filter(d => d.pressure_plate_type_color === 'black').length
    };
    const statusStats = {
      投入: screenADevices.filter(d => d.pressure_plate_status === '投入').length,
      退出: screenADevices.filter(d => d.pressure_plate_status === '退出').length
    };
    
    console.log('📊 保护屏A数据统计:');
    console.log('- 颜色分布:', colorStats);
    console.log('- 状态分布:', statusStats);
    console.log('- 第一个压板名称:', screenADevices[0]?.pressure_plate_name);
    console.log('- 最后一个压板名称:', screenADevices[screenADevices.length - 1]?.pressure_plate_name);

    // 保护屏B和C: 5x4 = 20个压板
    const screensBC = ['保护屏B', '保护屏C'];
    const colors: Array<Device['pressure_plate_type_color']> = ['red', 'yellow', 'gray'];
    const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];
    
    for (const s of screensBC) {
      for (let x = 1; x <= 5; x++) {
        for (let y = 1; y <= 4; y++) {
          const idxWithin = (x - 1) * 4 + y; // 1..20
          // 行映射到层：1-2 上，3-4 中，5 下
          const layer: Device['pressure_plate_position'] = x <= 2 ? 'top' : (x <= 4 ? 'middle' : 'bottom');
          // 颜色/状态/类型随机（可重复）
          const color = pick(colors, globalSeq + x + y);
          const status = ((globalSeq + x + y) % 2 === 0) ? '投入' : '退出';
          const type: Device['type'] = 'hard';
          const device: Device = {
            id: globalId++,
            sequence: globalSeq++,
            power_station: '华能电站',
            protection_screen: s,
            device_issue: `设备间隔${idxWithin}`,
            pressure_plate_name: generatePlateName(s, idxWithin),
            type,
            pressure_plate_box: 'XXXX',
            pressure_plate_time: '投入、退出',
            pressure_plate_general_name: '通用压板',
            pressure_plate_type_color: color,
            pressure_plate_position: layer,
            pressure_plate_position_x: x,
            pressure_plate_position_y: y,
            pressure_plate_status: status,
            last_changed_by: '系统生成',
            last_changed_at: now,
            change_remarks: '',
            created_at: now,
            updated_at: now
          };
          devices.push(device);
        }
      }
    }
    return devices;
  }

  // 保存到本地存储
  private saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.devices));
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(this.logs));
  }

  // 模拟异步操作
  private delay(ms: number = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取所有设备
  async getDevices(filters?: {
    protectionScreen?: string;
    deviceIssue?: string;
    pressurePlateName?: string;
    type?: string;
    pressurePlateStatus?: string;
    lastChangedBy?: string;
  }) {
    await this.delay();
    
    let filteredDevices = [...this.devices];

    if (filters) {
      if (filters.protectionScreen) {
        filteredDevices = filteredDevices.filter(d => 
          d.protection_screen.toLowerCase().includes(filters.protectionScreen!.toLowerCase())
        );
      }
      if (filters.deviceIssue) {
        filteredDevices = filteredDevices.filter(d => 
          d.device_issue.toLowerCase().includes(filters.deviceIssue!.toLowerCase())
        );
      }
      if (filters.pressurePlateName) {
        filteredDevices = filteredDevices.filter(d => 
          d.pressure_plate_name.toLowerCase().includes(filters.pressurePlateName!.toLowerCase())
        );
      }
      if (filters.type) {
        filteredDevices = filteredDevices.filter(d => d.type === filters.type);
      }
      if (filters.pressurePlateStatus) {
        filteredDevices = filteredDevices.filter(d => (d.pressure_plate_status || '').includes(filters.pressurePlateStatus!));
      }
      if (filters.lastChangedBy) {
        filteredDevices = filteredDevices.filter(d => (d.last_changed_by || '').toLowerCase().includes(filters.lastChangedBy!.toLowerCase()));
      }
    }

    return {
      data: filteredDevices.sort((a, b) => a.sequence - b.sequence),
      error: null
    };
  }

  // 根据ID获取单个设备
  async getDeviceById(id: number) {
    await this.delay();
    
    const device = this.devices.find(d => d.id === id);
    return {
      data: device || null,
      error: device ? null : { message: '设备未找到' }
    };
  }

  // 更新设备
  async updateDevice(id: number, updates: Partial<Device>) {
    await this.delay();
    
    const deviceIndex = this.devices.findIndex(d => d.id === id);
    if (deviceIndex === -1) {
      return {
        data: null,
        error: { message: '设备未找到' }
      };
    }

    // 更新设备信息
    this.devices[deviceIndex] = {
      ...this.devices[deviceIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.saveToStorage();

    return {
      data: [this.devices[deviceIndex]],
      error: null
    };
  }

  // ====== 更新日志相关 ======
  async addUpdateLog(log: Omit<UpdateLogItem, 'id' | 'sequence'>) {
    await this.delay();
    // 改为：同设备只保留一条日志，若存在则更新该条；否则新增
    const idx = this.logs.findIndex(l => l.device_id === log.device_id);
    if (idx !== -1) {
      const updated: UpdateLogItem = {
        ...this.logs[idx],
        ...log,
        // 新变更应可见
        hidden: false,
        // 序号仅用于展示，由查询时重算，这里置0
        sequence: 0,
      };
      this.logs[idx] = updated;
      this.saveToStorage();
      return { data: updated, error: null };
    }
    const maxId = Math.max(0, ...this.logs.map(l => l.id));
    const newLog: UpdateLogItem = { id: maxId + 1, hidden: false, sequence: 0, ...log } as UpdateLogItem;
    this.logs.push(newLog);
    this.saveToStorage();
    return { data: newLog, error: null };
  }

  async getUpdateLogs(params?: { deviceId?: number }) {
    await this.delay();
    let result: UpdateLogItem[] = [];

    if (params?.deviceId) {
      // 返回该设备最新一条（如果历史有多条，取时间最大）
      const candidates = this.logs.filter(l => l.device_id === params.deviceId);
      if (candidates.length > 0) {
        const latest = candidates.reduce((acc, cur) =>
          (acc.change_time || '').localeCompare(cur.change_time || '') >= 0 ? acc : cur
        );
        result = [latest];
      }
    } else {
      // 按设备分组后取每个设备最新一条
      const byDevice = new Map<number, UpdateLogItem>();
      for (const l of this.logs) {
        const existed = byDevice.get(l.device_id);
        if (!existed) {
          byDevice.set(l.device_id, l);
        } else {
          const newer = (existed.change_time || '').localeCompare(l.change_time || '') < 0 ? l : existed;
          byDevice.set(l.device_id, newer);
        }
      }
      result = Array.from(byDevice.values());
    }

    // 根据时间倒序
    result.sort((a, b) => (b.change_time || '').localeCompare(a.change_time || ''));
    // 重新计算显示序号（当前结果集内）
    result = result.map((item, idx) => ({ ...item, sequence: idx + 1 }));
    return { data: result, error: null };
  }

  async setLogsHiddenByIds(ids: number[], hidden: boolean) {
    await this.delay();
    const idSet = new Set(ids);
    let changed = 0;
    this.logs = this.logs.map(l => {
      if (idSet.has(l.id)) { changed++; return { ...l, hidden }; }
      return l;
    });
    this.saveToStorage();
    return { data: changed, error: null };
  }

  async setLogsHiddenByRange(deviceId: number | null, start: string | null, end: string | null, hidden: boolean) {
    await this.delay();
    let changed = 0;
    this.logs = this.logs.map(l => {
      if (hidden === (l.hidden ?? false)) return l;
      if (deviceId && l.device_id !== deviceId) return l;
      const ts = new Date(l.change_time).getTime();
      const geStart = start ? ts >= new Date(start).getTime() : true;
      const leEnd = end ? ts <= new Date(end).getTime() : true;
      if (geStart && leEnd) { changed++; return { ...l, hidden }; }
      return l;
    });
    this.saveToStorage();
    return { data: changed, error: null };
  }

  // 创建新设备
  async createDevice(device: Omit<Device, 'id' | 'created_at' | 'updated_at'>) {
    await this.delay();
    
    const maxId = Math.max(...this.devices.map(d => d.id), 0);
    const newDevice: Device = {
      ...device,
      // 统一为硬压板
      type: 'hard',
      id: maxId + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.devices.push(newDevice);
    this.saveToStorage();

    return {
      data: [newDevice],
      error: null
    };
  }

  // 删除设备
  async deleteDevice(id: number) {
    await this.delay();
    
    const deviceIndex = this.devices.findIndex(d => d.id === id);
    if (deviceIndex === -1) {
      return {
        data: null,
        error: { message: '设备未找到' }
      };
    }

    const deletedDevice = this.devices.splice(deviceIndex, 1)[0];
    this.saveToStorage();

    return {
      data: [deletedDevice],
      error: null
    };
  }

  // 重置数据到初始状态
  async resetData() {
    console.log('强制重置数据，清除本地存储...');
    localStorage.removeItem(DATA_VERSION_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LOGS_STORAGE_KEY);
    this.devices = this.generateDevices();
    this.logs = [];
    this.saveToStorage();
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
    console.log('数据重置完成，新版本:', CURRENT_DATA_VERSION);
    return {
      data: this.devices,
      error: null
    };
  }

  // 强制更新到最新版本数据
  async forceUpdateData() {
    console.log('强制更新数据到最新版本:', CURRENT_DATA_VERSION);
    this.devices = this.generateDevices();
    this.saveToStorage();
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
    return {
      data: this.devices,
      error: null
    };
  }

  // 导出数据
  exportData() {
    return JSON.stringify(this.devices, null, 2);
  }

  // 导入数据
  async importData(jsonData: string) {
    try {
      const importedDevices = JSON.parse(jsonData);
      if (Array.isArray(importedDevices)) {
        // 导入时统一压板类型为硬压板
        this.devices = importedDevices.map((d: any) => ({
          ...d,
          type: 'hard'
        }));
        this.saveToStorage();
        return {
          data: this.devices,
          error: null
        };
      } else {
        return {
          data: null,
          error: { message: '数据格式不正确' }
        };
      }
    } catch (error) {
      return {
        data: null,
        error: { message: '数据解析失败' }
      };
    }
  }
}

// 创建单例实例
export const localDataService = new LocalDataService();

// 将实例暴露到全局，方便调试
if (typeof window !== 'undefined') {
  (window as any).localDataService = localDataService;
  (window as any).forceUpdateData = () => {
    console.log('🔄 手动触发数据更新...');
    return localDataService.forceUpdateData();
  };
  console.log('💡 调试提示: 在控制台输入 forceUpdateData() 可强制更新数据');
}

// 兼容原有API的包装器
export const localData = {
  from: (table: string) => {
    if (table !== 'devices') {
      throw new Error(`不支持的表: ${table}`);
    }

    return {
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            if (column === 'id') {
              return localDataService.getDeviceById(value);
            }
            const result = await localDataService.getDevices();
            const device = result.data?.find((d: any) => d[column] === value);
            return {
              data: device || null,
              error: device ? null : { message: '设备未找到' }
            };
          }
        }),
        order: (column: string, options?: { ascending?: boolean }) => ({
          then: async (callback?: (result: any) => void) => {
            const result = await localDataService.getDevices();
            if (result.data) {
              const ascending = options?.ascending !== false;
              result.data.sort((a: any, b: any) => {
                if (ascending) {
                  return a[column] > b[column] ? 1 : -1;
                } else {
                  return a[column] < b[column] ? 1 : -1;
                }
              });
            }
            if (callback) callback(result);
            return result;
          }
        }),
        ilike: (column: string, pattern: string) => {
          const searchValue = pattern.replace(/%/g, '');
          const filters: any = {};
          
          if (column === 'protection_screen') filters.protectionScreen = searchValue;
          else if (column === 'device_issue') filters.deviceIssue = searchValue;
          else if (column === 'pressure_plate_name') filters.pressurePlateName = searchValue;
          
          return localDataService.getDevices(filters);
        },
        limit: (count: number) => localDataService.getDevices(),
        then: async (callback?: (result: any) => void) => {
          const result = await localDataService.getDevices();
          if (callback) callback(result);
          return result;
        }
      }),
      update: (updates: any) => ({
        eq: (column: string, value: any) => ({
          select: async () => {
            if (column === 'id') {
              return localDataService.updateDevice(value, updates);
            }
            return { data: null, error: { message: '不支持的更新条件' } };
          }
        })
      }),
      insert: (data: any) => ({
        select: async () => {
          return localDataService.createDevice(data);
        }
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          select: async () => {
            if (column === 'id') {
              return localDataService.deleteDevice(value);
            }
            return { data: null, error: { message: '不支持的删除条件' } };
          }
        })
      })
    };
  }
};
