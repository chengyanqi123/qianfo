import type { LoginResult } from '@qianfo/shared';
import { AUTH_H5_LOGIN } from '@qianfo/shared';
import { request } from './request';

/** 用户登录 */
export async function login(code: string): Promise<LoginResult> {
  return request.post(AUTH_H5_LOGIN, { code });
}
