<template>
  <div>
    <h2 class="page-title">系统用户</h2>

    <!-- 筛选 -->
    <el-card shadow="never" class="filter-card">
      <el-form :model="filter" :label-position="isMobile ? 'top' : 'right'" label-width="70px">
        <el-row :gutter="12">
          <el-col :xs="24" :sm="8" :md="6">
            <el-form-item label="用户名">
              <el-input v-model="filter.username" placeholder="搜索用户名" clearable style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8" :md="6">
            <el-form-item label="手机号">
              <el-input v-model="filter.phone" placeholder="搜索手机号" clearable style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8" :md="6">
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
          <el-table-column prop="username" label="账号" min-width="120" />
          <el-table-column prop="nickName" label="昵称" min-width="120" />
          <el-table-column label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
                {{ row.role === 'admin' ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="手机号" width="140" />
          <el-table-column label="注册时间" width="170">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
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
          :pager-count="isMobile ? 3 : 7"
          background
          @change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getUsers } from '@/api/user'
import type { User } from '@qianfo/shared'
import { useIsMobile } from '@/composables/useIsMobile'

const { isMobile } = useIsMobile()
const loading = ref(false)
const tableData = ref<User[]>([])
const total = ref(0)

const filter = reactive({
  page: 1,
  pageSize: 10,
  username: '',
  phone: '',
})

function formatTime(str: string) {
  return new Date(str).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getUsers(filter)
    tableData.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  filter.page = 1
  fetchData()
}

function onReset() {
  filter.username = ''
  filter.phone = ''
  filter.page = 1
  fetchData()
}

onMounted(fetchData)
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
