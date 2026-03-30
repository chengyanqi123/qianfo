<template>
  <div>
    <van-nav-bar title="在线预约" />

    <div class="page-container">
      <van-form ref="formRef" @submit="onSubmit" class="form-card">
        <!-- 预约日期 -->
        <van-field
          v-model="form.date"
          name="date"
          label="预约日期"
          placeholder="请选择日期"
          readonly
          is-link
          :rules="[{ required: true, message: '请选择预约日期' }]"
          @click="showDatePicker = true"
        />

        <!-- 预约时间 -->
        <van-field
          v-model="form.time"
          name="time"
          label="预约时间"
          placeholder="请选择时间"
          readonly
          is-link
          :rules="[{ required: true, message: '请选择预约时间' }]"
          @click="showTimePicker = true"
        />

        <!-- 人数 -->
        <van-field name="count" label="预约人数" :rules="[{ required: true }]">
          <template #input>
            <van-stepper v-model="form.count" min="1" max="20" />
          </template>
        </van-field>

        <!-- 联系电话 -->
        <van-field
          v-model="form.phone"
          name="phone"
          label="联系电话"
          placeholder="请输入联系电话"
          type="tel"
          :rules="[
            { required: true, message: '请填写联系电话' },
            { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
          ]"
        >
          <!-- <template #button>
            <van-button size="small" type="primary" plain @click="handleGetPhone" :loading="wxLoading"> 微信获取 </van-button>
          </template> -->
        </van-field>

        <!-- 备注 -->
        <van-field
          v-model="form.remark"
          name="remark"
          label="备注"
          type="textarea"
          rows="2"
          autosize
          placeholder="选填，如特殊需求"
          maxlength="100"
          show-word-limit
        />

        <div class="submit-btn">
          <van-button round block type="primary" native-type="submit" :loading="submitting"> 提交预约 </van-button>
        </div>
      </van-form>
    </div>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="datePickerValue"
        title="选择日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>

    <!-- 时间选择器 -->
    <van-popup v-model:show="showTimePicker" position="bottom" round>
      <van-time-picker
        v-model="timePickerValue"
        title="选择时间"
        :filter="timeFilter"
        @confirm="onTimeConfirm"
        @cancel="showTimePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { showSuccessToast, showFailToast, Overlay, type FormInstance, type PickerOption } from 'vant';
import { useWechat } from '@/composables/useWechat';
import { useUserStore } from '@/stores/user';
import { submitAppointment } from '@/api/appointment';
import type { CreateAppointmentDto } from '@qianfo/shared';

const userStore = useUserStore();
const { login: wxLogin } = useWechat();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const showDatePicker = ref(false);
const showTimePicker = ref(false);

const minDate = new Date();
const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天内

const datePickerValue = ref<string[]>([]);
const timePickerValue = ref<string[]>(['09', '00']);

const form = reactive<CreateAppointmentDto & { remark?: string }>({
  date: '',
  time: '',
  count: 1,
  phone: '',
  remark: '',
});

if (userStore.getToken()) {
  // 已登录，直接验证使用token
} else {
  // 未登录，获取用户ID换取token
  wxLogin().then((data) => {
    // showSuccessToast('登录成功')
    data && userStore.setUserInfo(data);
  });
}

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.date = selectedValues.join('-');
  showDatePicker.value = false;
}

function onTimeConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.time = selectedValues.slice(0, 2).join(':');
  showTimePicker.value = false;
}

// 只允许整点和半点
function timeFilter(type: string, options: PickerOption[]) {
  if (type === 'minute') {
    return options.filter((o) => o.value === '00' || o.value === '30');
  }
  return options;
}

async function onSubmit() {
  submitting.value = true;
  try {
    await submitAppointment({
      date: form.date,
      time: form.time,
      count: form.count,
      phone: form.phone,
      remark: form.remark,
    });
    showSuccessToast('预约成功！');
    resetForm();
  } catch (e: any) {
    showFailToast(e.message || '提交失败，请稍后重试');
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  formRef.value?.resetValidation();
  form.date = '';
  form.time = '';
  form.count = 2;
  form.remark = '';
}
</script>

<style scoped>
.form-card {
  margin: 16px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.submit-btn {
  padding: 16px;
}
</style>
