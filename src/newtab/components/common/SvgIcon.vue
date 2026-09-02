<!-- eslint-disable vue/no-v-html -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** SVG 文件名，不带 .svg 后缀 */
  name: string
  size?: string | number
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 20,
  label: ''
})

// 直接 import 所有 SVG 文件（使用 Vite 的 ?raw 导入为字符串），比 glob 更可靠。
// 各 SVG 内部已统一使用 fill="currentColor"，可跟随父级文字色自适应日/夜主题。
import calendarSvg from '@/newtab/assets/imgs/calendar.svg?raw'
import closeSvg from '@/newtab/assets/imgs/close.svg?raw'
import deleteSvg from '@/newtab/assets/imgs/delete.svg?raw'
import moreSvg from '@/newtab/assets/imgs/more.svg?raw'

const iconMap: Record<string, string> = {
  calendar: calendarSvg,
  close: closeSvg,
  delete: deleteSvg,
  more: moreSvg
}

const content = computed(() => iconMap[props.name] ?? '')

const style = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  return { width: size, height: size }
})
</script>

<template>
  <span
    v-if="content"
    role="img"
    :aria-label="label || name"
    class="svg-icon inline-flex shrink-0 items-center justify-center"
    :style="style"
    v-html="content"
  />
  <span
    v-else
    role="img"
    :aria-label="label || name"
    class="grid h-full w-full place-items-center rounded bg-[var(--color-accent-soft)] text-xs font-semibold text-[var(--color-accent)]"
    :style="style"
  >
    ?
  </span>
</template>

<style>
.svg-icon > svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
<!-- eslint-enable vue/no-v-html -->
