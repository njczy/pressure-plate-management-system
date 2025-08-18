-- 删除devices表中的所有现有数据并重新创建10条统一数据
-- 执行时间: 2024-01-18

-- 删除所有现有数据
DELETE FROM devices;

-- 重置序列（如果使用自增ID）
ALTER SEQUENCE devices_id_seq RESTART WITH 1;

-- 插入10条统一格式的新数据
INSERT INTO devices (
    sequence,
    power_station,
    protection_screen,
    device_issue,
    pressure_plate_name,
    type,
    pressure_plate_box,
    pressure_plate_time,
    pressure_plate_general_name,
    pressure_plate_type_color,
    pressure_plate_position,
    pressure_plate_position_x,
    pressure_plate_position_y,
    created_at,
    updated_at
) VALUES 
    (1, '华能电站', '保护屏A', '主变保护', '出口压板001', 'hard', '压板术语', '投入', '主变压器出口压板', 'outlet', 'top', 100, 50, NOW(), NOW()),
    (2, '华能电站', '保护屏A', '主变保护', '出口压板002', 'hard', '压板术语', '投入', '主变压器出口压板', 'outlet', 'top', 120, 50, NOW(), NOW()),
    (3, '华能电站', '保护屏A', '主变保护', '出口压板003', 'hard', '压板术语', '投入', '主变压器出口压板', 'outlet', 'top', 140, 50, NOW(), NOW()),
    (4, '华能电站', '保护屏A', '主变保护', '出口压板004', 'hard', '压板术语', '投入', '主变压器出口压板', 'outlet', 'top', 160, 50, NOW(), NOW()),
    (5, '华能电站', '保护屏A', '主变保护', '出口压板005', 'hard', '压板术语', '投入', '主变压器出口压板', 'outlet', 'top', 180, 50, NOW(), NOW()),
    (6, '华能电站', '保护屏A', '主变保护', '出口压板006', 'hard', '压板术语', '投入', '主变压器出口压板', 'outlet', 'top', 200, 50, NOW(), NOW()),
    (7, '华能电站', '保护屏A', '主变保护', '出口压板007', 'hard', '压板术语', '投入', '主变压器出口压板', 'outlet', 'top', 220, 50, NOW(), NOW()),
    (8, '华能电站', '保护屏A', '主变保护', '出口压板008', 'hard', '压板术语', '投入', '主变压器出口压板', 'outlet', 'top', 240, 50, NOW(), NOW()),
    (9, '华能电站', '保护屏A', '主变保护', '出口压板009', 'hard', '压板术语', '投入', '主变压器出口压板', 'outlet', 'top', 260, 50, NOW(), NOW()),
    (10, '华能电站', '保护屏A', '主变保护', '出口压板010', 'hard', '压板术语', '投入', '主变压器出口压板', 'outlet', 'top', 280, 50, NOW(), NOW());

-- 验证插入的数据
SELECT COUNT(*) as total_records FROM devices;
SELECT * FROM devices ORDER BY id;