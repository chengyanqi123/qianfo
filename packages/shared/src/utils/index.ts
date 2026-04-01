import dayjs from 'dayjs';

export { createRequest } from './request';

/**
 * 获取最近 n 天的日期列表（YYYY-MM-DD）
 */
export function getRecentDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return dayjs(d).format('YYYY-MM-DD');
  });
}
