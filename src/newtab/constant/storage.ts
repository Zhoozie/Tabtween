// Chrome Storage 键名集中管理
// sync 用于设置/偏好，local 用于笔记/任务等较大数据（见 utils/storage）

export const STORAGE_KEYS = {
  settings: 'tabtween.settings',
  mode: 'tabtween.mode',
  tasks: 'tabtween.tasks',
  tasksSettings: 'tabtween.tasks.settings',
  note: 'tabtween.note',
  noteSettings: 'tabtween.note.settings',
  shortcuts: 'tabtween.shortcuts',
  searchHistory: 'tabtween.search.history',
  pomodoroSettings: 'tabtween.pomodoro.settings',
  pomodoroStats: 'tabtween.pomodoro.stats',
  days: 'tabtween.days',
  daysSettings: 'tabtween.days.settings',
  calendarSettings: 'tabtween.calendar.settings'
} as const

export type StorageKey = keyof typeof STORAGE_KEYS
