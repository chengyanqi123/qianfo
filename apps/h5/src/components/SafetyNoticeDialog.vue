<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { showFailToast } from 'vant'
import { submitSafetyNotice } from '@/api/safetyNotice'
import { SAFETY_NOTICE_CONTENT } from '@/constants/safetyNotice'
import SignaturePad from '@/components/SignaturePad.vue'
import type { SignatureResult } from '@/types/signature'

const visible = defineModel<boolean>('visible', { required: true })
const signatureDialogVisible = shallowRef(false)
const signatureResult = shallowRef<SignatureResult | null>(null)
const submitting = shallowRef(false)
const canSubmit = computed(() => Boolean(signatureResult.value?.svg) && !submitting.value)
const noticeLines = SAFETY_NOTICE_CONTENT.split('\n')
const noticeTitle = noticeLines[0]

function openSignature() {
  signatureDialogVisible.value = true
}

function onSignatureConfirmed(result: SignatureResult) {
  signatureResult.value = result
}

async function onSubmit() {
  if (!signatureResult.value?.svg) {
    showFailToast('请完成手写签字')
    return
  }

  submitting.value = true
  try {
    await submitSafetyNotice({ content: SAFETY_NOTICE_CONTENT, signature: signatureResult.value.svg })
    visible.value = false
    signatureResult.value = null
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
        <p>请认真阅读并完成签字后继续使用预约服务</p>
      </div>
      <div class="safety-content">
        <h3>{{ noticeTitle }}</h3>
        <p v-for="(paragraph, index) in noticeLines.slice(1)" :key="index" class="notice-line">
          {{ paragraph || ' ' }}
        </p>
      </div>
      <div class="safety-footer">
        <div class="signature-section">
          <div class="signature-label-row">
            <div class="signature-label">游客签字</div>
            <button type="button" class="signature-action" @click="openSignature">
              {{ signatureResult ? '点击修改' : '点击签字' }}
            </button>
          </div>
          <button v-if="signatureResult" type="button" class="signature-preview-button" @click="openSignature">
            <img :src="signatureResult.previewUrl" alt="游客手写签字" />
            <span>点击修改签字</span>
          </button>
        </div>
        <van-button block round type="primary" :loading="submitting" :disabled="!canSubmit" @click="onSubmit">
          同意并提交签字
        </van-button>
      </div>
    </div>
  </van-popup>
  <SignaturePad
    v-model:visible="signatureDialogVisible"
    :initial-signature="signatureResult"
    @confirm="onSignatureConfirmed"
  />
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
  color: #323233;
  font-size: 14px;
}

.signature-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.signature-action {
  padding: 0;
  border: 0;
  color: var(--van-primary-color);
  background: transparent;
  font-size: 14px;
  cursor: pointer;
}

.signature-preview-button {
  position: relative;
  display: block;
  width: 100%;
  height: 110px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #dcdee0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.signature-preview-button img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.signature-preview-button span {
  position: absolute;
  right: 8px;
  bottom: 6px;
  padding: 2px 6px;
  border-radius: 3px;
  color: #fff;
  background: rgb(0 0 0 / 55%);
  font-size: 12px;
}
</style>
