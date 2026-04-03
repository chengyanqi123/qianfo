import { request } from './request';
import type { LoginDto, LoginResult } from '@qianfo/shared';
import { AUTH_LOGIN } from '@qianfo/shared';

/** 登录 */
export async function login(dto: LoginDto): Promise<LoginResult> {
  return request.post(AUTH_LOGIN, dto);
}

/** 修改密码 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  return request.post('/auth/change-password', { oldPassword, newPassword });
}
