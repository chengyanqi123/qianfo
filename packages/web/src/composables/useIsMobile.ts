import { computed } from 'vue';
import { useWindowSize } from '@vueuse/core';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const { width } = useWindowSize();
  const isMobile = computed(() => width.value < MOBILE_BREAKPOINT);
  return { isMobile };
}
