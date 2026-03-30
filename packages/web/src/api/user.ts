import { request, isMock } from './request';
import type { User, PageResult } from '@qianfo/shared';

export interface UserFilter {
  page: number;
  pageSize: number;
  username?: string;
  phone?: string;
}

const MOCK_USERS: User[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  username: `user${String(i + 1).padStart(3, '0')}`,
  role: i === 0 ? ('admin' as const) : ('user' as const),
  phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
  createdAt: new Date(Date.now() - i * 2 * 86400000).toISOString(),
}));

export async function getUsers(filter: UserFilter): Promise<PageResult<User>> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 400));
    let data = [...MOCK_USERS];
    if (filter.username) data = data.filter((u) => u.username?.includes(filter.username!));
    if (filter.phone) data = data.filter((u) => u.phone?.includes(filter.phone!));
    const start = (filter.page - 1) * filter.pageSize;
    return {
      list: data.slice(start, start + filter.pageSize),
      total: data.length,
      page: filter.page,
      pageSize: filter.pageSize,
    };
  }
  return request.get('/users', { params: filter });
}
