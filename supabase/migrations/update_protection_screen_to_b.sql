-- 更新保护屏名称：将'主变保护屏'改为'保护屏B'
-- 这将影响压板位置为'上'和'中'的所有设备记录

UPDATE devices 
SET protection_screen = '保护屏B'
WHERE protection_screen = '主变保护屏';

-- 验证更新结果
SELECT 
    protection_screen,
    pressure_plate_position,
    COUNT(*) as count
FROM devices 
GROUP BY protection_screen, pressure_plate_position
ORDER BY protection_screen, pressure_plate_position;