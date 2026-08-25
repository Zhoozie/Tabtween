import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { SearchEngine } from '@/newtab/types/settings'
import { SEARCH_ENGINE_URL } from '@/newtab/types/settings'
import { loadData, saveData } from '@/newtab/utils/storage'

const HISTORY_KEY = 'tabtween.search.history'
const MAX_HISTORY = 20

export interface SearchHistoryItem {
  query: string
  engine: SearchEngine
  at: string
}

export const useSearchStore = defineStore('search', () => {
  const query = ref('')
  const isFocused = ref(false)
  const history = ref<SearchHistoryItem[]>([])

  const suggestions = computed<SearchHistoryItem[]>(() => {
    if (!query.value.trim()) return history.value.slice(0, 5)
    const q = query.value.toLowerCase()
    return history.value.filter((h) => h.query.toLowerCase().includes(q)).slice(0, 8)
  })

  function setQuery(value: string) {
    query.value = value
  }

  function setFocused(value: boolean) {
    isFocused.value = value
  }

  function buildSearchUrl(engine: SearchEngine): string {
    const base = SEARCH_ENGINE_URL[engine] ?? SEARCH_ENGINE_URL.baidu
    return `${base}${encodeURIComponent(query.value.trim())}`
  }

  function pushHistory(engine: SearchEngine) {
    const trimmed = query.value.trim()
    if (!trimmed) return
    const item: SearchHistoryItem = {
      query: trimmed,
      engine,
      at: new Date().toISOString()
    }
    const filtered = history.value.filter((h) => h.query !== trimmed)
    filtered.unshift(item)
    history.value = filtered.slice(0, MAX_HISTORY)
    void persistHistory()
  }

  function clearHistory() {
    history.value = []
    void persistHistory()
  }

  async function persistHistory() {
    await loadData(HISTORY_KEY) // ensure key namespace exists
    await saveData(HISTORY_KEY, history.value)
  }

  async function loadHistory() {
    const stored = await loadData<SearchHistoryItem[]>(HISTORY_KEY)
    if (stored) history.value = stored
  }

  function clear() {
    query.value = ''
  }

  return {
    query,
    isFocused,
    history,
    suggestions,
    setQuery,
    setFocused,
    buildSearchUrl,
    pushHistory,
    clearHistory,
    loadHistory,
    clear
  }
})
