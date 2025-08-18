-- 为devices表添加新字段
ALTER TABLE devices ADD COLUMN IF NOT EXISTS pressure_plate_general_name VARCHAR(100) DEFAULT '';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS pressure_plate_type_color VARCHAR(20) DEFAULT 'pressure_plate' CHECK (pressure_plate_type_color IN ('outlet', 'pressure_plate', 'backup'));
ALTER TABLE devices ADD COLUMN IF NOT EXISTS pressure_plate_position VARCHAR(20) DEFAULT 'middle' CHECK (pressure_plate_position IN ('top', 'middle', 'bottom'));
ALTER TABLE devices ADD COLUMN IF NOT EXISTS pressure_plate_position_x NUMERIC DEFAULT 0;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS pressure_plate_position_y NUMERIC DEFAULT 0;

-- 更新现有数据的示例值
UPDATE devices SET 
  pressure_plate_general_name = '压板总称' || sequence,
  pressure_plate_type_color = CASE 
    WHEN sequence % 3 = 1 THEN 'outlet'
    WHEN sequence % 3 = 2 THEN 'pressure_plate'
    ELSE 'backup'
  END,
  pressure_plate_position = CASE 
    WHEN sequence % 3 = 1 THEN 'top'
    WHEN sequence % 3 = 2 THEN 'middle'
    ELSE 'bottom'
  END,
  pressure_plate_position_x = sequence * 10,
  pressure_plate_position_y = sequence * 5
WHERE pressure_plate_general_name = '' OR pressure_plate_general_name IS NULL;

-- 添加注释
COMMENT ON COLUMN devices.pressure_plate_general_name IS '压板总称';
COMMENT ON COLUMN devices.pressure_plate_type_color IS '压板类型颜色：出口、压板、备用';
COMMENT ON COLUMN devices.pressure_plate_position IS '压板位置：上、中、下';
COMMENT ON COLUMN devices.pressure_plate_position_x IS '压板位置X轴坐标';
COMMENT ON COLUMN devices.pressure_plate_position_y IS '压板位置Y轴坐标';