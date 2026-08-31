import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  AppearanceSettings,
  ClockSettings,
  CornerButtonSettings,
  CornerButtonVisibility,
  DisplaySettings,
  SearchSettings,
  Settings,
  ShortcutSettings,
  ThemeMode
} from '@/newtab/types/settings'
import { DEFAULT_SETTINGS, FONT_SIZE_BASE_PX, STORAGE_KEYS } from '@/newtab/constant'
import { loadData, onStorageChange, saveData } from '@/newtab/utils/storage'
import { mergeSettings } from '@/newtab/utils/settings'
import { getAllSearchEngines, MAX_MINIMAL_ENGINES } from '@/newtab/constant/searchEngines'

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
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  const num = Number.parseInt(full, 16)
  if (Number.isNaN(num) || full.length !== 6) return `rgba(99, 102, 241, ${alpha})`
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 组件圆角映射：直角 0 / 小圆角 1rem / 大圆角 2rem */
const RADIUS_MAP: Record<'square' | 'rounded' | 'full', Record<'component' | 'search' | 'sm', string>> = {
  square: { component: '0', search: '0', sm: '0' },
  rounded: { component: '0.75rem', search: '1.25rem', sm: '0.5rem' },
  full: { component: '1.5rem', search: '2.5rem', sm: '1rem' }
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

  function updateDisplay(patch: Partial<DisplaySettings>) {
    settings.value.display = { ...settings.value.display, ...patch }
    void persist()
  }

  function updateSearch(patch: Partial<SearchSettings>) {
    settings.value.search = { ...settings.value.search, ...patch }
    void persist()
  }

  /**
   * 覆盖极简模式下的搜索引擎选择。
   * - 内置引擎不再锁定，可被移除
   * - 按用户传入顺序去重、过滤已失效 id 并截断到 MAX_MINIMAL_ENGINES
   * - 若清空列表，自动回退到全部内置引擎（保证至少 1 个）
   * - 若移除的是当前默认引擎，自动将剩余列表的第一个设为默认
   */
  function updateMinimalEngines(ids: string[]) {
    const all = getAllSearchEngines(settings.value.search.customEngines)
    const allIds = new Set(all.map((e) => e.id))
    const seen = new Set<string>()
    const next: string[] = []
    // 1) 按用户顺序去重 / 过滤失效 id
    for (const id of ids) {
      if (typeof id !== 'string' || !allIds.has(id) || seen.has(id)) continue
      seen.add(id)
      next.push(id)
      if (next.length >= MAX_MINIMAL_ENGINES) break
    }
    // 2) 若列表为空，兜底为第一个内置引擎（保证至少 1 个）
    if (next.length === 0) {
      const fallback = all.find((e) => e.builtin)
      if (fallback) next.push(fallback.id)
    }
    // 3) 若当前默认引擎已被移除，自动设第一个剩余预设引擎为默认
    if (!next.includes(settings.value.search.engine) && next.length > 0) {
      settings.value.search.engine = next[0]!
    }
    settings.value.search.minimalEngines = next
    void persist()
  }

  function updateShortcuts(patch: Partial<ShortcutSettings>) {
    settings.value.shortcuts = { ...settings.value.shortcuts, ...patch }
    void persist()
  }

  function updateCornerButton(patch: Partial<CornerButtonSettings>) {
    settings.value.cornerButton = { ...settings.value.cornerButton, ...patch }
    void persist()
    applyCornerButtonVisibility(settings.value.cornerButton.visibility)
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

  /** 把当前主题、强调色、圆角样式应用到 <html> 根节点 */
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
    // 根字号 / 字体族：驱动全站 rem 与字体偏好
    const { fontSize, fontFamily } = settings.value.appearance
    root.style.setProperty('--font-size-base', `${FONT_SIZE_BASE_PX[fontSize]}px`)
    if (fontFamily) {
      root.style.setProperty('--font-family-base', fontFamily)
    }
    // 组件圆角：根据 searchBarStyle 设置全局 --radius-* 变量
    applyRadius(settings.value.appearance.searchBarStyle)
    // 右上角按钮可见性：设置根节点 class 控制组件 ... 按钮的悬停效果
    applyCornerButtonVisibility(settings.value.cornerButton.visibility)
  }

  /** 根据圆角样式设置全局 --radius-* CSS 变量 */
  function applyRadius(style: 'square' | 'rounded' | 'full') {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const r = RADIUS_MAP[style]
    root.style.setProperty('--radius-component', r.component)
    root.style.setProperty('--radius-search', r.search)
    root.style.setProperty('--radius-sm', r.sm)
  }

  /** 根据右上角按钮可见性设置根节点 class */
  function applyCornerButtonVisibility(visibility: CornerButtonVisibility) {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.remove('corner-btn-always', 'corner-btn-hover')
    if (visibility === 'hidden') return
    root.classList.add('corner-btn-' + visibility)
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
    updateDisplay,
    updateSearch,
    updateMinimalEngines,
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

