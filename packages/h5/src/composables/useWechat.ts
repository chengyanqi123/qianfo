import * as Apis from '@/api/appointment'
const SITE_ADDRESS = import.meta.env.VITE_SITE_ADDRESS
const WX_APP_ID = import.meta.env.VITE_WX_APP_ID
import type { LoginResult } from '@qianfo/shared'

type Scope = 'snsapi_base' | 'snsapi_userinfo'
export function useWechat() {
  async function login(appId?: string, options: { scope?: Scope; state?: string } = {}): Promise<LoginResult | null> {
    const { scope = 'snsapi_base', state = 'STATE' } = options
    if (!appId) {
      appId = WX_APP_ID
    }

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      return Apis.login(code)
    }

    // 跳转微信授权页 ，获取 code
    const authBase = 'https://open.weixin.qq.com/connect/oauth2/authorize'
    const query = {
      appid: WX_APP_ID,
      redirect_uri: SITE_ADDRESS,
      response_type: 'code',
      scope,
      state,
    }
    const authUrl = `${authBase}?${new URLSearchParams(query).toString()}#wechat_redirect`
    window.location.replace(authUrl)
    return Promise.reject(null)
  }

  return { login }
}
