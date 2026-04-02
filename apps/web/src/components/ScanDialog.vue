<template>
  <el-dialog v-model="visible" title="扫码" destroy-on-close align-center v-bind="$attrs" @opened="startScan" @close="stopScanner">
    <div id="qr-reader" style="width: 100%" />
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { Html5Qrcode } from 'html5-qrcode';
import { updateAppointmentStatus } from '@/api/appointment';

const visible = defineModel<boolean>({ required: true });
let scanner: Html5Qrcode | null = null;

async function startScan() {
  scanner = new Html5Qrcode('qr-reader');
  await scanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    async (decodedText) => {
      scanner?.stop();
      try {
        const data = JSON.parse(decodedText);
        if (!data.id || !data.date || !data.time) {
          throw new Error('');
        }
        await updateAppointmentStatus(data.id, 'confirmed');
        ElMessage.success('确认成功!');
      } catch {
        ElMessage.error('无法识别的二维码!');
      } finally {
        visible.value = false;
      }
    },
    () => {},
  );
}

async function stopScanner() {
  scanner?.stop();
}
</script>
