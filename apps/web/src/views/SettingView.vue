<template>
  <div>
    <!-- <TitleWarp title="工作时间"> </TitleWarp> -->
    <TitleWarp title="预约限流">
      <div class="setting-row">
        <el-space>
          <div class="limit-label">
            <!-- <el-tooltip class="box-item" placement="bottom-end">
              <el-icon style="margin-right: 4px"><InfoFilled /></el-icon>
              <template #content>
                全局限流将作用于每一天（单独设置了限流的日期除外）
                <br />
                -1: 表示不限流
                <br />
                0: 当日不能预约
              </template>
            </el-tooltip> -->
            <el-popover placement="bottom-start">
              <template #reference>
                <el-icon class="info-icon"><InfoFilled /></el-icon>
              </template>
              <div>
                全局限流将作用于每一天（单独设置了限流的日期除外）
                <br />
                -1: 表示不限流
                <br />
                0: 表示当日不能预约
              </div>
            </el-popover>

            <span>全局限流:</span>
          </div>
          <el-input-number
            style="width: 100%"
            v-model="setting.totalLimit"
            @change="limitChange"
            v-bind="limitInputProps"
          />
        </el-space>
      </div>
      <el-calendar class="calendar" ref="calendar" v-model="focusDate">
        <template #header="{ date }">
          <div class="calendar-header">
            <span>{{ date }}</span>
            <el-button-group>
              <el-button size="small" @click="selectDate('prev-year')">
                <el-icon><DArrowLeft /></el-icon>
              </el-button>
              <el-button size="small" @click="selectDate('prev-month')">
                <el-icon><ArrowLeft /></el-icon>
              </el-button>
              <el-button size="small" @click="selectDate('today')">
                <el-icon><Aim /></el-icon>
              </el-button>
              <el-button size="small" @click="selectDate('next-month')">
                <el-icon><ArrowRight /></el-icon>
              </el-button>
              <el-button size="small" @click="selectDate('next-year')">
                <el-icon><DArrowRight /></el-icon>
              </el-button>
            </el-button-group>
          </div>
        </template>
        <template #date-cell="{ data }">
          <div
            class="calendar-cell"
            @click="
              calendarCellClickHandler({
                day: data?.day,
                limit: daliys[data?.day]?.limit ?? setting.totalLimit,
                type: data.type,
              })
            "
          >
            <template v-if="data.type === 'current-month'">
              <!-- 日期 -->
              <div class="day-number" :class="data.isSelected ? 'is-selected' : ''">
                {{ data.day.split('-').pop() }}
              </div>
              <!-- 限流数量 -->
              <div class="cell-item error" v-if="(daliys[data?.day]?.limit ?? setting.totalLimit) !== -1">
                {{ daliys[data?.day]?.limit ?? setting.totalLimit }}
              </div>
              <!-- 已预约数量 -->
              <div class="cell-item success" v-if="daliys[data?.day]?.confirmed">
                {{ daliys[data?.day]?.confirmed ?? 0 }}
              </div>
              <!-- 剩余数量 -->
              <div class="cell-item warning" v-if="(daliys[data?.day]?.limit ?? setting.totalLimit) !== -1">
                {{ (daliys[data?.day]?.limit ?? setting.totalLimit) - (daliys[data?.day]?.confirmed ?? 0) }}
              </div>
            </template>
          </div>
        </template>
      </el-calendar>
      <el-space class="tip-dots" size="large">
        <div class="dot text-color">日期</div>
        <div class="dot error">限流数量</div>
        <div class="dot success">已预约数量</div>
        <div class="dot warning">剩余数量</div>
      </el-space>
    </TitleWarp>

    <el-dialog destroy-on-close align-center v-model="dialogFormVisible" title="设置日期限流" width="80%">
      <el-form ref="daliyLimitForm" :model="form">
        <el-form-item label="日期" label-width="80px">
          <el-input v-model="form.date" disabled />
        </el-form-item>
        <el-form-item label="限流数量" label-width="80px">
          <el-input-number style="width: 100%" v-model="form.limit" v-bind="limitInputProps" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDaliyLimit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TitleWarp from '@/components/TitleWarp.vue';
import * as Apis from '@/api/setting';
import { dayjs, type CalendarDateType, type CalendarInstance } from 'element-plus';
import { debounce } from 'lodash-es';

const calendar = ref<CalendarInstance>();
const selectDate = (val: CalendarDateType) => {
  if (!calendar.value) return;
  calendar.value.selectDate(val);
};

const limitInputProps = {
  step: 1,
  stepStrictly: true,
  min: -1,
  valueOnClear: -1,
  placeholder: '请输入限流数量',
};
const setting = ref({
  totalLimit: -1,
});
const daliys = ref<Record<string, { limit: number; confirmed: number }>>({});

const focusDate = ref(new Date());
const daliyLimitForm = ref<any>();
const dialogFormVisible = ref(false);
const form = ref({
  date: '',
  limit: -1,
});

const limitChange: any = debounce(function (value: number) {
  Apis.setDefaultLimit({ capacity: value });
});

const getSettings = debounce(function (options?: Parameters<typeof Apis.getLimitByDate>[1]) {
  // 当前页面月份的第一天和最后一天
  const startDate = dayjs(focusDate.value).startOf('month').format('YYYY-MM-DD');
  const endDate = dayjs(focusDate.value).endOf('month').format('YYYY-MM-DD');
  Apis.getLimitByDate(
    {
      startDate,
      endDate,
    },
    options,
  ).then((data) => {
    const { default: defaultLimit, dailys } = data;
    setting.value.totalLimit = defaultLimit;
    daliys.value = dailys.reduce((acc: any, item: any) => {
      acc[item.date] = {
        limit: item.count,
        confirmed: item.confirmedCount,
      };
      return acc;
    }, {});
  });
});

watch(
  () => focusDate.value,
  () => {
    if (dayjs(focusDate.value).format('YYYY-MM-DD') === form.value.date) {
      return;
    }
    const controller = new AbortController();
    getSettings({ signal: controller.signal });
    onWatcherCleanup(() => {
      controller.abort();
    });
  },
  {
    immediate: true,
  },
);

function calendarCellClickHandler(data: any) {
  // 点击的不是当前页月份的日期不弹窗
  if (data.type !== 'current-month') {
    return;
  }
  // 今天之前的日期也不弹窗
  if (dayjs(data.day).isBefore(dayjs().startOf('day'))) {
    return;
  }
  const { day, limit } = data;
  if (!day) return;
  form.value = {
    date: day,
    limit: isNaN(Number(limit)) ? setting.value.totalLimit : Number(limit),
  };
  dialogFormVisible.value = true;
}

function submitDaliyLimit() {
  daliyLimitForm.value?.validate().then(() => {
    Apis.setLimitByDate({
      date: form.value.date,
      capacity: form.value.limit,
    }).then(() => {
      daliys.value[form.value.date] = {
        limit: form.value.limit,
      };
      dialogFormVisible.value = false;
    });
  });
}
</script>

<style scoped>
:deep(.el-calendar__header) {
  display: block;
}
:deep(.el-popover.el-popper) {
  min-width: auto;
}
:deep(.el-calendar) {
  border-radius: 12px;
  border: var(--el-calendar-border);
}
:deep(.main-content) {
  background-color: var(--el-color-white) !important;
}

.setting-row {
  display: flex;
}
.limit-label {
  display: flex;
  align-items: center;
}
.info-icon {
  margin-right: 4px;
}
.calendar {
  margin-top: 12px;
}
.calendar-header {
  display: flex;
  justify-content: space-between;
}
.calendar-cell {
  width: 100%;
  height: 100%;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.day-number {
  text-align: center;
  font-size: 18px;
}
.cell-item.warning {
  color: var(--el-color-warning);
}
.cell-item.success {
  color: var(--el-color-success);
}
.cell-item.error {
  color: var(--el-color-error);
}

.tip-dots {
  margin-top: 12px;
}
.dot {
  display: flex;
  align-items: center;
  font-size: 14px;
}
.dot::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}
.dot.warning::before {
  background-color: var(--el-color-warning);
}
.dot.success::before {
  background-color: var(--el-color-success);
}
.dot.error::before {
  background-color: var(--el-color-error);
}

html .text-color::before {
  background-color: var(--el-color-black);
}
html.dark .text-color::before {
  background-color: var(--el-color-white);
}

/* 手机端 */
@media screen and (max-width: 768px) {
  .calendar-cell {
    font-size: 10px;
  }
  :deep(.el-calendar__header) {
    padding: 12px;
  }
  :deep(.el-calendar__body) {
    padding: 12px;
  }
  :deep(.el-calendar-day) {
    padding: 4px;
  }
}
</style>
