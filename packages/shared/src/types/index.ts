// ========== 预约相关 ==========

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Appointment {
  id: number
  userId: number
  date: string // 'YYYY-MM-DD'
  time: string // 'HH:mm'
  count: number // 人数
  name: string // 预约人姓名
  useVehicle: boolean // 是否需要用车
  needGuide: boolean // 是否需要导赏员
  phone: string
  status: AppointmentStatus
  createdAt: string
  remark?: string
}

export interface CreateAppointmentDto {
  date: string
  time: string
  count: number
  name: string // 预约人姓名
  useVehicle: boolean // 是否需要用车
  needGuide: boolean // 是否需要导赏员
  phone: string
  remark?: string
}

// ========== 用户相关 ==========

export type UserRole = 'admin' | 'user'

export interface User {
  id: number
  role: UserRole
  createdAt: string
  username?: string
  phone?: string
  // 微信相关
  avatar?: string
  openid?: string
  nickname?: string
  sex?: number
  province?: string
  city?: string
  country?: string
  headimgurl?: string
  privilege?: string[]
  unionid?: string
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

export interface Result<T> {
  code: number
  message: string
  data: T
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

// ========== 设置 | 预约限制相关 ==========
export interface LimitResult {
  default: number
  dailys: { date: string; count: number; confirmedCount: number }[]
}
export interface SetDefaultLimitParams {
  capacity: number
}
export interface GetLimitByDateParams {
  startDate: string
  endDate: string
}
export interface SetLimitByDateParams {
  date: string
  capacity: number
}

export interface GetAppointmentInfoByDateParams {
  startDate: string // 日期字符串 'YYYY-MM-DD'
  endDate: string // 日期字符串 'YYYY-MM-DD'
}
export type AppointmentInfoResult = Record<
  string, // 日期字符串 'YYYY-MM-DD'
  {
    limit: number // 当天的预约限制
    confirmed: number // 已预约（包含确认和预约中）的数量
    remaining: number // 剩余可预约数量
  }
>
