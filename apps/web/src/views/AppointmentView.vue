<template>
  <div>
    <h2 class="page-title">预约管理</h2>

    <!-- 筛选表单 -->
    <el-card shadow="never" class="filter-card">
      <el-form :model="filter" :label-position="isMobile ? 'top' : 'right'" label-width="70px">
        <el-row :gutter="12">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                clearable
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="6" :md="4">
            <el-form-item label="状态">
              <el-select v-model="filter.status" clearable placeholder="全部" style="width: 100%">
                <el-option label="待确认" value="pending" />
                <el-option label="已确认" value="confirmed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="6" :md="5">
            <el-form-item label="手机号">
              <el-input v-model="filter.phone" placeholder="搜索手机号" clearable style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="7">
            <el-form-item :label="isMobile ? '' : ' '">
              <div class="filter-actions">
                <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
                <el-button :icon="Refresh" @click="onReset">重置</el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never">
      <div class="table-wrap">
        <el-table v-loading="loading" :data="tableData" border stripe>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="date" label="预约日期" width="110" />
          <el-table-column prop="time" label="时间" width="80" />
          <el-table-column prop="count" label="人数" width="70" align="center" />
          <el-table-column prop="phone" label="联系电话" width="130" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">
                {{ statusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
          <el-table-column prop="createdAt" label="提交时间" width="170">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'pending'"
                type="success"
                size="small"
                plain
                @click="changeStatus(row, 'confirmed')"
              >
                确认
              </el-button>
              <el-button
                v-if="row.status !== 'cancelled'"
                type="danger"
                size="small"
                plain
                @click="changeStatus(row, 'cancelled')"
              >
                取消
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination">
        <el-pagination
          v-model:current-page="filter.page"
          v-model:page-size="filter.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next'"
          :pager-count="isMobile ? 5 : 7"
          background
          @change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';
import { getAppointments, updateAppointmentStatus } from '@/api/appointment';
import type { Appointment, AppointmentStatus } from '@qianfo/shared';
import { useIsMobile } from '@/composables/useIsMobile';

const { isMobile } = useIsMobile();
const loading = ref(false);
const tableData = ref<Appointment[]>([]);
const total = ref(0);
const dateRange = ref<[string, string] | null>(null);

const filter = reactive({
  page: 1,
  pageSize: 10,
  phone: '',
  status: '' as AppointmentStatus | '',
  dateStart: '',
  dateEnd: '',
});

const statusText = (s: AppointmentStatus) => ({ pending: '待确认', confirmed: '已确认', cancelled: '已取消' })[s];

const statusTagType = (s: AppointmentStatus) =>
  (({ pending: 'warning', confirmed: 'success', cancelled: 'danger' }) as const)[s];

function formatTime(str: string) {
  return new Date(str).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
}

async function fetchData() {
  loading.value = true;
  try {
    filter.dateStart = dateRange.value?.[0] ?? '';
    filter.dateEnd = dateRange.value?.[1] ?? '';
    const res = await getAppointments(filter);
    tableData.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  filter.page = 1;
  fetchData();
}

function onReset() {
  filter.phone = '';
  filter.status = '';
  dateRange.value = null;
  filter.page = 1;
  fetchData();
}

async function changeStatus(row: Appointment, status: AppointmentStatus) {
  const labels: Record<AppointmentStatus, string> = {
    confirmed: '确认',
    cancelled: '取消',
    pending: '重置为待确认',
  };
  await ElMessageBox.confirm(`确定要${labels[status]}该预约吗？`, '操作确认', {
    type: 'warning',
  });
  try {
    await updateAppointmentStatus(row.id, status);
    row.status = status;
    ElMessage.success('操作成功');
  } catch (e: any) {
    ElMessage.error(e.message);
  }
}

onMounted(fetchData);
</script>

<style scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.filter-card {
  margin-bottom: 16px;
}

.filter-card :deep(.el-card__body) {
  padding-bottom: 0;
}

.filter-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 表格横向滚动容器 */
.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 17px;
    margin-bottom: 12px;
  }
}
</style>
