// 默认设置与应用只读信息
import type { AboutInfo, Settings, Shortcut } from '@/newtab/types/settings'
import type { PomodoroSettings } from '@/newtab/types/pomodoro'
import type { DaySettings } from '@/newtab/types/day'
import type { CalendarSettings } from '@/newtab/types/calendar'

export const DEFAULT_SETTINGS: Settings = {
  appearance: {
    theme: 'auto',
    themeColor: '#6366f1',
    fontFamily: 'system-ui',
    fontSize: 'medium',
    searchBoxStyle: 'full',
    searchBarStyle: 'full',
    layoutDensity: 'standard'
  },
  clock: {
    visible: true,
    showDate: true,
    showWeek: true,
    showSeconds: false,
    use24Hour: true,
    style: 'digital',
    clickAction: 'toggleFormat',
    doubleClickAction: 'quickSettings',
    hoverDetail: true,
    clockFont: 'system-ui',
    clockSize: 'medium',
    clockColor: '#ffffff'
  },
  display: {
    showQuickAccess: true
  },
  search: {
    engine: 'baidu',
    customEngines: [],
    showSuggestions: true,
    showHistory: true,
    showHot: false,
    localSearch: true,
    workspaceContentSearch: true,
    suggestionCount: 8,
    enterBehavior: 'newTab',
    recordHistory: true,
    privacyMode: false,
    commands: []
  },
  shortcuts: {
    focusSearch: '/',
    openSettings: 'Ctrl+,',
    switchMode: 'Ctrl+M',
    newNote: 'Ctrl+N',
    addTask: 'Ctrl+T',
    quickAccess: 'Ctrl+B',
    toggleTheme: 'Ctrl+D',
    randomBackground: 'Ctrl+Shift+B'
  },
  cornerButton: {
    visibility: 'hover'
  }
}

/** 默认快捷方式（首次启动且无数据时使用；对应 PRD V0.2 §F5-e） */
export const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    id: 'default-1',
    name: 'GitHub',
    url: 'https://github.com',
    icon: '💻',
    category: 'dev',
    order: 0,
    createdAt: '1970-01-01T00:00:00.000Z'
  },
  {
    id: 'default-2',
    name: 'Google',
    url: 'https://google.com',
    icon: '🔍',
    category: 'work',
    order: 1,
    createdAt: '1970-01-01T00:00:00.000Z'
  },
  {
    id: 'default-3',
    name: 'Bilibili',
    url: 'https://bilibili.com',
    icon: '🎬',
    category: 'entertainment',
    order: 2,
    createdAt: '1970-01-01T00:00:00.000Z'
  },
  {
    id: 'default-4',
    name: '知乎',
    url: 'https://zhihu.com',
    icon: '📚',
    category: 'study',
    order: 3,
    createdAt: '1970-01-01T00:00:00.000Z'
  },
  {
    id: 'default-5',
    name: '少数派',
    url: 'https://sspai.com',
    icon: '📰',
    category: 'news',
    order: 4,
    createdAt: '1970-01-01T00:00:00.000Z'
  }
]

export const ABOUT_INFO: AboutInfo = {
  version: '1.0.0',
  changelog: 'V1.0 初始版本',
  author: 'Tabtween',
  repository: 'https://github.com/Zhoozie/Tabtween',
  license: 'MIT'
}

/** 默认番茄钟设置（首次启动且无数据时使用；对应 PRD V0.2 §F6） */
export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreak: false,
  autoStartFocus: false,
  soundEnabled: true,
  notificationEnabled: true,
  dailyGoal: 8
}

/** 默认日子组件设置（首次启动且无数据时使用；对应 PRD V0.2 §F7） */
export const DEFAULT_DAY_SETTINGS: DaySettings = {
  showExpired: true,
  showDate: true,
  showNote: false,
  maxDisplay: 3,
  sortBy: 'date',
  autoCarousel: false,
  carouselInterval: 5
}

/** 默认日历组件设置（首次启动且无数据时使用；对应 PRD V0.2 §F8） */
export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  firstDayOfWeek: 'sunday',
  showTodayMarker: true,
  showOtherMonthDates: true,
  showBottomBar: true
}
