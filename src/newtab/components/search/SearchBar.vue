<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSearchStore } from '@/newtab/stores/search'
import { useSettingsStore } from '@/newtab/stores/settings'
import SearchResults from '@/newtab/components/search/SearchResults.vue'

const props = withDefaults(
  defineProps<{
    /** 极简模式下放大宽度 */
    size?: 'minimal' | 'standard'
    placeholder?: string
  }>(),
  { size: 'standard', placeholder: '搜索' }
)

const searchStore = useSearchStore()
const settingsStore = useSettingsStore()
const { query, isFocused, suggestions } = storeToRefs(searchStore)

const inputRef = ref<HTMLInputElement | null>(null)

const widthClass = props.size === 'minimal' ? 'w-[60%] min-w-[280px]' : 'w-full max-w-xl'

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
  const engine = settingsStore.settings.search.engine
  const url = searchStore.buildSearchUrl(engine)
  searchStore.pushHistory(engine)
  searchStore.clear()
  const openInNewTab = settingsStore.settings.search.openInNewTab
  if (openInNewTab) {
    window.open(url, '_blank')
  } else {
    window.location.href = url
  }
}

function selectHistory(item: { query: string; engine?: string }) {
  searchStore.setQuery(item.query)
  submit()
}

// 监听全局聚焦事件（由 "/" 或 Ctrl+K 触发）
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
  <div class="relative" :class="widthClass">
    <form class="relative" @submit.prevent="submit">
      <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg opacity-50"
        >🔍</span
      >
      <input
        ref="inputRef"
        type="text"
        :value="query"
        :placeholder="placeholder"
        autocomplete="off"
        spellcheck="false"
        class="w-full rounded-full border py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:outline-none"
        :style="{
          background: 'var(--color-bg-elevated)',
          borderColor: isFocused ? 'var(--color-accent)' : 'var(--color-border)',
          boxShadow: isFocused ? '0 0 0 4px var(--color-accent-soft)' : 'none',
          color: 'var(--color-text)'
        }"
        @input="searchStore.setQuery(($event.target as HTMLInputElement).value)"
        @focus="onFocus"
        @blur="onBlur"
      />
      <button
        v-if="query"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-50 hover:opacity-100"
        @click="searchStore.clear()"
      >
        ✕
      </button>
    </form>

    <!-- 搜索结果面板 -->
    <SearchResults
      v-if="isFocused && (query || suggestions.length > 0)"
      :query="query"
      :suggestions="suggestions"
      @select="selectHistory"
    />
  </div>
</template>
