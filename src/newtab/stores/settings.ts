import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Settings, ThemeMode } from '@/newtab/types/settings'
import { DEFAULT_SETTINGS } from '@/newtab/types/settings'
import { loadData, saveData } from '@/newtab/utils/storage'

const STORAGE_KEY = 'tabtween.settings'

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'auto') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(structuredClone(DEFAULT_SETTINGS))

  const resolvedTheme = computed<'light' | 'dark'>(() => resolveTheme(settings.value.theme))

  function setTheme(mode: ThemeMode) {
    settings.value.theme = mode
    void persist()
    applyTheme()
  }

  /** 在 light / dark / auto 之间循环 */
  function cycleTheme() {
    const order: ThemeMode[] = ['light', 'dark', 'auto']
    const idx = order.indexOf(settings.value.theme)
    setTheme(order[(idx + 1) % order.length]!)
  }

  function updateSettings(patch: Partial<Settings>) {
    settings.value = { ...settings.value, ...patch }
    void persist()
    applyTheme()
  }

  /** 把当前主题应用到 <html> 根节点 */
  function applyTheme() {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme.value)
  }

  async function persist() {
    await saveData(STORAGE_KEY, settings.value)
  }

  async function load() {
    const stored = await loadData<Settings>(STORAGE_KEY)
    if (stored) {
      // 合并默认值，防止新字段缺失
      settings.value = {
        ...DEFAULT_SETTINGS,
        ...stored,
        clock: { ...DEFAULT_SETTINGS.clock, ...stored.clock },
        search: { ...DEFAULT_SETTINGS.search, ...stored.search }
      }
    }
  }

  return {
    settings,
    resolvedTheme,
    setTheme,
    cycleTheme,
    updateSettings,
    applyTheme,
    load
  }
})
