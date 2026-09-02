<script setup lang="ts">
import DigitalClock from '@/newtab/components/common/DigitalClock.vue'
import AnalogClock from '@/newtab/components/common/AnalogClock.vue'
import SearchBar from '@/newtab/components/search/SearchBar.vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/newtab/stores/settings'

// 极简模式：根据 clock.style 渲染数字/模拟时钟
const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
</script>

<template>
  <main
    class="flex h-screen min-h-screen flex-col items-center gap-8 overflow-hidden px-4 pt-[18vh]"
  >
    <DigitalClock v-if="settings.clock.style === 'digital'" large />
    <AnalogClock v-if="settings.clock.style === 'analog'" large />
    <SearchBar size="minimal" placeholder="搜索" />
    <p class="text-xs opacity-40">
      按 <kbd class="rounded border px-1">/</kbd> 打开聚焦模式 ·
      <kbd class="rounded border px-1">Ctrl+M</kbd> 切换模式
    </p>
  </main>
</template>
