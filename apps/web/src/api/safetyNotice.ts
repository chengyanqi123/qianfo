import type { PageResult, SafetyNotice } from '@qianfo/shared'
import { SAFETY_NOTICE } from '@qianfo/shared'
import { request } from './request'

/** 分页获取游客安全须知签名列表 */
export function getSafetyNotices(page = 1, pageSize = 10): Promise<PageResult<SafetyNotice>> {
  return request.get(SAFETY_NOTICE, { params: { page, pageSize } })
}
