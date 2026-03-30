import { useDark } from '@vueuse/core';

/**
 * 自动跟随系统的亮/暗模式。
 * Element Plus 通过 html[class="dark"] 启用暗色主题。
 * useDark() 会自动在 html 上添加/移除 dark class。
 */
export function useTheme() {
  const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: '',
  });

  function toggleTheme() {
    isDark.value = !isDark.value;
  }

  return { isDark, toggleTheme };
}
