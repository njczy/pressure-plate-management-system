-- 验证所有设备记录的所属电站是否已成功更新为'华能电站'
SELECT DISTINCT power_station FROM devices;

-- 显示所有设备记录的数量
SELECT COUNT(*) as total_devices FROM devices;

-- 显示华能电站的设备数量
SELECT COUNT(*) as huaneng_devices FROM devices WHERE power_station = '华能电站';