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
