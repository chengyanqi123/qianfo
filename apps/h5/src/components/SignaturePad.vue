<script setup lang="ts">
import { getStroke, type StrokeOptions } from 'perfect-freehand'
import { showFailToast } from 'vant'
import { nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import type { SignatureResult } from '@/types/signature'

const props = defineProps<{
  initialDataUrl?: string
}>()

const visible = defineModel<boolean>('visible', { default: false })
const pad = useTemplateRef<HTMLDivElement>('pad')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const hasSignature = shallowRef(false)

type InputPoint = [number, number, number]

const MAX_SIGNATURE_WIDTH = 960

let context: CanvasRenderingContext2D | null = null
let drawing = false
let canvasWidth = 0
let canvasHeight = 0
let activeStroke: InputPoint[] | null = null
let backgroundImage: HTMLImageElement | null = null
const strokes: InputPoint[][] = []

const strokeOptions: StrokeOptions = {
  size: 4,
  smoothing: 0.1,
  thinning: -0.18,
  streamline: 0.18,
  easing: (t) => t,
  start: {
    taper: 0,
    cap: true,
  },
  end: {
    taper: 25,
    cap: true,
  },
}

const emit = defineEmits<{
  confirm: [result: SignatureResult]
}>()

function getCanvasDimensions(element: HTMLCanvasElement) {
  const rect = element.getBoundingClientRect()
  return {
    width: Math.max(1, rect.width),
    height: Math.max(1, rect.height),
  }
}

function setupCanvas() {
  const element = canvas.value
  if (!element) return

  const { width, height } = getCanvasDimensions(element)
  const ratio = window.devicePixelRatio || 1
  element.width = Math.max(1, Math.floor(width * ratio))
  element.height = Math.max(1, Math.floor(height * ratio))
  canvasWidth = width
  canvasHeight = height
  context = element.getContext('2d')
  context?.scale(ratio, ratio)
  if (context) {
    context.fillStyle = '#1f2329'
  }
}

function redraw() {
  if (!context) return
  context.clearRect(0, 0, canvasWidth, canvasHeight)

  if (backgroundImage) {
    context.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight)
  }

  for (const stroke of strokes) {
    const outline = getStroke(stroke, strokeOptions)
    if (outline.length === 0) continue
    context.beginPath()
    context.moveTo(outline[0][0], outline[0][1])
    for (let index = 1; index < outline.length; index += 1) {
      context.lineTo(outline[index][0], outline[index][1])
    }
    context.closePath()
    context.fill()
  }
}

function getPoint(event: PointerEvent) {
  const element = canvas.value
  if (!element) return { x: 0, y: 0 }
  const rect = element.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(canvasWidth, event.clientX - rect.left)),
    y: Math.max(0, Math.min(canvasHeight, event.clientY - rect.top)),
  }
}

function getPressure(event: PointerEvent) {
  return event.pressure || 0.5
}

function startStroke(event: PointerEvent) {
  if (!context || !canvas.value) return
  drawing = true
  hasSignature.value = true
  canvas.value.setPointerCapture(event.pointerId)
  const point = getPoint(event)
  activeStroke = [[point.x, point.y, getPressure(event)]]
  strokes.push(activeStroke)
  redraw()
}

function moveStroke(event: PointerEvent) {
  if (!drawing || !activeStroke) return
  const point = getPoint(event)
  activeStroke.push([point.x, point.y, getPressure(event)])
  redraw()
}

function finishStroke(event?: PointerEvent) {
  if (!drawing) return
  drawing = false
  if (event && canvas.value?.hasPointerCapture(event.pointerId)) {
    canvas.value.releasePointerCapture(event.pointerId)
  }
  activeStroke = null
  redraw()
}

function clearCanvas() {
  strokes.length = 0
  activeStroke = null
  backgroundImage = null
  drawing = false
  hasSignature.value = false
  redraw()
}

function loadInitialSignature() {
  strokes.length = 0
  activeStroke = null
  drawing = false
  backgroundImage = null
  hasSignature.value = Boolean(props.initialDataUrl)
  if (!props.initialDataUrl) {
    redraw()
    return
  }

  const image = new Image()
  image.onload = () => {
    if (!visible.value) return
    backgroundImage = image
    redraw()
  }
  image.src = props.initialDataUrl
}

function handleResize() {
  const element = canvas.value
  if (!element) return
  const { width, height } = getCanvasDimensions(element)
  if (canvasWidth > 0 && canvasHeight > 0 && strokes.length > 0) {
    const scaleX = width / canvasWidth
    const scaleY = height / canvasHeight
    for (const stroke of strokes) {
      for (const point of stroke) {
        point[0] *= scaleX
        point[1] *= scaleY
      }
    }
  }
  setupCanvas()
  redraw()
}

function exportSignatureDataUrl(element: HTMLCanvasElement) {
  if (element.width <= MAX_SIGNATURE_WIDTH) {
    return element.toDataURL('image/png')
  }

  const scale = MAX_SIGNATURE_WIDTH / element.width
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = MAX_SIGNATURE_WIDTH
  outputCanvas.height = Math.max(1, Math.round(element.height * scale))

  const outputContext = outputCanvas.getContext('2d')
  if (!outputContext) return null
  outputContext.imageSmoothingEnabled = true
  outputContext.imageSmoothingQuality = 'high'
  outputContext.drawImage(element, 0, 0, outputCanvas.width, outputCanvas.height)
  return outputCanvas.toDataURL('image/png')
}

function confirmSignature() {
  if (!canvas.value || !hasSignature.value) return
  finishStroke()
  const dataUrl = exportSignatureDataUrl(canvas.value)
  if (!dataUrl) {
    showFailToast('签名图片生成失败，请重试')
    return
  }
  const [, base64 = ''] = dataUrl.split(',', 2)
  const result = { signature: dataUrl, dataUrl, base64 }
  emit('confirm', result)
  visible.value = false
  clearCanvas()
}

function cancelSignature() {
  visible.value = false
  clearCanvas()
}

async function enterFullscreen() {
  const element = pad.value
  if (element?.requestFullscreen && !document.fullscreenElement) {
    try {
      await element.requestFullscreen()
    } catch {
      // 微信内置浏览器可能不支持原生全屏，继续使用当前全屏覆盖层。
    }
  }

  try {
    const orientation = screen.orientation as unknown as {
      lock?: (value: 'landscape') => Promise<void>
    }
    await orientation.lock?.('landscape')
  } catch {
    // 横屏锁定不是所有浏览器都支持，CSS 会提供竖屏降级布局。
  }

  await nextTick()
  handleResize()
}

async function exitFullscreen() {
  if (document.fullscreenElement === pad.value) {
    try {
      await document.exitFullscreen()
    } catch {
      // 原生全屏退出失败时，覆盖层仍会随 visible 关闭。
    }
  }
  const orientation = screen.orientation as unknown as { unlock?: () => void }
  orientation.unlock?.()
}

function onFullscreenChange() {
  if (document.fullscreenElement !== pad.value && visible.value && document.fullscreenEnabled) {
    visible.value = false
  }
}

watch(
  visible,
  async (value) => {
    if (value) {
      setupCanvas()
      loadInitialSignature()
      await enterFullscreen()
    } else {
      await exitFullscreen()
    }
  },
  { flush: 'post' },
)

onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleResize)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="signature-overlay">
      <div ref="pad" class="signature-workspace">
        <header class="signature-topbar">
          <div class="signature-heading">
            <span class="signature-kicker">森林防火安全须知</span>
            <strong>请在空白区域完成手写签名</strong>
          </div>
          <van-button class="cancel-button" size="small" plain type="default" @click="cancelSignature">
            取消
          </van-button>
        </header>

        <main class="signature-stage">
          <div class="signature-canvas-shell">
            <canvas
              ref="canvas"
              class="signature-canvas"
              aria-label="手写签名区域"
              @pointerdown="startStroke"
              @pointermove="moveStroke"
              @pointerup="finishStroke"
              @pointercancel="finishStroke"
              @lostpointercapture="finishStroke"
            />
            <span v-if="!hasSignature" class="signature-placeholder">在此处签名</span>
          </div>

          <aside class="signature-tools">
            <span class="tools-caption">签名操作</span>
            <van-button class="tool-button" size="small" plain type="default" @click="clearCanvas">清除</van-button>
            <van-button
              class="tool-button confirm-button"
              size="small"
              type="primary"
              :disabled="!hasSignature"
              @click="confirmSignature"
            >
              确认签名
            </van-button>
          </aside>
        </main>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.signature-overlay {
  position: fixed;
  z-index: 3000;
  inset: 0;
  width: 100dvw;
  height: 100dvh;
  overflow: hidden;
  background: #f5f7fa;
}

.signature-workspace {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  box-sizing: border-box;
  background: #f5f7fa;
}

.signature-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;
  min-height: 64px;
  padding: 10px 20px;
  box-sizing: border-box;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.signature-heading {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  color: #1f2329;
}

.signature-kicker {
  color: #969799;
  font-size: 12px;
}

.signature-heading strong {
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cancel-button {
  flex: 0 0 auto;
  margin-left: 16px;
}

.signature-stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px;
  gap: 16px;
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px 20px 20px;
  box-sizing: border-box;
}

.signature-canvas-shell {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 10px rgb(31 35 41 / 6%);
}

.signature-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.signature-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  color: #c8c9cc;
  font-size: 18px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  user-select: none;
}

.signature-tools {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 12px;
  min-width: 0;
  padding: 16px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  background: #fff;
}

.tools-caption {
  margin-bottom: 4px;
  color: #646566;
  font-size: 12px;
  text-align: center;
}

.tool-button {
  width: 100%;
  margin: 0;
}

@media (orientation: portrait) {
  .signature-topbar {
    min-height: 58px;
    padding: 8px 14px;
  }

  .signature-heading strong {
    font-size: 15px;
  }

  .signature-stage {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 10px;
    padding: 10px 12px 12px;
  }

  .signature-tools {
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-height: 58px;
    padding: 8px 10px;
  }

  .tools-caption {
    margin: 0 auto 0 0;
    text-align: left;
  }

  .tool-button {
    width: auto;
    min-width: 74px;
  }
}
</style>
