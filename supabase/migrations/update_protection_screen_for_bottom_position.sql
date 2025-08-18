-- 更新压板位置为'bottom'的设备记录的保护屏字段为'保护屏C'
UPDATE devices 
SET protection_screen = '保护屏C'
WHERE pressure_plate_position = 'bottom';

-- 验证更新结果
SELECT 
    id,
    power_station,
    protection_screen,
    pressure_plate_position,
    pressure_plate_name
FROM devices 
WHERE pressure_plate_position = 'bottom'
ORDER BY id;