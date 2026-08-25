<script setup lang="ts">
import { useSettingsStore } from '@/newtab/stores/settings'
import { SEARCH_ENGINE_LABELS } from '@/newtab/types/settings'
import type { SearchHistoryItem } from '@/newtab/stores/search'

defineProps<{
  query: string
  suggestions: SearchHistoryItem[]
}>()

const emit = defineEmits<{
  select: [item: { query: string; engine?: string }]
}>()

const settingsStore = useSettingsStore()
const engineLabel = SEARCH_ENGINE_LABELS[settingsStore.settings.search.engine]
</script>

<template>
  <div
    class="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl py-2"
    :style="{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-card)'
    }"
  >
    <div class="px-4 py-1 text-xs uppercase tracking-wider opacity-50">
      {{ query ? '建议' : '历史' }}
    </div>

    <button
      v-for="(item, idx) in suggestions"
      :key="idx"
      type="button"
      class="flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      @mousedown.prevent="emit('select', item)"
    >
      <span class="flex items-center gap-2">
        <span class="opacity-40">⏱</span>
        <span>{{ item.query }}</span>
      </span>
      <span class="text-xs opacity-50">{{ SEARCH_ENGINE_LABELS[item.engine] }}</span>
    </button>

    <div v-if="suggestions.length === 0" class="px-4 py-3 text-sm opacity-50">
      暂无{{ query ? '建议' : '历史' }}，按回车前往 {{ engineLabel }} 搜索
    </div>
  </div>
</template>
