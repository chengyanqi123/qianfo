import { request } from './request';
import type { Result } from '@qianfo/shared';

// 获取默认限制
export function getDefaultLimit(): Promise<Result<number>> {
  return request.get('/setting/capacity/default');
}

// 设置默认限制
export function setDefaultLimit(capacity: number): Promise<Result<null>> {
  return request.put('/setting/capacity/default', { capacity });
}

// 获取指定时间段的默认限制
type LimitResult = {
  default: number;
  daliys: { date: string; count: number }[];
};
export function getLimitByDate(params: { startDate: string; endDate: string }): Promise<Result<LimitResult>> {
  return request.post('/setting/capacity/config', params);
}

// 设置某一天的默认限制
export function setLimitByDate(params: { date: string; capacity: number }): Promise<Result<null>> {
  return request.put('/setting/capacity', params);
}
