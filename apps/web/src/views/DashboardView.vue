<template>
  <div class="dashboard">
    <h2 class="page-title">控制台</h2>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6" v-for="card in statCards" :key="card.label">
        <div class="stat-card" :style="{ '--card-color': card.color }">
          <div class="stat-icon">
            <el-icon :size="28"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats ? stats[card.key] : '-' }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :md="16">
        <el-card shadow="never">
          <template #header>近 7 天预约数量</template>
          <v-chart :option="barOption" :loading="chartLoading" style="height: 280px" autoresize />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-card shadow="never">
          <template #header>预约状态分布</template>
          <v-chart :option="pieOption" :loading="chartLoading" style="height: 280px" autoresize />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { getDashboardStats, getDailyAppointments, getStatusDistribution } from '@/api/dashboard';
import { useTheme } from '@/composables/useTheme';
import type { DashboardStats } from '@qianfo/shared';

use([CanvasRenderer, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent]);

const { isDark } = useTheme();
const textColor = computed(() => (isDark.value ? '#fff' : '#333'));

const stats = ref<DashboardStats | null>(null);
const chartLoading = ref(true);
const barData = ref<{ date: string; count: number }[]>([]);
const pieData = ref<{ status: string; label: string; count: number }[]>([]);

const statCards = [
  { key: 'totalAppointments' as const, label: '总预约数', icon: 'Calendar', color: '#409eff' },
  { key: 'todayAppointments' as const, label: '今日预约', icon: 'Clock', color: '#67c23a' },
  { key: 'pendingAppointments' as const, label: '待确认', icon: 'Checked', color: '#e6a23c' },
  { key: 'totalUsers' as const, label: '注册用户', icon: 'User', color: '#f56c6c' },
];

const barOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: isDark.value ? '#333' : '#fff',
    borderColor: isDark.value ? '#555' : '#ddd',
    textStyle: { color: textColor.value },
  },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: barData.value.map((d) => d.date.slice(5)),
    axisLine: { lineStyle: { color: isDark.value ? '#555' : '#ddd' } },
    axisLabel: { color: textColor.value },
  },
  yAxis: { type: 'value', minInterval: 1, axisLabel: { color: textColor.value } },
  series: [
    {
      name: '预约数',
      type: 'bar',
      data: barData.value.map((d) => d.count),
      itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] },
    },
  ],
}));

const pieOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)',
    backgroundColor: isDark.value ? '#333' : '#fff',
    borderColor: isDark.value ? '#555' : '#ddd',
    textStyle: { color: textColor.value },
  },
  legend: { bottom: '5%', left: 'center', textStyle: { color: textColor.value } },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      data: pieData.value.map((d) => ({
        name: d.label,
        value: d.count,
      })),
      itemStyle: { borderRadius: 6 },
      label: { show: false },
    },
  ],
  color: ['#e6a23c', '#67c23a', '#f56c6c'],
}));

onMounted(async () => {
  const [s, daily, dist] = await Promise.all([getDashboardStats(), getDailyAppointments(7), getStatusDistribution()]);
  stats.value = s;
  barData.value = daily;
  pieData.value = dist;
  chartLoading.value = false;
});
</script>

<style scoped>
.dashboard {
  padding: 0 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.stat-row {
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-left: 4px solid var(--card-color);
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--card-color) 15%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--card-color);
  flex-shrink: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.chart-row {
  row-gap: 16px;
}

.chart-row :deep(.el-card__body) {
  padding: 12px;
}
</style>
