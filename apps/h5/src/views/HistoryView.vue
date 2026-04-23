<template>
  <div>
    <!-- <van-nav-bar title="预约历史" /> -->

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="page-container">
        <van-empty v-if="!loading && list.length === 0" description="暂无预约记录" image="search" />

        <div v-else class="card-list">
          <div
            class="appointment-card"
            :class="{ expired: isExpired(`${item.date} ${item.time}`) }"
            v-for="item in list"
            :key="item.id"
          >
            <div class="card-header">
              <span class="date-time">{{ item.date }} {{ item.time }}</span>
              <span v-if="isExpired(`${item.date} ${item.time}`) && item.status === 'pending'" class="status expired">
                已过期
              </span>
              <span v-else class="status" :class="statusTagType(item.status)">{{ statusText(item.status) }}</span>
            </div>
            <div class="card-body">
              <div class="info-row">
                <van-icon name="contact-o" />
                <span>预约人：{{ item.name }}</span>
              </div>
              <div class="info-row">
                <van-icon name="friends-o" />
                <span>预约人数：{{ item.count }} 人</span>
              </div>
              <div class="info-row">
                <van-icon name="guide-o" />
                <span>需要用车：{{ item.useVehicle ? '是' : '否' }}</span>
              </div>
              <div class="info-row">
                <van-icon name="flag-o" />
                <span>需要导赏员：{{ item.needGuide ? '是' : '否' }}</span>
              </div>
              <div class="info-row">
                <van-icon name="phone-o" />
                <span>联系电话：{{ item.phone }}</span>
              </div>
              <div v-if="item.remark" class="info-row">
                <van-icon name="notes-o" />
                <span>备注：{{ item.remark }}</span>
              </div>
            </div>
            <div class="card-footer">
              <span class="created-at">提交于 {{ formatTime(item.createdAt) }}</span>
              <div v-if="!isExpired(`${item.date} ${item.time}`) && item.status === 'pending'">
                <van-button size="small" type="primary" plain round @click.stop="showQrCode(item)"> 去核销 </van-button>
                <van-button
                  style="margin-left: 12px"
                  size="small"
                  type="danger"
                  plain
                  round
                  :loading="cancellingId === item.id"
                  @click.stop="onCancel(item)"
                >
                  取消预约
                </van-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <van-loading v-if="loading && list.length === 0" class="center-loading" />
        <div class="buttom-text">
          <van-divider v-if="noMore && list.length > 0">没有更多了</van-divider>
          <div v-if="!noMore && list.length > 0" class="load-more" @click="loadMore">&gt;&gt;点击加载更多&lt;&lt;</div>
        </div>
      </div>
    </van-pull-refresh>

    <!-- 核销二维码弹窗 -->
    <van-popup
      v-model:show="qrVisible"
      round
      closeable
      :close-on-click-overlay="false"
      style="padding: 32px"
      @closed="qrClose"
    >
      <div class="qr-container">
        <p class="qr-title">核销二维码</p>
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="二维码" class="qr-image" />
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts">
export default { name: 'HistoryView' }
</script>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showSuccessToast, showConfirmDialog } from 'vant'
import { getAppointmentHistory, cancelAppointment, getAppointmentStatus } from '@/api/appointment'
import { trackMonitorEvent, type Appointment, type AppointmentStatus } from '@qianfo/shared'
import QRCode from 'qrcode'
import { trackUmengEvent } from '@/analytics/umeng'
import dayjs from 'dayjs'

const list = ref<Appointment[]>([])
const loading = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = 10
const noMore = ref(false)
const cancellingId = ref<number | null>(null)
const qrVisible = ref(false)
const qrDataUrl = ref('')
const qrId = ref(0)

const statusText = (status: AppointmentStatus) => {
  const map: Record<AppointmentStatus, string> = {
    pending: '待确认',
    confirmed: '已确认',
    cancelled: '已取消',
  }
  return map[status]
}

const statusTagType = (status: AppointmentStatus): 'warning' | 'success' | 'danger' => {
  const map: Record<AppointmentStatus, 'warning' | 'success' | 'danger'> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'danger',
  }
  return map[status]
}

function formatTime(str: string) {
  const d = new Date(str)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function fetchList(reset = false) {
  if (loading.value) return
  loading.value = true
  try {
    if (reset) {
      page.value = 1
      list.value = []
      noMore.value = false
    }
    if (import.meta.env.DEV) {
      const start = (page.value - 1) * pageSize
      const pageList = mockList.slice(start, start + pageSize)
      list.value = reset ? pageList : [...list.value, ...pageList]
      noMore.value = list.value.length >= mockList.length
      return
    }
    const res = await getAppointmentHistory(page.value, pageSize)
    list.value = reset ? res.list : [...list.value, ...res.list]
    noMore.value = list.value.length >= res.total
  } catch (e: any) {
    // showFailToast(e.message || '加载失败');
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function onRefresh() {
  fetchList(true)
}

function loadMore() {
  page.value++
  fetchList()
}

onMounted(() => fetchList(true))

// 是否过期。
const isExpired = (date: string | Date) => dayjs(date).isBefore(dayjs())

let loopId: NodeJS.Timeout
async function showQrCode(item: Appointment) {
  const content = JSON.stringify({ id: item.id, date: item.date, time: item.time })
  qrDataUrl.value = await QRCode.toDataURL(content, { width: 250, margin: 2 })
  qrId.value = item.id
  qrVisible.value = true
  trackMonitorEvent('appointment_qrcode_open', {
    attributes: {
      appointment_count: item.count,
      status: item.status,
    },
    data: {
      appointment_id: item.id,
      date: item.date,
      time: item.time,
    },
  })
  trackUmengEvent('appointment_qrcode_open', {
    appointment_count: item.count,
    status: item.status,
    appointment_id: item.id,
    date: item.date,
    time: item.time,
  })
  loopId = setInterval(() => {
    getAppointmentStatus(item.id).then((status) => {
      if (status === 'confirmed') {
        const target = list.value.find((i) => i.id === qrId.value)
        if (target) target.status = 'confirmed'
        trackMonitorEvent('appointment_writeoff_confirmed', {
          attributes: {
            result: 'success',
            appointment_count: item.count,
          },
          data: {
            appointment_id: item.id,
            date: item.date,
            time: item.time,
          },
        })
        trackUmengEvent('appointment_writeoff_confirmed', {
          result: 'success',
          appointment_count: item.count,
          appointment_id: item.id,
          date: item.date,
          time: item.time,
        })
        resetQr()
        showSuccessToast('核销成功')
      }
    })
  }, 2000)
}
function qrClose() {
  clearInterval(loopId)
  resetQr()
}
function resetQr() {
  qrDataUrl.value = ''
  qrId.value = 0
  qrVisible.value = false
}

async function onCancel(item: Appointment) {
  try {
    await showConfirmDialog({
      title: '取消预约',
      message: `确认取消 ${item.date} ${item.time} 的预约吗？`,
      confirmButtonText: '确认取消',
      cancelButtonText: '再想想',
      confirmButtonColor: '#ee0a24',
    })
  } catch {
    return // 用户点击"再想想"
  }
  cancellingId.value = item.id
  try {
    await cancelAppointment(item.id)
    item.status = 'cancelled'
    trackMonitorEvent('appointment_cancel', {
      attributes: {
        result: 'success',
        appointment_count: item.count,
      },
      data: {
        appointment_id: item.id,
        date: item.date,
        time: item.time,
      },
    })
    trackUmengEvent('appointment_cancel', {
      result: 'success',
      appointment_count: item.count,
      appointment_id: item.id,
      date: item.date,
      time: item.time,
    })
    showSuccessToast('预约已取消')
  } catch (e: any) {
    trackMonitorEvent('appointment_cancel', {
      attributes: {
        result: 'failure',
        appointment_count: item.count,
      },
      data: {
        appointment_id: item.id,
        reason: e?.message || 'unknown',
      },
    })
    trackUmengEvent('appointment_cancel', {
      result: 'failure',
      appointment_count: item.count,
      appointment_id: item.id,
      reason: e?.message || 'unknown',
    })
    // showFailToast(e.message || '取消失败，请重试');
  } finally {
    cancellingId.value = null
  }
}
</script>

<style scoped>
.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.appointment-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.appointment-card.expired {
  background-color: #faf9fb;
  color: #57575b;
  opacity: 0.8;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.date-time {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.status.warning {
  color: #ff976a;
  background: #fff7f0;
}

.status.success {
  color: #07c160;
  background: #edfff3;
}

.status.danger {
  color: #ee0a24;
  background: #fff0f0;
}
.status.expired {
  color: #666467;
  background: #e9e9eb;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #646566;
}

.card-footer {
  margin-top: 12px;
  border-top: 1px solid #f5f5f5;
  padding-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.created-at {
  font-size: 12px;
  color: #969799;
}

.center-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.load-more {
  text-align: center;
  padding: 12px;
  color: #1989fa;
  font-size: 14px;
  cursor: pointer;
}

.buttom-text {
  padding: 16px 0 32px 0;
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.qr-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.qr-image {
  width: 250px;
  height: 250px;
}
</style>
