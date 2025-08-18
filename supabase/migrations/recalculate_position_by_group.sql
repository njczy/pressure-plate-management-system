-- 按压板位置分组重新计算X轴和Y轴坐标
-- 每个位置组（上、中、下）内从X=1, Y=1开始重新计算
-- 保持一排3个设备的规则

-- 更新压板位置为'top'（上）的设备坐标
WITH top_position_mapping AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY id) as row_num,
    -- 计算行数 (X轴): 每3个设备为一行，从1开始
    CEIL((ROW_NUMBER() OVER (ORDER BY id))::decimal / 3) as x_position,
    -- 计算列数 (Y轴): 在每行中的位置 (1, 2, 3)
    CASE 
      WHEN (ROW_NUMBER() OVER (ORDER BY id) - 1) % 3 = 0 THEN 1
      WHEN (ROW_NUMBER() OVER (ORDER BY id) - 1) % 3 = 1 THEN 2
      ELSE 3
    END as y_position
  FROM devices
  WHERE pressure_plate_position = 'top'
  ORDER BY id
)
UPDATE devices 
SET 
  pressure_plate_position_x = pm.x_position,
  pressure_plate_position_y = pm.y_position
FROM top_position_mapping pm
WHERE devices.id = pm.id;

-- 更新压板位置为'middle'（中）的设备坐标
WITH middle_position_mapping AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY id) as row_num,
    -- 计算行数 (X轴): 每3个设备为一行，从1开始
    CEIL((ROW_NUMBER() OVER (ORDER BY id))::decimal / 3) as x_position,
    -- 计算列数 (Y轴): 在每行中的位置 (1, 2, 3)
    CASE 
      WHEN (ROW_NUMBER() OVER (ORDER BY id) - 1) % 3 = 0 THEN 1
      WHEN (ROW_NUMBER() OVER (ORDER BY id) - 1) % 3 = 1 THEN 2
      ELSE 3
    END as y_position
  FROM devices
  WHERE pressure_plate_position = 'middle'
  ORDER BY id
)
UPDATE devices 
SET 
  pressure_plate_position_x = pm.x_position,
  pressure_plate_position_y = pm.y_position
FROM middle_position_mapping pm
WHERE devices.id = pm.id;

-- 更新压板位置为'bottom'（下）的设备坐标
WITH bottom_position_mapping AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY id) as row_num,
    -- 计算行数 (X轴): 每3个设备为一行，从1开始
    CEIL((ROW_NUMBER() OVER (ORDER BY id))::decimal / 3) as x_position,
    -- 计算列数 (Y轴): 在每行中的位置 (1, 2, 3)
    CASE 
      WHEN (ROW_NUMBER() OVER (ORDER BY id) - 1) % 3 = 0 THEN 1
      WHEN (ROW_NUMBER() OVER (ORDER BY id) - 1) % 3 = 1 THEN 2
      ELSE 3
    END as y_position
  FROM devices
  WHERE pressure_plate_position = 'bottom'
  ORDER BY id
)
UPDATE devices 
SET 
  pressure_plate_position_x = pm.x_position,
  pressure_plate_position_y = pm.y_position
FROM bottom_position_mapping pm
WHERE devices.id = pm.id;

-- 验证更新结果
SELECT 
  pressure_plate_position,
  id,
  pressure_plate_name,
  pressure_plate_position_x as x_axis,
  pressure_plate_position_y as y_axis,
  CONCAT('位置:', pressure_plate_position, ' 行', pressure_plate_position_x, '列', pressure_plate_position_y) as position_description
FROM devices 
ORDER BY pressure_plate_position, pressure_plate_position_x, pressure_plate_position_y;

-- 统计每个位置组的设备数量
SELECT 
  pressure_plate_position,
  COUNT(*) as device_count,
  MIN(pressure_plate_position_x) as min_x,
  MAX(pressure_plate_position_x) as max_x,
  MIN(pressure_plate_position_y) as min_y,
  MAX(pressure_plate_position_y) as max_y
FROM devices 
GROUP BY pressure_plate_position
ORDER BY pressure_plate_position;