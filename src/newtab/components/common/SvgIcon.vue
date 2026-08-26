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

const iconModules = import.meta.glob('../../../assets/imgs/*.svg', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

const iconSrc = computed(() => {
  const target = props.name.replace(/\.svg$/i, '')
  const key = Object.keys(iconModules).find((path) => {
    return (
      path
        .split('/')
        .pop()
        ?.replace(/\.svg$/i, '') === target
    )
  })
  return key ? iconModules[key] : ''
})

const style = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  return { width: size, height: size }
})
</script>

<template>
  <span
    role="img"
    :aria-label="label || name"
    class="inline-flex shrink-0 items-center justify-center"
    :style="style"
  >
    <img v-if="iconSrc" :src="iconSrc" alt="" class="h-full w-full object-contain" />
    <span
      v-else
      class="grid h-full w-full place-items-center rounded bg-[var(--color-accent-soft)] text-xs font-semibold text-[var(--color-accent)]"
    >
      ?
    </span>
  </span>
</template>
