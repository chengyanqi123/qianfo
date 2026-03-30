// ========== 预约相关 ==========

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Appointment {
  id: number;
  userId: number;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  count: number; // 人数
  phone: string;
  status: AppointmentStatus;
  remark?: string;
  createdAt: string;
}

export interface CreateAppointmentDto {
  date: string;
  time: string;
  count: number;
  phone: string;
  remark?: string;
}

// ========== 用户相关 ==========

export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  role: UserRole;
  createdAt: string;
  username?: string;
  phone?: string;
  // 微信相关
  openid?: string;
  nickname?: string;
  sex?: number;
  province?: string;
  city?: string;
  country?: string;
  headimgurl?: string;
  privilege?: string[];
  unionid?: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

// ========== 通用分页 ==========

export interface PageQuery {
  page: number;
  pageSize: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Result<T> {
  code: number;
  message: string;
  data: T;
}

// ========== Dashboard 统计 ==========

export interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  totalUsers: number;
  pendingAppointments: number;
}

export interface DailyCount {
  date: string;
  count: number;
}
