import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

export interface WxJsConfig {
  appId: string
  timestamp: number
  nonceStr: string
  signature: string
}

/** 获取微信 JS-SDK 配置（需要后端提供签名） */
export async function getWxConfig(url: string): Promise<WxJsConfig> {
  const res = await request.get('/wechat/jsconfig', { params: { url } })
  return res.data
}

export interface WxOAuthResult {
  openId: string
}

/**
 * 用授权回调中的 code 换取 openId。
 * 后端负责调用微信 /sns/oauth2/access_token，不在前端暴露 appSecret。
 */
export async function getOpenIdByCode(code: string): Promise<WxOAuthResult> {
  const res = await request.post('/wechat/oauth/openid', { code })
  return res.data
}
