import { request, isMock } from './request';
import type { LoginDto, LoginResult } from '@qianfo/shared';

const MOCK_USER = {
  id: 1,
  username: 'admin',
  role: 'admin' as const,
  createdAt: '2026-01-01T00:00:00Z',
};

export async function login(dto: LoginDto): Promise<LoginResult> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 800));
    if (dto.username === 'admin' && dto.password === '123456') {
      return { token: 'mock-token-admin-abc123', user: MOCK_USER };
    }
    throw new Error('账号或密码错误');
  }
  return request.post('/auth/login', dto);
}
