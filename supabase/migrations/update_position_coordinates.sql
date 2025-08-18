-- 更新设备位置坐标
-- X轴表示行数，Y轴表示列数，一排3个设备
-- 30条数据分配到10行，每行3个设备

-- 更新位置坐标，按照设备ID顺序分配
WITH position_mapping AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY id) as row_num,
    -- 计算行数 (X轴): 每3个设备为一行
    CEIL((ROW_NUMBER() OVER (ORDER BY id))::decimal / 3) as x_position,
    -- 计算列数 (Y轴): 在每行中的位置 (1, 2, 3)
    CASE 
      WHEN (ROW_NUMBER() OVER (ORDER BY id) - 1) % 3 = 0 THEN 1
      WHEN (ROW_NUMBER() OVER (ORDER BY id) - 1) % 3 = 1 THEN 2
      ELSE 3
    END as y_position
  FROM devices
  ORDER BY id
)
UPDATE devices 
SET 
  pressure_plate_position_x = pm.x_position,
  pressure_plate_position_y = pm.y_position
FROM position_mapping pm
WHERE devices.id = pm.id;

-- 验证更新结果
SELECT 
  id,
  pressure_plate_name,
  pressure_plate_position_x as x_axis,
  pressure_plate_position_y as y_axis,
  CONCAT('行', pressure_plate_position_x, '列', pressure_plate_position_y) as position_description
FROM devices 
ORDER BY pressure_plate_position_x, pressure_plate_position_y;