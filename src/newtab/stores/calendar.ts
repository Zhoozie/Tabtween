import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { CalendarSettings, FirstDayOfWeek } from '@/newtab/types/calendar'
import { DEFAULT_CALENDAR_SETTINGS } from '@/newtab/constant/defaults'
import { STORAGE_KEYS } from '@/newtab/constant/storage'
import { WEEK_LABELS } from '@/newtab/constant/labels'
import { saveData, loadData, onStorageChange } from '@/newtab/utils/storage'

// 日历 store：widget 与面板共享查看状态 + 设置持久化
// 依据 PRD V0.2 §F8 工作场景日历组件

export interface CalendarCell {
  date: string // 'YYYY-MM-DD'
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  weekday: number // 0=周日
  weekNumber?: number // ISO 周数（showWeekNumbers 开启时填充）
}

/** 'YYYY-MM-DD' 格式化（本地时区，避免 UTC 偏移） */
function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** ISO 周数计算 */
function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/** 旧设置数据迁移补字段 */
function normalizeSettings(raw: unknown): CalendarSettings {
  const fallback = { ...DEFAULT_CALENDAR_SETTINGS }
  if (raw && typeof raw === 'object') {
    const r = raw as Partial<CalendarSettings>
    if (r.firstDayOfWeek === 'sunday' || r.firstDayOfWeek === 'monday') {
      fallback.firstDayOfWeek = r.firstDayOfWeek
    }
    if (typeof r.showWeekNumbers === 'boolean') fallback.showWeekNumbers = r.showWeekNumbers
    if (typeof r.showTodayMarker === 'boolean') fallback.showTodayMarker = r.showTodayMarker
    if (typeof r.showTaskMarkers === 'boolean') fallback.showTaskMarkers = r.showTaskMarkers
  }
  return fallback
}

export const useCalendarStore = defineStore('calendar', () => {
  const today = new Date()
  const todayStr = formatDate(today)

  // 当前查看的年月
  const viewYear = ref(today.getFullYear())
  const viewMonth = ref(today.getMonth()) // 0-11

  // 选中的日期
  const selectedDate = ref(todayStr)

  // 设置
  const settings = ref<CalendarSettings>({ ...DEFAULT_CALENDAR_SETTINGS })

  // 弹出面板开关
  const panelOpen = ref(false)

  // 周首日偏移（0=周日，1=周一）
  const firstDayOffset = computed(() => (settings.value.firstDayOfWeek === 'sunday' ? 0 : 1))

  // 按周首日排序的星期标签
  const orderedWeekdays = computed<string[]>(() => {
    const off = firstDayOffset.value
    return off === 0 ? WEEK_LABELS : [...WEEK_LABELS.slice(off), ...WEEK_LABELS.slice(0, off)]
  })

  // 生成 6 周 × 7 天 = 42 格日历
  const cells = computed<CalendarCell[]>(() => {
    const first = new Date(viewYear.value, viewMonth.value, 1)
    const offset = (first.getDay() - firstDayOffset.value + 7) % 7
    const gridStart = new Date(viewYear.value, viewMonth.value, 1 - offset)
    const out: CalendarCell[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      const ds = formatDate(d)
      out.push({
        date: ds,
        day: d.getDate(),
        isCurrentMonth: d.getMonth() === viewMonth.value,
        isToday: settings.value.showTodayMarker && ds === todayStr,
        isSelected: ds === selectedDate.value,
        weekday: d.getDay(),
        weekNumber: settings.value.showWeekNumbers ? getISOWeekNumber(d) : undefined
      })
    }
    return out
  })

  // 月份导航标签
  const monthLabel = computed(() => `${viewYear.value}年${viewMonth.value + 1}月`)

  // 月份背景水印文本
  const bgMonthText = computed(() => `${viewMonth.value + 1}`)

  // 选中日期的可读描述
  const selectedInfo = computed(() => {
    const [y, m, d] = selectedDate.value.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return {
      text: `${y}年${m}月${d}日 ${WEEK_LABELS[dt.getDay()]}`,
      isToday: selectedDate.value === todayStr
    }
  })

  function prevMonth() {
    if (viewMonth.value === 0) {
      viewMonth.value = 11
      viewYear.value--
    } else {
      viewMonth.value--
    }
  }

  function nextMonth() {
    if (viewMonth.value === 11) {
      viewMonth.value = 0
      viewYear.value++
    } else {
      viewMonth.value++
    }
  }

  function goToday() {
    viewYear.value = today.getFullYear()
    viewMonth.value = today.getMonth()
    selectedDate.value = todayStr
  }

  function selectDate(date: string) {
    selectedDate.value = date
  }

  function openPanel() {
    panelOpen.value = true
  }

  function closePanel() {
    panelOpen.value = false
  }

  function updateSettings(patch: Partial<CalendarSettings>) {
    settings.value = { ...settings.value, ...patch }
    void persist()
  }

  function updateFirstDayOfWeek(value: FirstDayOfWeek) {
    settings.value = { ...settings.value, firstDayOfWeek: value }
    void persist()
  }

  async function persist() {
    await saveData(STORAGE_KEYS.calendarSettings, settings.value)
  }

  async function load() {
    const stored = await loadData<unknown>(STORAGE_KEYS.calendarSettings)
    settings.value = normalizeSettings(stored)
    onStorageChange((changes) => {
      const change = changes[STORAGE_KEYS.calendarSettings]
      if (change && change.newValue !== undefined) {
        settings.value = normalizeSettings(change.newValue)
      }
    })
  }

  void load()

  return {
    today,
    todayStr,
    viewYear,
    viewMonth,
    selectedDate,
    settings,
    panelOpen,
    firstDayOffset,
    orderedWeekdays,
    cells,
    monthLabel,
    bgMonthText,
    selectedInfo,
    prevMonth,
    nextMonth,
    goToday,
    selectDate,
    openPanel,
    closePanel,
    updateSettings,
    updateFirstDayOfWeek
  }
})
