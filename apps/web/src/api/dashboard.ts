import { request } from './request';
import type { DashboardStats, DailyCount } from '@qianfo/shared';
import { DASHBOARD_STATS, DASHBOARD_DAILY, DASHBOARD_STATUS_DISTRIBUTION } from '@qianfo/shared';

/** 获取count统计信息 */
export async function getDashboardStats(): Promise<DashboardStats> {
  return request.get(DASHBOARD_STATS);
}

/** 获取近n天的预约人数 */
export async function getDailyAppointments(days = 7): Promise<DailyCount[]> {
  return request.get(DASHBOARD_DAILY, { params: { days } });
}

/** 获取预约状态统计 */
export async function getStatusDistribution(): Promise<{ status: string; label: string; count: number }[]> {
  return request.get(DASHBOARD_STATUS_DISTRIBUTION);
}
