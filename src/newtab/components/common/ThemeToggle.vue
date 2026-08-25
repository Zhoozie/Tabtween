<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/newtab/stores/settings'
import type { ThemeMode } from '@/newtab/types/settings'

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const ICONS: Record<ThemeMode, string> = {
  light: '☀',
  dark: '☾',
  auto: '◐'
}

const LABELS: Record<ThemeMode, string> = {
  light: '亮色',
  dark: '暗色',
  auto: '跟随系统'
}

const icon = computed(() => ICONS[settings.value.theme])
const label = computed(() => LABELS[settings.value.theme])

function toggle() {
  settingsStore.cycleTheme()
}
</script>

<template>
  <button
    class="flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
    :title="`主题：${label}（点击切换）`"
    @click="toggle"
  >
    <span class="text-base leading-none">{{ icon }}</span>
    <span class="hidden md:inline">{{ label }}</span>
  </button>
</template>
