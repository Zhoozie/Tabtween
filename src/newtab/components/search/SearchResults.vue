<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSearchStore, type LocalResult } from '@/newtab/stores/search'
import { useSettingsStore } from '@/newtab/stores/settings'
import { getMinimalEngines, getSearchEngines } from '@/newtab/constant/searchEngines'
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
// 极简模式：从用户配置的 minimalEngines 中取；标准模式：使用全部可见引擎
const availableEngines = computed(() =>
  isMinimal.value
    ? getMinimalEngines(settingsStore.settings.search.customEngines, settingsStore.settings.search.minimalEngines)
    : getSearchEngines(settingsStore.settings.search.customEngines, currentEngine.value)
)
const currentEngineDefinition = computed(
  () =>
    availableEngines.value.find((engine) => engine.id === currentEngine.value) ??
    availableEngines.value[0]
)
const engineLabel = computed(() => currentEngineDefinition.value?.name ?? currentEngine.value)

const historyTop = computed(() => history.value.slice(0, 5))
const showHistory = computed(() => !query.value.trim() && historyTop.value.length > 0)
const showWebEntry = computed(() => !!query.value.trim())

const taskResults = computed(() => localResults.value.filter((r) => r.type === 'task'))
const noteResults = computed(() => localResults.value.filter((r) => r.type === 'note'))
const websiteResults = computed(() => localResults.value.filter((r) => r.type === 'website'))

function pickEngine(e: SearchEngine) {
  settingsStore.updateSearch({ engine: e })
}

function getHistoryEngineLabel(id: SearchEngine) {
  return getSearchEngines(settingsStore.settings.search.customEngines).find((engine) => engine.id === id)?.name ?? id
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
  <div class="search-panel space-y-3 px-3 py-2">
    <!-- 计算结果（仅在有算式时显示） -->
    <div v-if="calcResult" class="rounded-md px-2.5 py-1.5" :style="{ background: 'var(--color-accent-soft)' }">
      <div class="text-[11px] opacity-55">计算</div>
      <div class="text-sm font-medium">{{ calcResult }}</div>
    </div>

    <!-- 命中的命令（仅标准模式） -->
    <section v-if="!isMinimal && matchedCommands.length > 0">
      <div class="mb-1 px-1 text-[11px] opacity-50">命令</div>
      <ul class="space-y-1">
        <li v-for="m in matchedCommands" :key="m.command.id">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-hover)]"
            @mousedown.prevent="runCommand(m.command)"
          >
            <span class="grid h-6 w-6 place-items-center rounded text-xs" :style="{ background: 'var(--color-accent-soft)' }">
              {{ m.icon }}
            </span>
            <span class="min-w-0 flex-1 truncate text-sm">{{ m.label }}</span>
          </button>
        </li>
      </ul>
    </section>

    <!-- 本地结果（仅标准模式） -->
    <section v-if="!isMinimal && (taskResults.length || noteResults.length || websiteResults.length)">
      <div class="mb-1 px-1 text-[11px] opacity-50">本地结果</div>
      <ul class="space-y-1">
        <li v-for="r in [...taskResults, ...noteResults, ...websiteResults]" :key="r.url ?? r.title">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-hover)]"
            @mousedown.prevent="runLocal(r)"
          >
            <span class="grid h-6 w-6 shrink-0 place-items-center rounded text-xs" :style="{ background: 'var(--color-accent-soft)' }">
              {{ r.type === 'task' ? '✓' : r.type === 'note' ? '📝' : '🔗' }}
            </span>
            <span class="min-w-0 flex-1">
              <div class="truncate text-sm">{{ r.title }}</div>
              <div v-if="r.subtitle" class="truncate text-[11px] opacity-55">{{ r.subtitle }}</div>
            </span>
          </button>
        </li>
      </ul>
    </section>

    <!-- 历史记录 -->
    <section v-if="showHistory">
      <div class="mb-1 flex items-center justify-between px-1">
        <span class="text-[11px] opacity-50">历史搜索</span>
        <button
          type="button"
          class="text-[11px] opacity-50 transition-opacity hover:opacity-100"
          @mousedown.prevent="clearAll"
        >
          清空
        </button>
      </div>
      <ul class="space-y-1">
        <li v-for="h in historyTop" :key="h.query + h.timestamp">
          <div class="group flex items-center gap-1">
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-hover)]"
              @mousedown.prevent="clickHistory(h.query)"
            >
              <span class="text-xs opacity-45">🕘</span>
              <span class="min-w-0 flex-1 truncate text-sm">{{ h.query }}</span>
              <span class="ml-2 shrink-0 text-[11px] opacity-40">{{ getHistoryEngineLabel(h.engine) }}</span>
            </button>
            <button
              type="button"
              class="grid h-7 w-7 place-items-center rounded-md text-xs opacity-0 transition-opacity hover:bg-[var(--color-hover)] group-hover:opacity-60"
              aria-label="删除"
              @mousedown.prevent="removeHistoryItem(h.query)"
            >
              ✕
            </button>
          </div>
        </li>
      </ul>
    </section>

    <!-- 网络搜索入口 + 引擎选择 -->
    <section v-if="showWebEntry">
      <div class="mb-1 px-1 text-[11px] opacity-50">使用 {{ engineLabel }} 搜索</div>
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-hover)]"
        @mousedown.prevent="clickWebEntry"
      >
        <span class="grid h-6 w-6 shrink-0 place-items-center rounded text-xs" :style="{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }">
          {{ currentEngineDefinition?.icon ?? '🔎' }}
        </span>
        <span class="min-w-0 flex-1 truncate text-sm">搜索「{{ query.trim() }}」</span>
        <span class="ml-2 shrink-0 text-[11px] opacity-50">↵</span>
      </button>

      <!-- 切换引擎（极简模式仅展示用户选择的引擎） -->
      <div v-if="availableEngines.length > 1" class="mt-2 flex flex-wrap gap-1.5 px-1">
        <button
          v-for="engine in availableEngines"
          :key="engine.id"
          type="button"
          class="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-all"
          :style="{
            borderColor: engine.id === currentEngine ? 'var(--color-accent)' : 'var(--color-border)',
            color: engine.id === currentEngine ? 'var(--color-accent)' : 'var(--color-text)',
            background: engine.id === currentEngine ? 'var(--color-accent-soft)' : 'transparent'
          }"
          @mousedown.prevent="pickEngine(engine.id)"
        >
          <span>{{ engine.icon }}</span>
          <span>{{ engine.name }}</span>
        </button>
      </div>
    </section>

    <!-- 空状态：聚焦但无 query 也没历史 -->
    <div v-if="!showHistory && !showWebEntry && !isMinimal" class="px-2 py-4 text-center text-xs opacity-50">
      输入关键词开始搜索
    </div>
  </div>
</template>

<style scoped>
.search-panel {
  border-radius: var(--radius-component);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
}
</style>
