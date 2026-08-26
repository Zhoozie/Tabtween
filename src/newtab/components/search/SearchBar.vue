<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSearchStore } from '@/newtab/stores/search'
import { useSettingsStore } from '@/newtab/stores/settings'
import { useModeStore } from '@/newtab/stores/mode'
import type { SearchBoxStyle } from '@/newtab/types/settings'
import type { Scene } from '@/newtab/types/mode'
import SearchResults from '@/newtab/components/search/SearchResults.vue'

const props = withDefaults(
  defineProps<{
    /** 极简模式下放大宽度 */
    size?: 'minimal' | 'standard'
    /** 极简模式占位文本；标准模式由场景派生，忽略此 prop */
    placeholder?: string
  }>(),
  { size: 'standard', placeholder: '搜索' }
)

const searchStore = useSearchStore()
const settingsStore = useSettingsStore()
const modeStore = useModeStore()
const { query, isFocused } = storeToRefs(searchStore)

const inputRef = ref<HTMLInputElement | null>(null)

const isMinimal = computed(() => props.size === 'minimal')

const SCENE_PLACEHOLDER: Record<Scene, string> = {
  work: '搜索工作内容...',
  study: '搜索学习资料...',
  leisure: '搜索...'
}

const effectivePlaceholder = computed(() => {
  if (isMinimal.value) return props.placeholder || '搜索'
  return SCENE_PLACEHOLDER[modeStore.currentScene]
})

// 宽度：极简 40%→60%(300ms)；标准 50%→60%(200ms)
const widthClass = computed(() => {
  if (isMinimal.value) return isFocused.value ? 'w-[60%]' : 'w-[40%]'
  return isFocused.value ? 'w-[60%]' : 'w-[50%]'
})
const durationClass = isMinimal.value ? 'duration-300' : 'duration-200'
const panelTransitionName = isMinimal.value ? 'panel-min' : 'panel-std'

// 搜索框圆角（PRD V0.2 外观·布局）
const boxRadius = computed<string>(() => {
  switch (settingsStore.settings.appearance.searchBoxStyle as SearchBoxStyle) {
    case 'square':
      return '0.5rem'
    case 'rounded':
      return '0.75rem'
    case 'full':
    default:
      return '9999px'
  }
})

const inputPadding = computed(() =>
  settingsStore.settings.appearance.layoutDensity === 'compact' ? 'py-1.5' : 'py-2.5'
)

// 是否展示建议面板：聚焦 + （有 query 或 有历史）
const showPanel = computed(() => {
  if (!isFocused.value) return false
  const q = query.value.trim()
  if (!q) return searchStore.history.length > 0
  return true
})

function onFocus() {
  searchStore.setFocused(true)
}
function onBlur() {
  // 延迟失焦以允许点击建议
  window.setTimeout(() => searchStore.setFocused(false), 150)
}

function submit() {
  const trimmed = searchStore.query.trim()
  if (!trimmed) return
  if (!isMinimal.value) {
    // 优先级：命令 → 本地结果 → 网络搜索
    const cmds = searchStore.matchedCommands
    if (cmds.length > 0) {
      const cmd = cmds[0]!
      // 计算命令仅展示结果，回车不跳转
      if (cmd.command.action === 'calc') return
      searchStore.executeCommand(cmd.command, trimmed)
      inputRef.value?.blur()
      return
    }
    const locals = searchStore.localResults
    if (locals.length > 0) {
      searchStore.executeLocalResult(locals[0]!)
      inputRef.value?.blur()
      return
    }
  }
  searchStore.submitWebSearch(settingsStore.settings.search.engine)
  inputRef.value?.blur()
}

// 监听全局聚焦事件（由聚焦快捷键触发）
function focusHandler() {
  inputRef.value?.focus()
  inputRef.value?.select()
}

onMounted(() => {
  window.addEventListener('tabtween:focus-search', focusHandler)
})
onUnmounted(() => {
  window.removeEventListener('tabtween:focus-search', focusHandler)
})
</script>

<template>
  <div
    class="relative min-w-[320px] transition-[width] ease-out"
    :class="[widthClass, durationClass]"
  >
    <form
      class="flex items-center overflow-hidden border transition-all"
      :style="{
        borderRadius: boxRadius,
        background: 'var(--color-bg-elevated)',
        borderColor: isFocused ? 'var(--color-accent)' : 'var(--color-border)',
        boxShadow: isFocused ? '0 0 0 4px var(--color-accent-soft)' : 'none'
      }"
      @submit.prevent="submit"
    >
      <input
        ref="inputRef"
        type="text"
        :value="query"
        :placeholder="effectivePlaceholder"
        autocomplete="off"
        spellcheck="false"
        class="min-w-0 flex-1 border-0 bg-transparent px-4 text-sm outline-none"
        :class="inputPadding"
        :style="{ color: 'var(--color-text)' }"
        @input="searchStore.setQuery(($event.target as HTMLInputElement).value)"
        @focus="onFocus"
        @blur="onBlur"
      />
      <button
        v-if="query"
        type="button"
        class="shrink-0 pr-3 text-sm opacity-50 hover:opacity-100"
        aria-label="清空"
        @click="searchStore.clear()"
      >
        ✕
      </button>
    </form>

    <Transition :name="panelTransitionName">
      <SearchResults v-if="showPanel" :mode="size" />
    </Transition>
  </div>
</template>

<style scoped>
/* 面板进出动画：极简 300ms / 标准 200ms，仅使用 opacity 与 transform（60fps 友好） */
.panel-min-enter-active,
.panel-min-leave-active {
  transition:
    opacity 300ms ease,
    transform 300ms ease;
}
.panel-std-enter-active,
.panel-std-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}
.panel-min-enter-from,
.panel-min-leave-to,
.panel-std-enter-from,
.panel-std-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
