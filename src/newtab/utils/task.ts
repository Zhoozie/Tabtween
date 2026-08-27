import type { TaskDefaultDueDate } from '@/newtab/types/task'

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

export function addDaysIso(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

const DEFAULT_DUE_OFFSETS: Record<TaskDefaultDueDate, number> = {
  today: 0,
  tomorrow: 1,
  threeDays: 3,
  oneWeek: 7
}

export function resolveDefaultDueDate(option: TaskDefaultDueDate): string {
  return addDaysIso(DEFAULT_DUE_OFFSETS[option])
}

export function formatDisplayDate(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!m) return isoDate
  return `${m[3]}/${m[2]}/${m[1]}`
}

export function parseDisplayDate(value: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim())
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (day < 1 || day > 31 || month < 1 || month > 12) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return toIsoDate(date)
}
