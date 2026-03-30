<template>
  <div class="title-wrap">
    <div class="title-header">
      <div class="title-bar"></div>
      <template v-if="slots.title">
        <slot name="title"></slot>
      </template>
      <div v-else class="title-text">{{ title }}</div>
    </div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { useSlots } from 'vue';

defineProps({
  title: {
    type: String,
    default: '',
  },
});
const slots = useSlots();
</script>

<style scoped>
.title-header {
  display: flex;
  align-items: center;
  padding-bottom: 16px;
}
.title-bar {
  height: 16px;
  width: 4px;
  background-color: var(--el-color-primary);
  margin-right: 8px;
}
.title-text {
  font-size: 16px;
  font-weight: 700;
}
</style>
