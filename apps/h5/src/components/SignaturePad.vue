<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'

const model = defineModel<string>({ default: '' })
const fullscreen = defineModel<boolean>('fullscreen', { default: false })
const pad = useTemplateRef<HTMLDivElement>('pad')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
let context: CanvasRenderingContext2D | null = null
let drawing = false

function setupCanvas() {
  const element = canvas.value
  if (!element) return

  const rect = element.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  element.width = Math.max(1, Math.floor(rect.width * ratio))
  element.height = Math.max(1, Math.floor(rect.height * ratio))
  context = element.getContext('2d')
  context?.scale(ratio, ratio)
  if (context) {
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 2.2
    context.strokeStyle = '#1f2329'
  }
}

function getPoint(event: PointerEvent) {
  const element = canvas.value
  if (!element) return { x: 0, y: 0 }
  const rect = element.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function startStroke(event: PointerEvent) {
  if (!context || !canvas.value) return
  drawing = true
  canvas.value.setPointerCapture(event.pointerId)
  const point = getPoint(event)
  context.beginPath()
  context.moveTo(point.x, point.y)
  context.lineTo(point.x + 0.01, point.y + 0.01)
  context.stroke()
}

function moveStroke(event: PointerEvent) {
  if (!drawing || !context) return
  const point = getPoint(event)
  context.lineTo(point.x, point.y)
  context.stroke()
}

function finishStroke(event?: PointerEvent) {
  if (!drawing) return
  drawing = false
  if (event && canvas.value?.hasPointerCapture(event.pointerId)) {
    canvas.value.releasePointerCapture(event.pointerId)
  }
  model.value = canvas.value?.toDataURL('image/png') || ''
}

function clearCanvas() {
  const element = canvas.value
  if (element && context) {
    const ratio = window.devicePixelRatio || 1
    context.clearRect(0, 0, element.width / ratio, element.height / ratio)
  }
  drawing = false
  model.value = ''
}

function handleResize() {
  if (!canvas.value) return
  const previousValue = model.value
  setupCanvas()
  // Canvas 尺寸变化会清空位图，移动端旋转屏幕后保留已有签名。
  if (previousValue && context) {
    const image = new Image()
    image.onload = () => {
      const element = canvas.value
      if (!element || !context) return
      const rect = element.getBoundingClientRect()
      context.drawImage(image, 0, 0, rect.width, rect.height)
    }
    image.src = previousValue
  }
}

async function enterFullscreen() {
  const element = pad.value
  if (element?.requestFullscreen && !document.fullscreenElement) {
    try {
      await element.requestFullscreen()
    } catch {
      // 微信内置浏览器可能不支持原生全屏，使用 CSS 全屏布局兜底。
    }
  }

  try {
    const orientation = screen.orientation as unknown as {
      lock?: (value: 'landscape') => Promise<void>
    }
    await orientation.lock?.('landscape')
  } catch {
    // 横屏锁定不是所有浏览器都支持。
  }

  await nextTick()
  handleResize()
}

async function exitFullscreen() {
  if (document.fullscreenElement === pad.value) {
    try {
      await document.exitFullscreen()
    } catch {
      // 原生全屏退出失败时，CSS 状态仍可恢复页面布局。
    }
  }
  const orientation = screen.orientation as unknown as { unlock?: () => void }
  orientation.unlock?.()
  await nextTick()
  handleResize()
}

function onFullscreenChange() {
  if (fullscreen.value && document.fullscreenElement !== pad.value) {
    fullscreen.value = false
  }
}

watch(model, (value) => {
  if (!value && canvas.value && context) {
    const ratio = window.devicePixelRatio || 1
    context.clearRect(0, 0, canvas.value.width / ratio, canvas.value.height / ratio)
  }
})

watch(fullscreen, (value) => {
  if (value) {
    void enterFullscreen()
  } else {
    void exitFullscreen()
  }
})

onMounted(async () => {
  await nextTick()
  setupCanvas()
  window.addEventListener('resize', handleResize)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <div ref="pad" class="signature-pad" :class="{ 'is-fullscreen': fullscreen }">
    <div v-if="fullscreen" class="fullscreen-header">
      <span>横屏手写签名</span>
      <van-button size="small" plain type="default" @click="fullscreen = false">退出全屏</van-button>
    </div>
    <canvas
      ref="canvas"
      class="signature-canvas"
      aria-label="手写签名区域"
      @pointerdown="startStroke"
      @pointermove="moveStroke"
      @pointerup="finishStroke"
      @pointercancel="finishStroke"
    />
    <div class="signature-toolbar">
      <span>请在上方空白区域手写签名</span>
      <van-button size="small" plain type="default" @click="clearCanvas">清除</van-button>
    </div>
  </div>
</template>

<style scoped>
.signature-pad {
  overflow: hidden;
  border: 1px solid #dcdee0;
  border-radius: 6px;
  background: #fff;
}

.signature-pad.is-fullscreen {
  position: fixed;
  z-index: 3000;
  inset: 0;
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  border: 0;
  border-radius: 0;
}

.fullscreen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 0 16px;
  color: #323233;
  font-size: 14px;
  background: #fff;
}

.signature-canvas {
  display: block;
  width: 100%;
  height: 170px;
  background: #fff;
  touch-action: none;
}

.signature-pad.is-fullscreen .signature-canvas {
  flex: 1;
  height: auto;
}

.signature-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  padding: 0 10px 0 12px;
  border-top: 1px dashed #ebedf0;
  color: #969799;
  font-size: 12px;
}
</style>
