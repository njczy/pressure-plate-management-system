import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表类型定义
export interface Device {
  id: number
  sequence: number
  power_station: string
  protection_screen: string
  device_issue: string
  pressure_plate_name: string
  type: 'soft' | 'hard'
  pressure_plate_box: string
  pressure_plate_time: string // 压板动词
  pressure_plate_general_name: string // 压板总称
  pressure_plate_type_color: 'outlet' | 'pressure_plate' | 'backup' // 压板类型颜色：出口、压板、备用
  pressure_plate_position: 'top' | 'middle' | 'bottom' // 压板位置：上、中、下
  pressure_plate_position_x: number // 压板位置X轴
  pressure_plate_position_y: number // 压板位置Y轴
  created_at?: string
  updated_at?: string
}

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'operator' | 'viewer'
  created_at?: string
  updated_at?: string
}

export interface OperationLog {
  id: number
  user_id: string
  device_id: number
  operation_type: 'create' | 'update' | 'delete' | 'import'
  operation_details: string
  created_at?: string
}