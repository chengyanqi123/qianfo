<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { showFailToast } from 'vant'
import { submitSafetyNotice } from '@/api/safetyNotice'
import { SAFETY_NOTICE_CONTENT } from '@/constants/safetyNotice'
import SignaturePad from '@/components/SignaturePad.vue'

const visible = defineModel<boolean>('visible', { required: true })
const signature = shallowRef('')
const submitting = shallowRef(false)
const canSubmit = computed(() => Boolean(signature.value) && !submitting.value)
const noticeLines = SAFETY_NOTICE_CONTENT.split('\n')
const noticeTitle = noticeLines[0]

async function onSubmit() {
  if (!signature.value) {
    showFailToast('请完成手写签字')
    return
  }

  submitting.value = true
  try {
    await submitSafetyNotice({ content: SAFETY_NOTICE_CONTENT, signature: signature.value })
    visible.value = false
    signature.value = ''
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <van-popup v-model:show="visible" position="bottom" round :close-on-click-overlay="false" :style="{ height: '88%' }">
    <div class="safety-dialog">
      <div class="safety-header">
        <h2>森林防火安全须知</h2>
        <p>请认真阅读并完成签名后继续使用预约服务</p>
      </div>
      <div class="safety-content">
        <h3>{{ noticeTitle }}</h3>
        <p v-for="(paragraph, index) in noticeLines.slice(1)" :key="index" class="notice-line">
          {{ paragraph || ' ' }}
        </p>
      </div>
      <div class="safety-footer">
        <div class="signature-section">
          <div class="signature-label">游客签字</div>
          <SignaturePad v-model="signature" />
        </div>
        <van-button block round type="primary" :loading="submitting" :disabled="!canSubmit" @click="onSubmit">
          同意并提交签名
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<style scoped>
.safety-dialog {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.safety-header {
  padding: 20px 20px 12px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.safety-header h2 {
  margin: 0;
  font-size: 19px;
  color: #1f2329;
}

.safety-header p {
  margin: 8px 0 0;
  color: #969799;
  font-size: 13px;
}

.safety-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  color: #323233;
  font-size: 14px;
  line-height: 1.75;
  white-space: pre-wrap;
}

.safety-content h3 {
  margin: 0 0 8px;
  font-size: 16px;
  text-align: center;
}

.notice-line {
  margin: 0;
  min-height: 1.75em;
}

.safety-footer {
  padding: 8px 16px calc(16px + env(safe-area-inset-bottom));
  border-top: 1px solid #f0f0f0;
  background: #fff;
}

.signature-section {
  padding: 8px 0 14px;
}

.signature-label {
  margin-bottom: 8px;
  color: #323233;
  font-size: 14px;
}
</style>
