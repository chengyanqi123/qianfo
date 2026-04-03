import { request } from './request';
import type { User, PageResult } from '@qianfo/shared';
import { USERS } from '@qianfo/shared';

export interface UserFilter {
  page: number;
  pageSize: number;
  username?: string;
  phone?: string;
}

/** 分页获取用户列表 */
export async function getUsers(filter: UserFilter): Promise<PageResult<User>> {
  return request.get(USERS, { params: filter });
}
