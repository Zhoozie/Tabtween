// 数值型限制与默认时长

export const LIMITS = {
  /** 任务列表上限 */
  maxTasks: 100,
  /** 笔记列表上限 */
  maxNotes: 100,
  /** 搜索历史上限 */
  maxSearchHistory: 20,
  /** 番茄钟工作时长（秒） */
  pomodoroWorkSeconds: 25 * 60,
  /** 番茄钟休息时长（秒） */
  pomodoroBreakSeconds: 5 * 60,
  /** 番茄钟历史记录上限（超出截断旧的） */
  maxPomodoroSessions: 1000,
  /** 日子记录上限 */
  maxDays: 100
} as const

/** 番茄钟环形进度条半径（SVG circle r=54，viewBox 120） */
export const POMODORO_RADIUS = 54

/** 番茄钟环形进度条周长（2πr，用于 stroke-dasharray） */
export const POMODORO_CIRC = 2 * Math.PI * POMODORO_RADIUS
