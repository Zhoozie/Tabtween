// 番茄钟类型定义（依据 PRD V0.2 §F6）

/** 番茄钟阶段：工作 / 短休息 / 长休息 */
export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak'

/**
 * 番茄钟设置（存 chrome.storage.sync，跨设备同步）。
 * 对应 PRD §F6 设置项分组。
 */
export interface PomodoroSettings {
  /** 专注时长（分钟，5-60） */
  focusMinutes: number
  /** 短休息时长（分钟，1-15） */
  shortBreakMinutes: number
  /** 长休息时长（分钟，5-30） */
  longBreakMinutes: number
  /** 长休息间隔（每完成多少个工作番茄后触发长休息，2-6） */
  longBreakInterval: number
  /** 工作阶段结束后自动开始休息 */
  autoStartBreak: boolean
  /** 休息阶段结束后自动开始专注 */
  autoStartFocus: boolean
  /** 阶段完成时播放声音提醒 */
  soundEnabled: boolean
  /** 阶段完成时发送浏览器通知 */
  notificationEnabled: boolean
  /** 每日番茄目标（1-16） */
  dailyGoal: number
}

/** 单次完成的工作番茄记录（仅完整走完工作阶段才记录） */
export interface PomodoroSession {
  /** 完成时间戳（ms） */
  at: number
  /** 该工作阶段实际专注秒数 */
  durationSeconds: number
}

/**
 * 番茄钟统计（存 chrome.storage.local，可能累积较大）。
 * 对应 PRD §F6 异常处理：存储失败时统计暂存内存。
 */
export interface PomodoroStats {
  /** 历史完成番茄列表 */
  sessions: PomodoroSession[]
}
