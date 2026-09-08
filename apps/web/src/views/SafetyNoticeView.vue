<template>
  <div>
    <h2 class="page-title">安全签名</h2>

    <el-card shadow="never">
      <div class="table-wrap">
        <el-table v-loading="loading" :data="tableData" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="openId" label="微信 OpenID" min-width="180" show-overflow-tooltip />
          <el-table-column label="游客签字" width="140">
            <template #default="{ row }">
              <button
                v-if="isImageSignature(row.signature)"
                type="button"
                class="signature-thumb"
                @click="showSignature(row.signature)"
              >
                <img :src="row.signature" alt="游客手写签名" />
              </button>
              <span v-else>{{ row.signature || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="签署内容" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <el-button link type="primary" @click="showContent(row.content)">查看须知</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="签署时间" width="180">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="180">
            <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @change="fetchData"
        />
      </div>
    </el-card>

    <el-dialog v-model="contentVisible" title="安全须知及承诺书" width="min(680px, 92vw)">
      <div class="content-preview">{{ content }}</div>
    </el-dialog>

    <el-dialog v-model="signatureVisible" title="游客手写签名" width="min(520px, 92vw)">
      <div v-if="signatureImage" class="signature-preview-wrap">
        <img :src="signatureImage" alt="游客手写签名" class="signature-preview" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { SafetyNotice } from '@qianfo/shared'
import { getSafetyNotices } from '@/api/safetyNotice'

const loading = ref(false)
const tableData = ref<SafetyNotice[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const contentVisible = ref(false)
const content = ref('')
const signatureVisible = ref(false)
const signatureImage = ref('')

function isImageSignature(value: string) {
  return typeof value === 'string' && value.startsWith('data:image/')
}

function showSignature(value: string) {
  signatureImage.value = value
  signatureVisible.value = true
}

function formatTime(value: string) {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') : '-'
}

function showContent(value: string) {
  content.value = value
  contentVisible.value = true
}

async function fetchData() {
  loading.value = true
  try {
    const result = await getSafetyNotices(page.value, pageSize.value)
    tableData.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.page-title {
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
}

.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 16px;
}

.content-preview {
  max-height: 60vh;
  overflow-y: auto;
  white-space: pre-wrap;
  color: var(--el-text-color-primary);
  line-height: 1.8;
}

.signature-thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 110px;
  height: 48px;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-fill-color-blank);
  cursor: pointer;
}

.signature-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.signature-preview-wrap {
  display: flex;
  justify-content: center;
  padding: 12px;
  background: #fff;
}

.signature-preview {
  display: block;
  width: 100%;
  max-height: 300px;
  object-fit: contain;
}

@media (max-width: 768px) {
  .page-title {
    margin-bottom: 12px;
    font-size: 17px;
  }
}
</style>
