<template>
  <div>
    <h2 class="page-title">系统用户</h2>

    <!-- 筛选 -->
    <el-card shadow="never" class="filter-card">
      <el-form :model="filter" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="filter.username"
            placeholder="搜索用户名"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="filter.phone"
            placeholder="搜索手机号"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
          <el-button :icon="Refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never">
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" min-width="120" />
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

      <div class="pagination">
        <el-pagination
          v-model:current-page="filter.page"
          v-model:page-size="filter.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
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

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
