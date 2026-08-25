import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSearchStore } from '@/newtab/stores/search'
import { useSettingsStore } from '@/newtab/stores/settings'
import { useKeyboard } from '@/newtab/composables/useKeyboard'

// 搜索 composable：聚合 query 状态、提交搜索与 / Ctrl+K 聚焦快捷键
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

  // "/" 或 Ctrl+K 聚焦搜索（具体聚焦行为由组件实现，这里仅触发事件）
  useKeyboard('/', () => {
    window.dispatchEvent(new CustomEvent('tabtween:focus-search'))
  })
  useKeyboard('Ctrl+K', () => {
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
