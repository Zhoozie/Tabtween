<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSearchStore, type LocalResult } from '@/newtab/stores/search'
import { useSettingsStore } from '@/newtab/stores/settings'
import { SEARCH_ENGINE_CHIPS, SEARCH_ENGINE_LABELS } from '@/newtab/constant'
import type { SearchEngine } from '@/newtab/types/settings'
import type { BuiltinCommand } from '@/newtab/constant/commands'

const props = defineProps<{
  /** 模式：minimal 仅历史+网络入口；standard 渲染全部 */
  mode: 'minimal' | 'standard'
}>()

const searchStore = useSearchStore()
const settingsStore = useSettingsStore()
const { query, history, matchedCommands, localResults, calcResult } = storeToRefs(searchStore)

const isMinimal = computed(() => props.mode === 'minimal')
const currentEngine = computed<SearchEngine>(() => settingsStore.settings.search.engine)
const engineLabel = computed(() => SEARCH_ENGINE_LABELS[currentEngine.value])

const historyTop = computed(() => history.value.slice(0, 5))
const showHistory = computed(() => !query.value.trim() && historyTop.value.length > 0)
const showWebEntry = computed(() => !!query.value.trim())

const taskResults = computed(() => localResults.value.filter((r) => r.type === 'task'))
const noteResults = computed(() => localResults.value.filter((r) => r.type === 'note'))
const websiteResults = computed(() => localResults.value.filter((r) => r.type === 'website'))

function pickEngine(e: SearchEngine) {
  settingsStore.updateSearch({ engine: e })
  searchStore.submitWebSearch(e)
}
function clickHistory(q: string) {
  searchStore.setQuery(q)
  searchStore.submitWebSearch(settingsStore.settings.search.engine)
}
function clickWebEntry() {
  searchStore.submitWebSearch(settingsStore.settings.search.engine)
}
function removeHistoryItem(q: string) {
  searchStore.removeHistory(q)
}
function clearAll() {
  searchStore.clearHistory()
}
function runCommand(cmd: BuiltinCommand) {
  searchStore.executeCommand(cmd, query.value.trim())
}
function runLocal(r: LocalResult) {
  searchStore.executeLocalResult(r)
}
</script>

<template>
  <div
    class="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl"
    :style="{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-card)'
    }"
  >
    <!-- 命令区（仅标准模式） -->
    <div
      v-if="!isMinimal && matchedCommands.length > 0"
      class="border-b"
      :style="{ borderColor: 'var(--color-border)' }"
    >
      <button
        v-for="(cmd, idx) in matchedCommands"
        :key="`cmd-${idx}`"
        type="button"
        class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        @mousedown.prevent="runCommand(cmd.command)"
      >
        <span class="opacity-70">{{ cmd.icon }}</span>
        <span>⚡ {{ cmd.label }}</span>
      </button>
      <div v-if="calcResult" class="px-4 py-1 text-sm" :style="{ color: 'var(--color-accent)' }">
        = {{ calcResult.value }}
      </div>
    </div>

    <!-- 本地结果区（仅标准模式，按 任务 / 笔记 / 网站 分组） -->
    <template
      v-if="!isMinimal && (taskResults.length || noteResults.length || websiteResults.length)"
    >
      <div
        v-if="taskResults.length"
        class="border-b"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <div class="px-4 pt-2 text-xs uppercase tracking-wider opacity-50">任务</div>
        <button
          v-for="(r, idx) in taskResults"
          :key="`task-${idx}`"
          type="button"
          class="group flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          @mousedown.prevent="runLocal(r)"
        >
          <span class="flex items-center gap-2">
            <span class="opacity-50">✓</span>
            <span>{{ r.title }}</span>
          </span>
          <span class="text-xs opacity-0 transition-opacity group-hover:opacity-60">跳转到任务</span>
        </button>
      </div>
      <div
        v-if="noteResults.length"
        class="border-b"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <div class="px-4 pt-2 text-xs uppercase tracking-wider opacity-50">笔记</div>
        <button
          v-for="(r, idx) in noteResults"
          :key="`note-${idx}`"
          type="button"
          class="group flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          @mousedown.prevent="runLocal(r)"
        >
          <span class="flex items-center gap-2">
            <span class="opacity-50">📝</span>
            <span>{{ r.title }}</span>
          </span>
          <span class="text-xs opacity-0 transition-opacity group-hover:opacity-60">打开笔记</span>
        </button>
      </div>
      <div
        v-if="websiteResults.length"
        class="border-b"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <div class="px-4 pt-2 text-xs uppercase tracking-wider opacity-50">网站</div>
        <button
          v-for="(r, idx) in websiteResults"
          :key="`web-${idx}`"
          type="button"
          class="group flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          @mousedown.prevent="runLocal(r)"
        >
          <span class="flex min-w-0 items-center gap-2">
            <span class="opacity-50">🌐</span>
            <span class="truncate">{{ r.title }}</span>
          </span>
          <span class="truncate text-xs opacity-50">{{ r.subtitle }}</span>
        </button>
      </div>
    </template>

    <!-- 网络搜索入口（含引擎 chips） -->
    <div v-if="showWebEntry" class="border-b" :style="{ borderColor: 'var(--color-border)' }">
      <button
        type="button"
        class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        @mousedown.prevent="clickWebEntry"
      >
        <span>🔍</span>
        <span>使用 {{ engineLabel }} 搜索「{{ query.trim() }}」</span>
      </button>
      <div class="flex flex-wrap items-center gap-1.5 px-4 pb-2">
        <button
          v-for="chip in SEARCH_ENGINE_CHIPS"
          :key="chip.engine"
          type="button"
          class="rounded-full border px-2.5 py-0.5 text-xs transition-colors"
          :style="{
            borderColor:
              chip.engine === currentEngine ? 'var(--color-accent)' : 'var(--color-border)',
            color: chip.engine === currentEngine ? 'var(--color-accent)' : 'var(--color-text)',
            background: chip.engine === currentEngine ? 'var(--color-accent-soft)' : 'transparent'
          }"
          @mousedown.prevent="pickEngine(chip.engine)"
        >
          {{ chip.label }}
        </button>
      </div>
    </div>

    <!-- 历史区（聚焦空 query 时显示，含单删 ✕ 与清除按钮） -->
    <div v-if="showHistory">
      <div class="px-4 pt-2 text-xs uppercase tracking-wider opacity-50">⏱ 最近搜索</div>
      <div
        v-for="(item, idx) in historyTop"
        :key="`h-${idx}`"
        class="group flex items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      >
        <button
          type="button"
          class="flex flex-1 items-center gap-2 overflow-hidden text-left"
          @mousedown.prevent="clickHistory(item.query)"
        >
          <span class="shrink-0 opacity-40">⏱</span>
          <span class="truncate">{{ item.query }}</span>
        </button>
        <span class="ml-2 shrink-0 text-xs opacity-40">{{ SEARCH_ENGINE_LABELS[item.engine] }}</span>
        <button
          type="button"
          class="ml-2 shrink-0 opacity-0 transition-opacity hover:!opacity-100 group-hover:opacity-70"
          title="删除该条"
          @mousedown.prevent="removeHistoryItem(item.query)"
        >
          ✕
        </button>
      </div>
      <button
        type="button"
        class="w-full px-4 py-2 text-left text-xs opacity-60 transition-opacity hover:opacity-100"
        @mousedown.prevent="clearAll"
      >
        🧹 清除搜索历史
      </button>
    </div>
  </div>
</template>
