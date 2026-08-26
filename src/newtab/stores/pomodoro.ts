import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type {
  PomodoroPhase,
  PomodoroSettings,
  PomodoroSession,
  PomodoroStats
} from '@/newtab/types/pomodoro'
import {
  loadData,
  loadLargeData,
  onStorageChange,
  saveData,
  saveLargeData
} from '@/newtab/utils/storage'
import { DEFAULT_POMODORO_SETTINGS, LIMITS, STORAGE_KEYS } from '@/newtab/constant'

// ===== 工具函数 =====

/** 数值规整：非有限数回落到默认，并夹取到 [min, max] */
function clampNum(value: unknown, fallback: number, min: number, max: number): number {
  const n =
    typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** 某天 00:00（本地时区）的时间戳 */
function dayStart(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** 本周周一 00:00（本地时区，周一为一周起点）的时间戳 */
function weekStart(ts: number): number {
  const day = new Date(ts)
  const offset = (day.getDay() + 6) % 7 // 周日=0 → 偏移 6；周一=1 → 偏移 0
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - offset).getTime()
}

/** 分钟数格式化为 "Xh Ym" 或 "Ym" */
function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0) return `${h}h${m}m`
  return `${m}m`
}

// ===== 规整迁移 =====

/** 规整番茄钟设置：补齐缺失字段、夹取范围（PRD 异常：默认值兜底 + 迁移） */
function normalizeSettings(raw: unknown): PomodoroSettings {
  const d = DEFAULT_POMODORO_SETTINGS
  if (!raw || typeof raw !== 'object') return { ...d }
  const o = raw as Partial<PomodoroSettings>
  return {
    focusMinutes: clampNum(o.focusMinutes, d.focusMinutes, 5, 60),
    shortBreakMinutes: clampNum(o.shortBreakMinutes, d.shortBreakMinutes, 1, 15),
    longBreakMinutes: clampNum(o.longBreakMinutes, d.longBreakMinutes, 5, 30),
    longBreakInterval: clampNum(o.longBreakInterval, d.longBreakInterval, 2, 6),
    autoStartBreak: Boolean(o.autoStartBreak ?? d.autoStartBreak),
    autoStartFocus: Boolean(o.autoStartFocus ?? d.autoStartFocus),
    soundEnabled: Boolean(o.soundEnabled ?? d.soundEnabled),
    notificationEnabled: Boolean(o.notificationEnabled ?? d.notificationEnabled),
    dailyGoal: clampNum(o.dailyGoal, d.dailyGoal, 1, 16)
  }
}

/** 规整番茄钟统计：仅保留合法 session，并截断到上限 */
function normalizeStats(raw: unknown): PomodoroStats {
  if (!raw || typeof raw !== 'object') return { sessions: [] }
  const o = raw as Partial<PomodoroStats>
  if (!Array.isArray(o.sessions)) return { sessions: [] }
  const valid = o.sessions.filter(
    (s): s is PomodoroSession =>
      !!s && typeof s.at === 'number' && typeof s.durationSeconds === 'number'
  )
  return { sessions: valid.slice(-LIMITS.maxPomodoroSessions) }
}

// ===== 提醒：声音 + 浏览器通知 =====

let audioCtx: AudioContext | null = null

/** 用 Web Audio API 生成短蜂鸣（不依赖外部音频文件，符合 AGENTS.md 禁远程代码） */
function playBeep(): void {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return
  try {
    // 用户首次交互（点击开始）后才创建 AudioContext，符合浏览器自动播放策略
    if (!audioCtx) audioCtx = new AudioContext()
    void audioCtx.resume()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.15
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    const now = audioCtx.currentTime
    osc.start(now)
    osc.stop(now + 0.18)
  } catch {
    // 忽略音频错误，不影响计时
  }
}

/** 发送浏览器通知（权限拒绝或不可用则不发） */
function sendNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, { body })
  } catch {
    // 忽略
  }
}

// ===== Store =====

export const usePomodoroStore = defineStore('pomodoro', () => {
  // 持久化状态
  const settings = ref<PomodoroSettings>({ ...DEFAULT_POMODORO_SETTINGS })
  const stats = ref<PomodoroStats>({ sessions: [] })

  // 运行时状态（不持久化：标签页关闭即丢失，未完成番茄不计数）
  const phase = ref<PomodoroPhase>('work')
  const remaining = ref<number>(settings.value.focusMinutes * 60)
  const running = ref<boolean>(false)
  const completedInRound = ref<number>(0)
  // 用于让"今日/本周"统计在每秒 tick 时刷新边界
  const now = ref<number>(Date.now())
  let synced = false

  // ===== 派生：阶段时长与标签 =====

  const phaseTotalSeconds = computed(() => {
    const s = settings.value
    const map: Record<PomodoroPhase, number> = {
      work: s.focusMinutes * 60,
      shortBreak: s.shortBreakMinutes * 60,
      longBreak: s.longBreakMinutes * 60
    }
    return map[phase.value]
  })

  const phaseLabel = computed(() => {
    const map: Record<PomodoroPhase, string> = {
      work: '专注中',
      shortBreak: '短休息',
      longBreak: '长休息'
    }
    return map[phase.value]
  })

  // ===== 派生：统计 =====

  const todaySessions = computed(() => {
    const start = dayStart(now.value)
    return stats.value.sessions.filter((s) => s.at >= start)
  })
  const todayCount = computed(() => todaySessions.value.length)
  const todayFocusSeconds = computed(() =>
    todaySessions.value.reduce((sum, s) => sum + s.durationSeconds, 0)
  )
  const todayFocusMinutes = computed(() => Math.floor(todayFocusSeconds.value / 60))
  const todayFocusLabel = computed(() => formatDuration(todayFocusMinutes.value))

  const weekSessions = computed(() => {
    const start = weekStart(now.value)
    return stats.value.sessions.filter((s) => s.at >= start)
  })
  const weekCount = computed(() => weekSessions.value.length)
  const weekFocusSeconds = computed(() =>
    weekSessions.value.reduce((sum, s) => sum + s.durationSeconds, 0)
  )
  const weekFocusMinutes = computed(() => Math.floor(weekFocusSeconds.value / 60))
  const weekFocusLabel = computed(() => formatDuration(weekFocusMinutes.value))

  const totalCount = computed(() => stats.value.sessions.length)

  /** 连续专注天数：从今天向前数，今天无则从昨天起算 */
  const streakDays = computed(() => {
    const stamps = new Set(stats.value.sessions.map((s) => dayStart(s.at)))
    const oneDay = 24 * 3600 * 1000
    let cursor = dayStart(now.value)
    if (!stamps.has(cursor)) cursor -= oneDay
    let streak = 0
    while (stamps.has(cursor)) {
      streak += 1
      cursor -= oneDay
    }
    return streak
  })

  const todayGoalProgress = computed(() => {
    const g = settings.value.dailyGoal
    if (g <= 0) return 0
    return Math.min(1, todayCount.value / g)
  })
  const todayGoalPercent = computed(() => Math.round(todayGoalProgress.value * 100))
  const todayGoalReached = computed(() => todayCount.value >= settings.value.dailyGoal)

  /** 本轮进度：第 N 轮 / 共 M 轮（到长休息） */
  const roundInfo = computed(() => {
    const total = settings.value.longBreakInterval
    let current = completedInRound.value
    if (phase.value === 'work') current += 1
    if (current < 1) current = 1
    if (current > total) current = total
    return { current, total }
  })

  // ===== 内部：阶段完成处理 =====

  function addSession(session: PomodoroSession): void {
    stats.value.sessions.push(session)
    if (stats.value.sessions.length > LIMITS.maxPomodoroSessions) {
      // 超出上限截断旧的，保留近期
      stats.value.sessions = stats.value.sessions.slice(-LIMITS.maxPomodoroSessions)
    }
    void persistStats()
  }

  function notifyPhaseComplete(justFinishedWork: boolean): void {
    if (settings.value.soundEnabled) playBeep()
    if (settings.value.notificationEnabled) {
      if (justFinishedWork) {
        sendNotification('专注完成', '休息一下吧')
      } else {
        sendNotification('休息结束', '继续专注吧')
      }
    }
  }

  /** 当前阶段倒计时归零：记录工作番茄、切换阶段、按设置自动开始下一阶段 */
  function finishCurrentPhase(): void {
    const wasWork = phase.value === 'work'
    if (wasWork) {
      // 仅完整走完工作阶段才记录 session（PRD：未完成番茄不计数）
      addSession({ at: Date.now(), durationSeconds: phaseTotalSeconds.value })
      completedInRound.value += 1
      if (completedInRound.value >= settings.value.longBreakInterval) {
        phase.value = 'longBreak'
        completedInRound.value = 0
      } else {
        phase.value = 'shortBreak'
      }
    } else {
      phase.value = 'work'
    }
    remaining.value = phaseTotalSeconds.value
    notifyPhaseComplete(wasWork)
    const autoNext = wasWork ? settings.value.autoStartBreak : settings.value.autoStartFocus
    running.value = autoNext
  }

  /** 每秒 tick：由组件 setInterval 调用 */
  function tick(): void {
    now.value = Date.now()
    if (!running.value) return
    if (remaining.value > 0) {
      remaining.value -= 1
      return
    }
    finishCurrentPhase()
  }

  // ===== 动作 =====

  function start(): void {
    if (running.value) return
    running.value = true
  }

  function pause(): void {
    if (!running.value) return
    running.value = false
  }

  /** 重置当前阶段为满值，停止计时（不计数） */
  function reset(): void {
    running.value = false
    remaining.value = phaseTotalSeconds.value
  }

  /** 跳过当前阶段：未完成的工作番茄不计数，进入下一阶段并暂停 */
  function skip(): void {
    running.value = false
    const wasWork = phase.value === 'work'
    if (wasWork) {
      if (completedInRound.value >= settings.value.longBreakInterval) {
        phase.value = 'longBreak'
        completedInRound.value = 0
      } else {
        phase.value = 'shortBreak'
      }
    } else {
      phase.value = 'work'
    }
    remaining.value = phaseTotalSeconds.value
  }

  function updateSettings(patch: Partial<PomodoroSettings>): void {
    settings.value = { ...settings.value, ...patch }
    void persistSettings()
  }

  /** 请求通知权限（用户启用通知开关时调用，需用户手势） */
  function requestNotificationPermission(): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'default') return
    void Notification.requestPermission()
  }

  function resetStats(): void {
    stats.value = { sessions: [] }
    void persistStats()
  }

  // ===== 持久化 =====

  async function persistSettings(): Promise<void> {
    await saveData(STORAGE_KEYS.pomodoroSettings, settings.value)
  }

  async function persistStats(): Promise<void> {
    await saveLargeData(STORAGE_KEYS.pomodoroStats, stats.value)
  }

  async function load(): Promise<void> {
    const [sRaw, stRaw] = await Promise.all([
      loadData<unknown>(STORAGE_KEYS.pomodoroSettings),
      loadLargeData<unknown>(STORAGE_KEYS.pomodoroStats)
    ])
    settings.value = normalizeSettings(sRaw)
    stats.value = normalizeStats(stRaw)
    now.value = Date.now()
    if (!running.value) remaining.value = phaseTotalSeconds.value
    if (!synced) {
      onStorageChange((changes) => {
        const sChange = changes[STORAGE_KEYS.pomodoroSettings]
        if (sChange && sChange.newValue !== undefined) {
          settings.value = normalizeSettings(sChange.newValue)
        }
        const stChange = changes[STORAGE_KEYS.pomodoroStats]
        if (stChange && stChange.newValue !== undefined) {
          stats.value = normalizeStats(stChange.newValue)
        }
      })
      synced = true
    }
  }

  // 设置变化（含跨标签同步）时，若未运行则重置当前阶段剩余时间为新满值
  watch(phaseTotalSeconds, (total) => {
    if (!running.value) remaining.value = total
  })

  // 启动时自加载（单例，确保组件随时可读）
  void load()

  return {
    settings,
    stats,
    phase,
    remaining,
    running,
    phaseTotalSeconds,
    phaseLabel,
    todayCount,
    todayFocusMinutes,
    todayFocusLabel,
    weekCount,
    weekFocusMinutes,
    weekFocusLabel,
    totalCount,
    streakDays,
    todayGoalProgress,
    todayGoalPercent,
    todayGoalReached,
    roundInfo,
    start,
    pause,
    reset,
    skip,
    tick,
    updateSettings,
    requestNotificationPermission,
    resetStats,
    persistSettings,
    persistStats,
    load
  }
})
