-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'operator', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建设备表
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  sequence INTEGER NOT NULL,
  power_station VARCHAR(100) NOT NULL,
  protection_screen VARCHAR(100) NOT NULL,
  device_issue VARCHAR(200) NOT NULL,
  pressure_plate_name VARCHAR(100) NOT NULL,
  type VARCHAR(10) DEFAULT 'soft' CHECK (type IN ('soft', 'hard')),
  pressure_plate_box VARCHAR(50) DEFAULT 'XXXX',
  pressure_plate_time VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device_id INTEGER REFERENCES devices(id),
  operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('create', 'update', 'delete', 'import')),
  operation_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;

-- 为匿名用户和认证用户创建策略
CREATE POLICY "Allow read access for all users" ON devices FOR SELECT USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON devices FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for all users" ON operation_logs FOR SELECT USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON operation_logs FOR ALL USING (auth.role() = 'authenticated');

-- 插入示例数据
INSERT INTO devices (sequence, power_station, protection_screen, device_issue, pressure_plate_name, type, pressure_plate_box, pressure_plate_time) VALUES
(1, '溪洛渡变', '红西4W5546033分组电流差动保护屏', '红西4W5开关问题', '备台州出口1LP压板', 'soft', 'XXXX', '投入、调出'),
(2, '溪洛渡变', '无功机', '红西3P1问题', '红西3P1开关保护台出口1LP压板', 'hard', 'XXXX', '放上、取下'),
(3, '溪洛渡变', '2号主变保护装置', '山西663开关问题', '保护装置1CP1软压板', 'soft', 'XXXX', '放上、取下'),
(4, '溪洛渡变', '红西4W5546033分组电流差动保护屏', '2号主变问题', '高压侧保护屏312开关1-2CP1压板', 'hard', 'XXXX', '合上、拉开'),
(5, '溪洛渡变', '2号主变保护装置', '山西663开关问题', '保护装置1CP1软压板', 'soft', 'XXXX', '投入、调出'),
(6, '溪洛渡变', '无功机', '红西3P1问题', '高压侧保护屏312开关1-2CP1压板', 'hard', 'XXXX', '合上、分开');