<template>
  <div>
    <!-- <van-nav-bar title="在线预约" /> -->

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
            { pattern: /^1[3-9]\d{9}$/, message: '请填写正确的联系电话' },
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
      v-if="inited"
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
import { showSuccessToast, showFailToast, type FormInstance, type PickerOption } from 'vant';
import { submitAppointment } from '@/api/appointment';
import type { CreateAppointmentDto } from '@qianfo/shared';
import dayjs from 'dayjs';
import { getDefaultLimit, getReserveByDate } from '@/api/setting';

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
const setting = ref({
  totalLimit: -1,
});
const daliys = ref<Awaited<ReturnType<typeof getReserveByDate>>>({});

// 初始化
const loading = ref(false);
const inited = ref(false);
init();
async function init() {
  inited.value = false;
  loading.value = true;
  getDefaultLimit()
    .then((data) => {
      setting.value.totalLimit = data;
      // 获取预约人数的限制
      return getReserveByDate({
        startDate: dayjs(dateAllowRange[0]).format('YYYY-MM-DD'),
        endDate: dayjs(dateAllowRange[1]).format('YYYY-MM-DD'),
      });
    })
    .then((data) => {
      daliys.value = data || {};
      // 获取营业时间段
    })
    .catch((e) => {
      // showFailToast(e?.message || '系统初始化失败，请稍后重试!');
    })
    .finally(() => {
      inited.value = true;
      loading.value = false;
    });
}

// 日期选择
function onCalendarConfirm(value: Date) {
  const selectDate = dayjs(value).format('YYYY-MM-DD');
  const today = dayjs().format('YYYY-MM-DD');
  const isToday = selectDate === today;
  // 如果选择日期在今天之前
  if (dayjs(selectDate).isBefore(today)) {
    showFailToast({
      type: 'fail',
      mask: true,
      message: '请选择有效日期',
      duration: 1800,
    });
    return;
  }
  // 如果选择的日期是今日
  if (isToday) {
    const timestamp = dayjs().valueOf(),
      maxTimeStamp = dayjs(dateAllowRange[1]).valueOf(),
      minTimeStamp = dayjs(dateAllowRange[0]).subtract(1, 'day').valueOf();
    const isNotRange = timestamp < minTimeStamp || timestamp > maxTimeStamp;
    // 当前不在营业时间段内
    if (isNotRange) {
      showFailToast({
        type: 'fail',
        mask: true,
        message: `抱歉，今日已过营业时间！`,
        duration: 2400,
      });
      return;
    }
    // 如果先选择了时间，且选择的时间是半小时之内的
    // 只能预约半小时后的时间
    if (form.value.time) {
      const [h, m] = form.value.time.split(':').map(Number);
      const selectedMinutes = h * 60 + m;
      const nowMinutes = dayjs().hour() * 60 + dayjs().minute();
      if (selectedMinutes <= nowMinutes + 15) {
        showFailToast({
          type: 'fail',
          mask: true,
          message: '抱歉，请提前15分钟预约！',
          duration: 2400,
        });
        return;
      }
    }
  }
  form.value.date = selectDate;
  showDatePicker.value = false;
}
function formatter(day: any) {
  const date = dayjs(day.date);
  const dateString = date.format('YYYY-MM-DD');
  // 没有预约信息
  const daily = daliys.value[dateString];
  if (!daily) {
    return day;
  }

  // 转换各种时间
  const nowString = dayjs().format('YYYY-MM-DD');
  const timestamp = date.valueOf(),
    maxTimeStamp = dayjs(dateAllowRange[1]).valueOf(),
    minTimeStamp = dayjs(dateAllowRange[0]).subtract(1, 'day').valueOf();
  const isNotRange = timestamp < minTimeStamp || timestamp > maxTimeStamp;

  if (dateString === nowString) {
    day.text = '今天';
    const [sh, sm] = timeAllowRange[0].split(':').map(Number);
    const [eh, em] = timeAllowRange[1].split(':').map(Number);
    // 如果当前时间已经超过营业结束时间，则今天不可预约
    const [h, m] = [dayjs().hour(), dayjs().minute()];
    if (h > eh || h < sh || (h === eh && m > em) || (h === sh && m < sm)) {
      day.type = 'disabled';
      day.bottomInfo = '已歇业';
      return day;
    }
  }

  // 禁用不在范围内的日期
  if (isNotRange) {
    day.type = 'disabled';
    return day;
  }

  // 不限额
  const { limit, confirmed, remaining } = daily;
  const isSetLimit = (setting.value.totalLimit ?? limit) !== -1;
  if (!isSetLimit) {
    day.bottomInfo = '不限';
    return day;
  }

  // 有限额
  if (remaining <= 0) {
    day.type = 'disabled';
    day.bottomInfo = '已约满';
  } else {
    day.bottomInfo = `余${remaining}`;
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
// init
async function onSubmit() {
  submitting.value = true;
  loading.value = true;
  submitAppointment(toRaw(form.value))
    .then(() => {
      showSuccessToast('预约成功！');
      resetForm();
      return init();
    })
    .then(() => {})
    .finally(() => {
      submitting.value = false;
      loading.value = false;
    });
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
