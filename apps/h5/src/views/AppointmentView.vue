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
            <van-button size="small" type="primary" plain @click="handleSendCode"> 发送验证码 </van-button>
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
    <van-calendar
      v-model:show="showDatePicker"
      @confirm="onCalendarConfirm"
      switch-mode="month"
      :min-date="dateAllowRange[0]"
      :max-date="dateAllowRange[1]"
      :formatter="formatter"
    />

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

    <!-- loading -->
    <van-overlay :show="loading" z-index="9999">
      <div class="loading-wrapper">
        <van-loading />
      </div>
    </van-overlay>
  </div>
</template>

<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { showSuccessToast, showFailToast, showConfirmDialog, type FormInstance, type PickerOption } from 'vant';
import { useWechat } from '@/composables/useWechat';
import { useUserStore } from '@/stores/user';
import { submitAppointment } from '@/api/appointment';
import type { CreateAppointmentDto } from '@qianfo/shared';
import dayjs from 'dayjs';

const userStore = useUserStore();
const { login: wxLogin } = useWechat();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const showDatePicker = ref(false);
const showTimePicker = ref(false);
//
const dateAllowRange = [new Date(), dayjs().add(1, 'month').toDate()]; // 1个月内
const timeAllowRange = ['07:00', '19:00'];
const timePickerValue = ref<string[]>(['09', '00']);
const defaultForm: CreateAppointmentDto = {
  date: '',
  time: '',
  count: 1,
  phone: '',
  remark: '',
};
const form = ref({ ...defaultForm });

// 初始化
const loading = ref(false);
init();
async function init() {
  loading.value = true;
  login()
    .then(() => {
      // 获取预约人数的限制
    })
    .then(() => {
      // 获取营业时间段
    })
    .catch((e) => {
      showFailToast(e?.message || '系统初始化失败，请稍后重试!');
    })
    .finally(() => {
      loading.value = false;
    });
}
function login() {
  if (!userStore.getToken()) {
    return wxLogin().then((data) => {
      data && userStore.setUserInfo(data);
    });
  }
  return Promise.resolve();
}

// 日期选择
function onCalendarConfirm(value: Date) {
  const selectDate = dayjs(value).format('YYYY-MM-DD');
  // 如果选择的时间是一个小时之内的
  if (
    form.value.time &&
    selectDate === dayjs().format('YYYY-MM-DD') &&
    Number(form.value.time.split(':')[0]) <= dayjs().hour()
  ) {
    return showConfirmDialog({
      title: '提示',
      message: '只能预约一小时后的时间，是否继续？继续将重新选择预约时间',
    }).then(() => {
      form.value.date = selectDate;
      form.value.time = '';
      showDatePicker.value = false;
    });
  }
  form.value.date = selectDate;
  showDatePicker.value = false;
}
function formatter(day: any) {
  const timestamp = dayjs(day.date).valueOf(),
    maxTimeStamp = dayjs(dateAllowRange[1]).valueOf(),
    minTimeStamp = dayjs(dateAllowRange[0]).subtract(1, 'day').valueOf();
  if (timestamp >= minTimeStamp && timestamp <= maxTimeStamp) {
    day.bottomInfo = '余268';
  }
  return day;
}

// 时间选择
function onTimeConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.value.time = selectedValues.slice(0, 2).join(':');
  showTimePicker.value = false;
}
function timeFilter(type: string, options: PickerOption[]) {
  if (type === 'hour') {
    const hourAllowRange = timeAllowRange.map((t) => Number(t.split(':')[0]));
    const isToday = form.value.date === dayjs().format('YYYY-MM-DD');
    const minTime = isToday ? Math.max(dayjs().hour() + 1, hourAllowRange[0]) : hourAllowRange[0];
    const maxTime = hourAllowRange[1];
    return options.filter((o) => Number(o.value) >= minTime && Number(o.value) <= maxTime);
  }
  if (type === 'minute') {
    return options.filter((o) => o.value === '00' || o.value === '30');
  }
  return options;
}

// 提交和重置
async function onSubmit() {
  submitting.value = true;
  loading.value = true;
  try {
    await submitAppointment(toRaw(form.value));
    showSuccessToast('预约成功！');
    resetForm();
  } catch (e: any) {
    showFailToast(e.message || '预约失败，请稍后重试!');
  } finally {
    submitting.value = false;
    loading.value = false;
  }
}
function resetForm() {
  formRef.value?.resetValidation();
  form.value = { ...defaultForm };
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

.loading-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
