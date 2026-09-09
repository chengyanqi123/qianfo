<script setup lang="ts">
import { getStroke, type StrokeOptions } from 'perfect-freehand'
import { showFailToast } from 'vant'
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import type { SignatureResult } from '@/types/signature'

const props = defineProps<{
  initialDataUrl?: string
}>()

const visible = defineModel<boolean>('visible', { default: false })
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const hasSignature = shallowRef(false)

type InputPoint = [number, number, number]

const MAX_SIGNATURE_WIDTH = 960

let context: CanvasRenderingContext2D | null = null
let drawing = false
let canvasWidth = 0
let canvasHeight = 0
let activeStroke: InputPoint[] | null = null
let backgroundImage: CanvasImageSource | null = null
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

function undoCanvas() {
  finishStroke()
  if (strokes.length > 0) {
    strokes.pop()
  } else if (backgroundImage) {
    backgroundImage = null
  }
  hasSignature.value = strokes.length > 0 || Boolean(backgroundImage)
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
    const rotatedCanvas = document.createElement('canvas')
    rotatedCanvas.width = Math.max(1, image.height)
    rotatedCanvas.height = Math.max(1, image.width)
    const rotatedContext = rotatedCanvas.getContext('2d')
    if (!rotatedContext) return
    rotatedContext.translate(rotatedCanvas.width, 0)
    rotatedContext.rotate(Math.PI / 2)
    rotatedContext.drawImage(image, 0, 0)
    backgroundImage = rotatedCanvas
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
  const rotatedCanvas = document.createElement('canvas')
  rotatedCanvas.width = Math.max(1, element.height)
  rotatedCanvas.height = Math.max(1, element.width)

  const rotatedContext = rotatedCanvas.getContext('2d')
  if (!rotatedContext) return null
  rotatedContext.translate(0, rotatedCanvas.height)
  rotatedContext.rotate(-Math.PI / 2)
  rotatedContext.drawImage(element, 0, 0)

  if (rotatedCanvas.width <= MAX_SIGNATURE_WIDTH) {
    return rotatedCanvas.toDataURL('image/png')
  }

  const scale = MAX_SIGNATURE_WIDTH / rotatedCanvas.width
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = MAX_SIGNATURE_WIDTH
  outputCanvas.height = Math.max(1, Math.round(rotatedCanvas.height * scale))

  const outputContext = outputCanvas.getContext('2d')
  if (!outputContext) return null
  outputContext.imageSmoothingEnabled = true
  outputContext.imageSmoothingQuality = 'high'
  outputContext.drawImage(rotatedCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
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

watch(
  visible,
  (value) => {
    if (value) {
      setupCanvas()
      loadInitialSignature()
    }
  },
  { flush: 'post' },
)

onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleResize)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="signature-overlay">
      <div class="signature-workspace">
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
            <div v-if="!hasSignature" class="signature-placeholder">在此处签名</div>
          </div>

          <aside class="back">
            <van-button
              class="tool-button"
              icon="arrow-left"
              type="default"
              aria-label="返回"
              title="返回"
              @click="cancelSignature"
            />
          </aside>

          <aside class="signature-tools">
            <van-button
              class="tool-button confirm-button"
              icon="success"
              type="primary"
              :disabled="!hasSignature"
              aria-label="确认签名"
              title="确认签名"
              @click="confirmSignature"
            />
            <van-button
              class="tool-button"
              icon="cross"
              plain
              type="default"
              aria-label="清除签名"
              title="清除签名"
              @click="clearCanvas"
            />
            <van-button
              class="tool-button"
              icon="revoke"
              plain
              type="default"
              :disabled="!hasSignature"
              aria-label="回退"
              title="回退"
              @click="undoCanvas"
            />
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
  position: relative;
  width: 100%;
  height: 100%;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  box-sizing: border-box;
  background: #f5f7fa;
}

.signature-stage {
  position: absolute;
  inset: 0;
  display: block;
  box-sizing: border-box;
}

.signature-canvas-shell {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 0;
  background: #fff;
}

.signature-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.signature-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  inset: 0;
  color: #c8c9cc;
  font-size: 18px;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
  writing-mode: horizontal-tb;
  transform: rotate(90deg);
  transform-origin: 50% 50%;
}

.back {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}

.signature-tools {
  display: flex;
  position: absolute;
  bottom: max(24px, env(safe-area-inset-bottom));
  left: 50%;
  z-index: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transform: translateX(-50%);
}

.tool-button {
  transform: rotate(90deg);
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  padding: 0;
  border-radius: 50%;
  opacity: 0.9;
  /* background: rgba(255, 255, 255, .7);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px); */
}

.tool-button :deep(.van-icon) {
  font-size: 20px;
}
</style>
