import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Day, DayCategory, DaySettings, DaySortBy } from '@/newtab/types/day'
import {
  loadData,
  loadLargeData,
  onStorageChange,
  saveData,
  saveLargeData
} from '@/newtab/utils/storage'
import { DEFAULT_DAY_SETTINGS, LIMITS, STORAGE_KEYS } from '@/newtab/constant'

// ===== 工具函数（导出供组件复用）=====

/** 生成唯一 id（优先 crypto.randomUUID，降级到时间戳+随机串） */
function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** 数值规整：非有限数回落到默认，并夹取到 [min, max] */
function clampNum(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** 解析 'YYYY-MM-DD' 为本地 00:00 Date；非法返回 null */
function parseDateStart(dateStr: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!mo || !d) return null
  const dt = new Date(y, mo - 1, d)
  if (Number.isNaN(dt.getTime())) return null
  return dt
}

/**
 * 计算日子相对今天的天数差。
 * 正=未来、0=今天、负=过去。
 * 取今天 00:00 与日子日期 00:00 的 UTC 毫秒差除以一天的毫秒数，
 * 避免 DST / 时分秒导致的误差。
 */
export function daysDiffFromToday(dateStr: string): number {
  const day = parseDateStart(dateStr)
  if (!day) return 0
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayUTC = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const oneDay = 24 * 3600 * 1000
  return Math.round((dayUTC - todayUTC) / oneDay)
}

/** 格式化 'YYYY-MM-DD' 为 'YYYY年M月D日'；非法返回原字符串 */
export function formatDateDisplay(dateStr: string): string {
  const day = parseDateStart(dateStr)
  if (!day) return dateStr
  return `${day.getFullYear()}年${day.getMonth() + 1}月${day.getDate()}日`
}

/** 返回今天 'YYYY-MM-DD'（用于表单默认值） */
export function todayStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// ===== 规整迁移 =====

const VALID_CATEGORIES: DayCategory[] = [
  'birthday',
  'anniversary',
  'exam',
  'work',
  'holiday',
  'other'
]
const VALID_SORT_BY: DaySortBy[] = ['date', 'created', 'name']

/** 规整单条日子：补齐缺失字段、修正非法分类 */
function normalizeDay(raw: unknown): Day | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<Day>
  if (
    typeof o.id !== 'string' ||
    typeof o.name !== 'string' ||
    typeof o.date !== 'string'
  ) {
    return null
  }
  const category: DayCategory = VALID_CATEGORIES.includes(o.category as DayCategory)
    ? (o.category as DayCategory)
    : 'other'
  const now = new Date().toISOString()
  return {
    id: o.id,
    name: o.name,
    date: o.date,
    category,
    note: typeof o.note === 'string' ? o.note : undefined,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : now,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : now
  }
}

/** 规整日子数组：过滤非法项，截断到上限 */
function normalizeDays(raw: unknown): Day[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(normalizeDay)
    .filter((d): d is Day => d !== null)
    .slice(0, LIMITS.maxDays)
}

/** 规整日子设置：补齐缺失字段、夹取范围 */
function normalizeSettings(raw: unknown): DaySettings {
  const d = DEFAULT_DAY_SETTINGS
  if (!raw || typeof raw !== 'object') return { ...d }
  const o = raw as Partial<DaySettings>
  return {
    showExpired: Boolean(o.showExpired ?? d.showExpired),
    showDate: Boolean(o.showDate ?? d.showDate),
    showNote: Boolean(o.showNote ?? d.showNote),
    maxDisplay: clampNum(o.maxDisplay, d.maxDisplay, 1, 9),
    sortBy: VALID_SORT_BY.includes(o.sortBy as DaySortBy) ? (o.sortBy as DaySortBy) : d.sortBy,
    autoCarousel: Boolean(o.autoCarousel ?? d.autoCarousel),
    carouselInterval: clampNum(o.carouselInterval, d.carouselInterval, 3, 10)
  }
}

// ===== Store =====

export const useDaysStore = defineStore('days', () => {
  // 持久化状态
  const days = ref<Day[]>([])
  const settings = ref<DaySettings>({ ...DEFAULT_DAY_SETTINGS })
  // 本体轮播位置（在 displayDays 内的索引）
  const currentIndex = ref<number>(0)
  let synced = false

  // ===== 派生：排序 =====
  /**
   * 统一排序后的日子列表。
   * 顺序：今天 → 即将到来（从近到远） → 已经过去（从近到远，即最近的过去在前）。
   * sortBy 影响"近→远"的具体排序键：
   *   - date / created：在"过去"分组内倒序（最近在前），其余分组正序。
   *   - name：所有分组内按名称 localeCompare 正序。
   */
  const sortedDays = computed<Day[]>(() => {
    const list = [...days.value]
    const sortBy = settings.value.sortBy
    list.sort((a, b) => {
      const aDiff = daysDiffFromToday(a.date)
      const bDiff = daysDiffFromToday(b.date)
      // 分组优先级：今天(0) < 即将到来(1) < 已经过去(2)
      const aGroup = aDiff === 0 ? 0 : aDiff > 0 ? 1 : 2
      const bGroup = bDiff === 0 ? 0 : bDiff > 0 ? 1 : 2
      if (aGroup !== bGroup) return aGroup - bGroup

      // 同组内按 sortBy 比较
      if (sortBy === 'name') return a.name.localeCompare(b.name)

      const keyA = sortBy === 'date' ? a.date : a.createdAt
      const keyB = sortBy === 'date' ? b.date : b.createdAt
      // 过去组：从近到远 = 最近日期在前 → 倒序
      // 其余组：从近到远 = 最近日期在前 → 正序
      if (aGroup === 2) {
        return keyA < keyB ? 1 : keyA > keyB ? -1 : 0
      }
      return keyA < keyB ? -1 : keyA > keyB ? 1 : 0
    })
    return list
  })

  /**
   * 列表页三分组（按 showExpired 决定是否包含过去）。
   * 每组内已按 sortedDays 顺序排列。
   */
  const groupedDays = computed<{
    today: Day[]
    upcoming: Day[]
    past: Day[]
  }>(() => {
    const today: Day[] = []
    const upcoming: Day[] = []
    const past: Day[] = []
    for (const d of sortedDays.value) {
      const diff = daysDiffFromToday(d.date)
      if (!settings.value.showExpired && diff < 0) continue
      if (diff === 0) today.push(d)
      else if (diff > 0) upcoming.push(d)
      else past.push(d)
    }
    return { today, upcoming, past }
  })

  /**
   * 本体展示的日子（前 maxDisplay 个，按 showExpired 过滤过去）。
   * 用于轮播与底部指示点。
   */
  const displayDays = computed<Day[]>(() => {
    const list = settings.value.showExpired
      ? sortedDays.value
      : sortedDays.value.filter((d) => daysDiffFromToday(d.date) >= 0)
    return list.slice(0, settings.value.maxDisplay)
  })

  /** 当前轮播卡片：displayDays[currentIndex]（越界时自动夹取） */
  const currentDay = computed<Day | null>(() => {
    const list = displayDays.value
    if (list.length === 0) return null
    const idx = Math.min(currentIndex.value, list.length - 1)
    return list[idx] ?? null
  })

  // ===== 动作 =====

  /** 添加日子；返回新建的 Day，超过上限返回 null */
  function addDay(input: {
    name: string
    date: string
    category: DayCategory
    note?: string
  }): Day | null {
    if (days.value.length >= LIMITS.maxDays) return null
    const now = new Date().toISOString()
    const note = input.note?.trim()
    const day: Day = {
      id: createId(),
      name: input.name.trim(),
      date: input.date,
      category: input.category,
      note: note ? note : undefined,
      createdAt: now,
      updatedAt: now
    }
    days.value.push(day)
    void persist()
    return day
  }

  /** 更新日子字段，并同步 updatedAt */
  function updateDay(
    id: string,
    patch: Partial<Pick<Day, 'name' | 'date' | 'category' | 'note'>>
  ): void {
    const day = days.value.find((d) => d.id === id)
    if (!day) return
    if (patch.name !== undefined) day.name = patch.name
    if (patch.date !== undefined) day.date = patch.date
    if (patch.category !== undefined) day.category = patch.category
    if (patch.note !== undefined) {
      const trimmed = patch.note.trim()
      day.note = trimmed ? trimmed : undefined
    }
    day.updatedAt = new Date().toISOString()
    void persist()
  }

  /** 删除日子；若删除项在 currentIndex 之前，索引前移以保持当前位置 */
  function removeDay(id: string): void {
    const idx = days.value.findIndex((d) => d.id === id)
    if (idx === -1) return
    days.value.splice(idx, 1)
    if (currentIndex.value > idx) currentIndex.value = Math.max(0, currentIndex.value - 1)
    void persist()
  }

  /** 更新设置项（立即持久化） */
  function updateSettings(patch: Partial<DaySettings>): void {
    settings.value = { ...settings.value, ...patch }
    // maxDisplay 收缩后，currentIndex 可能越界，下一帧 currentDay computed 会夹取
    void persistSettings()
  }

  /** 重置设置为默认值 */
  function resetSettings(): void {
    settings.value = { ...DEFAULT_DAY_SETTINGS }
    void persistSettings()
  }

  // ===== 轮播 =====

  /** 下一个日子（循环） */
  function next(): void {
    const len = displayDays.value.length
    if (len === 0) return
    currentIndex.value = (currentIndex.value + 1) % len
  }

  /** 上一个日子（循环） */
  function prev(): void {
    const len = displayDays.value.length
    if (len === 0) return
    currentIndex.value = (currentIndex.value - 1 + len) % len
  }

  /** 跳转到指定索引（越界忽略） */
  function goTo(index: number): void {
    const len = displayDays.value.length
    if (len === 0 || index < 0 || index >= len) return
    currentIndex.value = index
  }

  // ===== 持久化 =====

  async function persist(): Promise<void> {
    await saveLargeData(STORAGE_KEYS.days, days.value)
  }

  async function persistSettings(): Promise<void> {
    await saveData(STORAGE_KEYS.daysSettings, settings.value)
  }

  /** 自加载 days + settings，并注册 onStorageChange 跨标签同步 */
  async function load(): Promise<void> {
    const [dRaw, sRaw] = await Promise.all([
      loadLargeData<unknown>(STORAGE_KEYS.days),
      loadData<unknown>(STORAGE_KEYS.daysSettings)
    ])
    days.value = normalizeDays(dRaw)
    settings.value = normalizeSettings(sRaw)
    if (currentIndex.value > days.value.length) currentIndex.value = 0
    if (!synced) {
      onStorageChange((changes) => {
        const dChange = changes[STORAGE_KEYS.days]
        if (dChange && dChange.newValue !== undefined) {
          days.value = normalizeDays(dChange.newValue)
          if (currentIndex.value > days.value.length) currentIndex.value = 0
        }
        const sChange = changes[STORAGE_KEYS.daysSettings]
        if (sChange && sChange.newValue !== undefined) {
          settings.value = normalizeSettings(sChange.newValue)
        }
      })
      synced = true
    }
  }

  // 启动时自加载（单例，确保组件随时可读）
  void load()

  return {
    days,
    settings,
    currentIndex,
    sortedDays,
    groupedDays,
    displayDays,
    currentDay,
    addDay,
    updateDay,
    removeDay,
    updateSettings,
    resetSettings,
    next,
    prev,
    goTo,
    persist,
    persistSettings,
    load
  }
})
