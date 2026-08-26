import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  AppearanceSettings,
  ClockSettings,
  CornerButtonSettings,
  SearchSettings,
  Settings,
  ShortcutSettings,
  ThemeMode
} from '@/newtab/types/settings'
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/newtab/constant'
import { loadData, onStorageChange, saveData } from '@/newtab/utils/storage'
import { mergeSettings } from '@/newtab/utils/settings'

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'auto') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

/** 16 进制颜色 → rgba 字符串（用于强调色柔化背景） */
export function hexToRgba(hex: string, alpha = 1): string {
  const raw = hex.replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
  const num = Number.parseInt(full, 16)
  if (Number.isNaN(num) || full.length !== 6) return `rgba(99, 102, 241, ${alpha})`
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(structuredClone(DEFAULT_SETTINGS))
  let synced = false

  const resolvedTheme = computed<'light' | 'dark'>(() =>
    resolveTheme(settings.value.appearance.theme)
  )

  function setTheme(mode: ThemeMode) {
    settings.value.appearance.theme = mode
    void persist()
    applyTheme()
  }

  /** 在 light / dark / auto 之间循环 */
  function cycleTheme() {
    const order: ThemeMode[] = ['light', 'dark', 'auto']
    const idx = order.indexOf(settings.value.appearance.theme)
    setTheme(order[(idx + 1) % order.length]!)
  }

  function updateAppearance(patch: Partial<AppearanceSettings>) {
    settings.value.appearance = { ...settings.value.appearance, ...patch }
    void persist()
    applyTheme()
  }

  function updateClock(patch: Partial<ClockSettings>) {
    settings.value.clock = { ...settings.value.clock, ...patch }
    void persist()
  }

  function updateSearch(patch: Partial<SearchSettings>) {
    settings.value.search = { ...settings.value.search, ...patch }
    void persist()
  }

  function updateShortcuts(patch: Partial<ShortcutSettings>) {
    settings.value.shortcuts = { ...settings.value.shortcuts, ...patch }
    void persist()
  }

  function updateCornerButton(patch: Partial<CornerButtonSettings>) {
    settings.value.cornerButton = { ...settings.value.cornerButton, ...patch }
    void persist()
  }

  /** 恢复快捷键为默认值 */
  function resetShortcuts() {
    settings.value.shortcuts = structuredClone(DEFAULT_SETTINGS.shortcuts)
    void persist()
  }

  /** 将全部设置恢复为默认值 */
  function resetSettings() {
    settings.value = structuredClone(DEFAULT_SETTINGS)
    void persist()
    applyTheme()
  }

  /** 覆盖整份设置（导入用），并应用主题 */
  function replaceSettings(next: Settings) {
    settings.value = next
    void persist()
    applyTheme()
  }

  /** 序列化当前设置为 JSON（导出用） */
  function exportSettings(): string {
    return JSON.stringify(settings.value, null, 2)
  }

  /** 把当前主题与强调色应用到 <html> 根节点 */
  function applyTheme() {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme.value)
    // 强调色：覆盖主色与柔化背景
    root.style.setProperty('--color-accent', settings.value.appearance.themeColor)
    root.style.setProperty(
      '--color-accent-soft',
      hexToRgba(settings.value.appearance.themeColor, 0.14)
    )
  }

  async function persist() {
    await saveData(STORAGE_KEYS.settings, settings.value)
  }

  async function load() {
    const stored = await loadData<Settings>(STORAGE_KEYS.settings)
    if (stored) {
      const merged = mergeSettings(stored)
      if (merged) settings.value = merged
    }
    // 应用存储的主题模式与主题色（首次运行也用默认值应用一次）
    applyTheme()
    if (!synced) {
      // 跨标签同步：其他标签页修改设置时更新本地（不回写，避免循环）
      onStorageChange((changes) => {
        const change = changes[STORAGE_KEYS.settings]
        if (!change) return
        const next = change.newValue as Settings | undefined
        if (!next) return
        const merged = mergeSettings(next)
        if (merged) settings.value = merged
        applyTheme()
      })
      synced = true
    }
  }

  return {
    settings,
    resolvedTheme,
    setTheme,
    cycleTheme,
    updateAppearance,
    updateClock,
    updateSearch,
    updateShortcuts,
    updateCornerButton,
    resetShortcuts,
    resetSettings,
    replaceSettings,
    exportSettings,
    applyTheme,
    load
  }
})
