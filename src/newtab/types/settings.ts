// 设置相关类型定义

export type ThemeMode = 'light' | 'dark' | 'auto'

export type SearchEngine = 'baidu' | 'google' | 'bing' | 'duckduckgo'

export interface ClockSettings {
  visible: boolean
  showDate: boolean
  showWeek: boolean
  showSeconds: boolean
  use24Hour: boolean
}

export interface SearchSettings {
  engine: SearchEngine
  showHistory: boolean
  openInNewTab: boolean
}

export interface Settings {
  theme: ThemeMode
  clock: ClockSettings
  search: SearchSettings
}

export const SEARCH_ENGINE_URL: Record<SearchEngine, string> = {
  baidu: 'https://www.baidu.com/s?wd=',
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q='
}

export const SEARCH_ENGINE_LABELS: Record<SearchEngine, string> = {
  baidu: '百度',
  google: 'Google',
  bing: '必应',
  duckduckgo: 'DuckDuckGo'
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  clock: {
    visible: true,
    showDate: true,
    showWeek: true,
    showSeconds: false,
    use24Hour: true
  },
  search: {
    engine: 'baidu',
    showHistory: true,
    openInNewTab: true
  }
}
