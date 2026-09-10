<template>
  <div>
    <h2 class="page-title">安全签名</h2>

    <el-card shadow="never">
      <div class="table-wrap">
        <el-table v-loading="loading" :data="tableData" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="用户" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ getUserNick(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="签署时间" width="240">
            <template #default="{ row }">{{ formatTime(row.createdAt, true) }}</template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="240">
            <template #default="{ row }">{{ formatTime(row.updatedAt, true) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="showContent(row)">预览导出</el-button>
            </template>
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

    <el-dialog
      v-model="contentVisible"
      title="签署预览"
      width="min(480px, 92vw)"
      class="preview-format"
      align-center
      center
      overflow
      body-class="preview-body"
    >
      <el-watermark
        :content="[getUserNick(detail), formatTime(detail.createdAt, true)]"
        :gap="[20, 10]"
        :offset="[0, 0]"
        :height="32"
        :z-index="9999"
        :font="{
          color: 'rgba(0, 0, 0, .15)',
        }"
      >
        <div class="content-preview">{{ detail.content }}</div>
        <div class="signature-footer">
          <div class="signature">
            <img :src="signatureSrc(detail.signature)" alt="游客手写签名" class="signature-img" />
            <div class="signature-date">{{ formatTime(detail.createdAt, false) }}</div>
          </div>
        </div>
      </el-watermark>

      <template #footer>
        <div>
          <el-button type="primary" :icon="Download" :loading="exportLoading" @click="exportSignatureFile">
            导出
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { SafetyNotice } from '@qianfo/shared'
import { getSafetyNotices } from '@/api/safetyNotice'
import dayjs from 'dayjs'
import { Close, Download } from '@element-plus/icons-vue'
import html2canvas from 'html2canvas'

const loading = ref(false)
const tableData = ref<SafetyNotice[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const contentVisible = ref(false)
const exportLoading = ref(false)
const detail = ref<SafetyNotice>({
  id: 0,
  openId: '',
  content: '',
  signature: '',
  createdAt: '',
  updatedAt: '',
  userName: '',
  username: '',
  nickName: '',
})

function signatureSrc(value: string) {
  const signature = value.trim()
  if (signature.startsWith('<svg')) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(signature)}`
  }
  return signature.startsWith('data:image/') ? signature : `data:image/png;base64,${signature}`
}

function getUserNick(row: SafetyNotice) {
  return row?.nickName || row?.username || row?.userName || row?.openId || '--'
}

function formatTime(value: string, isTime: boolean) {
  return value ? dayjs(value).format(`YYYY年MM月DD日${isTime ? ' HH:mm:ss' : ''}`) : '-'
}

function showContent(value: SafetyNotice) {
  detail.value = value
  contentVisible.value = true
}

async function exportSignatureFile() {
  exportLoading.value = true
  try {
    const canvas = await html2canvas(document.querySelector('.preview-body') as HTMLElement)
    const blob = await canvasToBlob(canvas)
    const objectURL = URL.createObjectURL(blob as Blob)

    const link = document.createElement('a')
    link.href = objectURL
    link.download = `${getUserNick(detail.value)}${detail.value?.id ?? ''}.jpg`
    document.body.appendChild(link)

    link.click()
    link.remove()
    URL.revokeObjectURL(objectURL)
  } catch {
    // 导出失败时仅结束 Loading，避免阻塞用户继续操作。
  } finally {
    exportLoading.value = false
  }
}

function canvasToBlob(canvas: any, type = 'image/jpeg', quality = 1) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob: any) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Canvas 转换 Blob 失败'))
        }
      },
      type,
      quality,
    )
  })
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
  white-space: pre-wrap;
  padding: 24px;
  box-sizing: border-box;
  /* color: var(--el-text-color-primary); */
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

.signature-footer {
  display: flex;
  justify-content: end;
  padding: 0 24px;
  box-sizing: border-box;
  .signature {
    width: 200px;
    box-sizing: border-box;
    padding: 48px 0;
    .signature-img {
      width: 100%;
      height: auto;
    }
    .signature-date {
      text-align: end;
    }
  }
}

:deep(.preview-body.el-dialog__body) {
  /* max-height: min(90vh, 200px);
  overflow-y: scroll; */
  margin-top: 12px;
  background-color: #fff !important;
  color: #212121;
}

@media (max-width: 768px) {
  .page-title {
    margin-bottom: 12px;
    font-size: 17px;
  }
}
</style>
