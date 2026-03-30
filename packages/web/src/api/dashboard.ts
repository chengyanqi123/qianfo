import { request, isMock } from './request';
import type { DashboardStats, DailyCount } from '@qianfo/shared';
import { getRecentDays } from '@qianfo/shared';

export async function getDashboardStats(): Promise<DashboardStats> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      totalAppointments: 328,
      todayAppointments: 12,
      totalUsers: 156,
      pendingAppointments: 24,
    };
  }
  return request.get('/dashboard/stats');
}

export async function getDailyAppointments(days = 7): Promise<DailyCount[]> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 300));
    const dates = getRecentDays(days);
    return dates.map((date) => ({
      date,
      count: Math.floor(Math.random() * 20) + 5,
    }));
  }
  return request.get('/dashboard/daily', { params: { days } });
}

export async function getStatusDistribution(): Promise<{ status: string; label: string; count: number }[]> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 300));
    return [
      { status: 'pending', label: '待确认', count: 24 },
      { status: 'confirmed', label: '已确认', count: 189 },
      { status: 'cancelled', label: '已取消', count: 115 },
    ];
  }
  return request.get('/dashboard/status-distribution');
}
