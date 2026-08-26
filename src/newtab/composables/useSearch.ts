import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSearchStore } from '@/newtab/stores/search'
import { useSettingsStore } from '@/newtab/stores/settings'
import { useSettingsShortcut } from '@/newtab/composables/useSettingsShortcut'

// 搜索 composable：聚合 query 状态、提交搜索与聚焦快捷键（设置驱动）
export function useSearch() {
  const searchStore = useSearchStore()
  const settingsStore = useSettingsStore()
  const { query, isFocused, suggestions, history } = storeToRefs(searchStore)

  const engine = computed(() => settingsStore.settings.search.engine)

  function setQuery(value: string) {
    searchStore.setQuery(value)
  }

  function setFocused(value: boolean) {
    searchStore.setFocused(value)
  }

  function submit(): string | null {
    const trimmed = query.value.trim()
    if (!trimmed) return null
    const url = searchStore.buildSearchUrl(engine.value)
    searchStore.pushHistory(engine.value)
    searchStore.clear()
    return url
  }

  function clear() {
    searchStore.clear()
  }

  // 设置驱动的聚焦搜索快捷键（默认 "/"，可自定义为 Ctrl+K 等）
  useSettingsShortcut('focusSearch', () => {
    window.dispatchEvent(new CustomEvent('tabtween:focus-search'))
  })

  return {
    query,
    isFocused,
    suggestions,
    history,
    engine,
    setQuery,
    setFocused,
    submit,
    clear
  }
}

export type UseSearchReturn = ReturnType<typeof useSearch>
