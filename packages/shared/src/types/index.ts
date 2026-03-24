// ========== 预约相关 ==========

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Appointment {
  id: number
  userId: number
  date: string          // 'YYYY-MM-DD'
  time: string          // 'HH:mm'
  count: number         // 人数
  phone: string
  status: AppointmentStatus
  remark?: string
  createdAt: string
}

export interface CreateAppointmentDto {
  date: string
  time: string
  count: number
  phone: string
  remark?: string
}

// ========== 用户相关 ==========

export type UserRole = 'admin' | 'user'

export interface User {
  id: number
  username: string
  role: UserRole
  phone?: string
  createdAt: string
}

export interface LoginDto {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: User
}

// ========== 通用分页 ==========

export interface PageQuery {
  page: number
  pageSize: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// ========== Dashboard 统计 ==========

export interface DashboardStats {
  totalAppointments: number
  todayAppointments: number
  totalUsers: number
  pendingAppointments: number
}

export interface DailyCount {
  date: string
  count: number
}
