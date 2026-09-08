import type { SafetyNotice, SafetyNoticeDTO } from '@qianfo/shared'
import { SAFETY_NOTICE } from '@qianfo/shared'
import { request } from './request'

/** 提交游客安全须知签名 */
export function submitSafetyNotice(dto: SafetyNoticeDTO): Promise<SafetyNotice> {
  return request.post(SAFETY_NOTICE, dto)
}
