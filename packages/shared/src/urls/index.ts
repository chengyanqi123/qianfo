// Auth
export const AUTH_LOGIN = '/auth/login';
export const AUTH_H5_LOGIN = '/auth/h5/login';

// Appointments
export const APPOINTMENTS = '/appointments';
export const APPOINTMENTS_HISTORY = '/appointments/history';
export const appointmentStatusUrl = (id: number) => `/appointments/${id}/status`;
export const appointments_write_off = (id: number) => `/appointments/${id}/verify`;
export const appointments_status = (id: number) => `/appointments/${id}/status`;

// Users
export const USERS = '/users';

// Dashboard
export const DASHBOARD_STATS = '/dashboard/stats';
export const DASHBOARD_DAILY = '/dashboard/daily';
export const DASHBOARD_STATUS_DISTRIBUTION = '/dashboard/status-distribution';

// Setting / Capacity
export const SETTING_CAPACITY_DEFAULT = '/setting/capacity/default';
export const SETTING_CAPACITY_CONFIG = '/setting/capacity/config';
export const SETTING_CAPACITY = '/setting/capacity';
export const SETTING_CAPACITY_APPOINTMENT = '/setting/capacity/appointment';
