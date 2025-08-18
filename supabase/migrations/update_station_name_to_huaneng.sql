-- 将所有设备记录的所属电站字段统一更新为'华能电站'
-- 更新时间: 2024年

UPDATE devices 
SET power_station = '华能电站'
WHERE power_station IN ('溪洛渡变电站', '白鹤滩变电站', '向家坝变电站');

-- 验证更新结果
-- SELECT DISTINCT power_station FROM devices;