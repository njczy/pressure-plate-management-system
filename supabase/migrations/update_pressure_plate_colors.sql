-- 更新压板类型颜色字段约束和值
-- 先删除原有约束，更新数据，然后添加新约束

-- 删除原有的检查约束
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_pressure_plate_type_color_check;

-- 使用随机函数为每条记录分配颜色
UPDATE devices 
SET pressure_plate_type_color = CASE 
    WHEN (RANDOM() * 3)::INTEGER = 0 THEN '红色'
    WHEN (RANDOM() * 3)::INTEGER = 1 THEN '灰色'
    ELSE '黄色'
END;

-- 添加新的检查约束，允许红色、灰色、黄色
ALTER TABLE devices ADD CONSTRAINT devices_pressure_plate_type_color_check 
CHECK (pressure_plate_type_color IN ('红色', '灰色', '黄色'));

-- 验证更新结果
SELECT 
    pressure_plate_type_color,
    COUNT(*) as count
FROM devices 
GROUP BY pressure_plate_type_color
ORDER BY pressure_plate_type_color;