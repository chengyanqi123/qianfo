<template>
  <div>
    <van-nav-bar title="预约历史" />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="page-container">
        <van-empty v-if="!loading && list.length === 0" description="暂无预约记录" image="search" />

        <div v-else class="card-list">
          <div v-for="item in list" :key="item.id" class="appointment-card">
            <div class="card-header">
              <span class="date-time">{{ item.date }} {{ item.time }}</span>
              <van-tag :type="statusTagType(item.status)" round>
                {{ statusText(item.status) }}
              </van-tag>
            </div>
            <div class="card-body">
              <div class="info-row">
                <van-icon name="friends-o" />
                <span>预约人数：{{ item.count }} 人</span>
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
              <van-button
                v-if="item.status === 'pending'"
                size="small"
                type="danger"
                plain
                round
                :loading="cancellingId === item.id"
                @click="onCancel(item)"
              >
                取消预约
              </van-button>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <van-loading v-if="loading && list.length === 0" class="center-loading" />
        <van-divider v-if="noMore && list.length > 0">没有更多了</van-divider>
        <div v-if="!noMore && list.length > 0" class="load-more" @click="loadMore">加载更多</div>
      </div>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { showFailToast, showSuccessToast, showConfirmDialog } from 'vant';
import { getAppointmentHistory, cancelAppointment } from '@/api/appointment';
import type { Appointment, AppointmentStatus } from '@qianfo/shared';

const list = ref<Appointment[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const noMore = ref(false);
const cancellingId = ref<number | null>(null);

const statusText = (status: AppointmentStatus) => {
  const map: Record<AppointmentStatus, string> = {
    pending: '待确认',
    confirmed: '已确认',
    cancelled: '已取消',
  };
  return map[status];
};

const statusTagType = (status: AppointmentStatus): 'warning' | 'success' | 'danger' => {
  const map: Record<AppointmentStatus, 'warning' | 'success' | 'danger'> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'danger',
  };
  return map[status];
};

function formatTime(str: string) {
  const d = new Date(str);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

async function fetchList(reset = false) {
  if (loading.value) return;
  loading.value = true;
  try {
    if (reset) {
      page.value = 1;
      list.value = [];
      noMore.value = false;
    }
    const res = await getAppointmentHistory(page.value, pageSize);
    list.value = reset ? res.list : [...list.value, ...res.list];
    total.value = res.total;
    noMore.value = list.value.length >= res.total;
  } catch (e: any) {
    showFailToast(e.message || '加载失败');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

function onRefresh() {
  fetchList(true);
}

function loadMore() {
  page.value++;
  fetchList();
}

onMounted(() => fetchList(true));

async function onCancel(item: Appointment) {
  try {
    await showConfirmDialog({
      title: '取消预约',
      message: `确认取消 ${item.date} ${item.time} 的预约吗？`,
      confirmButtonText: '确认取消',
      cancelButtonText: '再想想',
      confirmButtonColor: '#ee0a24',
    });
  } catch {
    return; // 用户点击"再想想"
  }
  cancellingId.value = item.id;
  try {
    await cancelAppointment(item.id);
    item.status = 'cancelled';
    showSuccessToast('预约已取消');
  } catch (e: any) {
    showFailToast(e.message || '取消失败，请重试');
  } finally {
    cancellingId.value = null;
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
</style>
