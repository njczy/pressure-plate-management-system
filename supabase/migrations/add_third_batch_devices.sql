-- 添加第三批设备数据（向家坝变电站，压板位置为下）
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
  (21, '向家坝变电站', '主变保护屏', '主变差动保护', '向家坝主变差动保护压板', 'hard', '压板术语', '投入', '主变差动保护压板', 'pressure_plate', 'bottom', 150, 300, NOW(), NOW()),
  (22, '向家坝变电站', '主变保护屏', '主变后备保护', '向家坝主变后备保护压板', 'hard', '压板术语', '投入', '主变后备保护压板', 'pressure_plate', 'bottom', 250, 300, NOW(), NOW()),
  (23, '向家坝变电站', '主变保护屏', '线路保护', '向家坝线路保护压板1', 'hard', '压板术语', '投入', '线路保护压板1', 'pressure_plate', 'bottom', 350, 300, NOW(), NOW()),
  (24, '向家坝变电站', '主变保护屏', '线路保护', '向家坝线路保护压板2', 'hard', '压板术语', '投入', '线路保护压板2', 'pressure_plate', 'bottom', 450, 300, NOW(), NOW()),
  (25, '向家坝变电站', '主变保护屏', '母线保护', '向家坝母线保护压板', 'hard', '压板术语', '投入', '母线保护压板', 'pressure_plate', 'bottom', 550, 300, NOW(), NOW()),
  (26, '向家坝变电站', '主变保护屏', '失灵保护', '向家坝失灵保护压板', 'hard', '压板术语', '投入', '失灵保护压板', 'pressure_plate', 'bottom', 650, 300, NOW(), NOW()),
  (27, '向家坝变电站', '主变保护屏', '重合闸', '向家坝重合闸压板', 'hard', '压板术语', '投入', '重合闸压板', 'pressure_plate', 'bottom', 750, 300, NOW(), NOW()),
  (28, '向家坝变电站', '主变保护屏', '备用保护', '向家坝备用保护压板1', 'hard', '压板术语', '投入', '备用保护压板1', 'backup', 'bottom', 850, 300, NOW(), NOW()),
  (29, '向家坝变电站', '主变保护屏', '备用保护', '向家坝备用保护压板2', 'hard', '压板术语', '投入', '备用保护压板2', 'backup', 'bottom', 950, 300, NOW(), NOW()),
  (30, '向家坝变电站', '主变保护屏', '出口', '向家坝出口压板', 'hard', '压板术语', '投入', '出口压板', 'outlet', 'bottom', 1050, 300, NOW(), NOW());