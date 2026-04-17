const SITE_ADDRESS = import.meta.env.VITE_SITE_ADDRESS
const WX_APP_ID = import.meta.env.VITE_WX_APP_ID
import type { LoginResult } from '@qianfo/shared'

type Scope = 'snsapi_base' | 'snsapi_userinfo'
type Options = { scope?: Scope; state?: string; [key: string]: any }

function resolveWechatRedirectUri(fullPath: string): string {
  const normalizedFullPath = fullPath.startsWith('/') ? fullPath : `/${fullPath}`

  try {
    const url = new URL(SITE_ADDRESS)
    url.hash = normalizedFullPath
    return url.toString()
  } catch {
    const normalizedSiteAddress = SITE_ADDRESS.replace(/\/$/, '')
    return `${normalizedSiteAddress}/#${normalizedFullPath}`
  }
}

export function useWechat() {
  async function login(appId?: string, options: Options = {}): Promise<LoginResult | null> {
    const { scope = 'snsapi_base', state = 'STATE' } = options
    if (!appId) {
      appId = WX_APP_ID
    }

    // 跳转微信授权页 ，获取 code
    const authBase = 'https://open.weixin.qq.com/connect/oauth2/authorize'
    const query = {
      appid: appId,
      redirect_uri: resolveWechatRedirectUri(options._fullPath || '/'),
      response_type: 'code',
      scope,
      state,
    }
    const authUrl = `${authBase}?${new URLSearchParams(query).toString()}#wechat_redirect`
    window.location.replace(authUrl)
    return Promise.resolve(null)
  }

  return { login }
}
