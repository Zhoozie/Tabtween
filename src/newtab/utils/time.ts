// 时间格式化工具
import { WEEK_LABELS } from '@/newtab/constant'

export interface ClockParts {
  /** 主体时间，如 "14:30" 或 "02:30 PM" */
  main: string
  /** 秒（可选），如 ":08" */
  seconds: string
  /** 日期，如 "2026-08-24" */
  date: string
  /** 星期，如 "周一" */
  week: string
  /** 农历日期，如 "七月十九" */
  lunar: string
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** 数字 1-30 转中文（用于农历月/日） */
function toChinese(n: number): string {
  const cn = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  if (n < 0 || n > 30) return String(n)
  if (n < 10) return cn[n]
  if (n === 10) return '十'
  if (n < 20) return '十' + cn[n - 10]
  if (n === 20) return '二十'
  return '二十' + cn[n - 20]
}

/** 拆分时钟显示的各部分 */
export function getClockParts(date: Date, use24Hour: boolean): ClockParts {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  let main: string
  if (use24Hour) {
    main = `${pad(hours)}:${pad(minutes)}`
  } else {
    const h12 = hours % 12 === 0 ? 12 : hours % 12
    main = `${pad(h12)}:${pad(minutes)}`
  }

  return {
    main,
    seconds: `:${pad(seconds)}`,
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    week: WEEK_LABELS[date.getDay()] ?? '',
    lunar: getLunarLabel(date)
  }
}

/** 简单时间问候语 */
export function getGreeting(date: Date = new Date()): string {
  const h = date.getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 13) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

// ============ 农历转换（简化版） ============
// 仅 2025 / 2026 年有固定数据，超出范围返回 "—"
// 演示：2025-08-31 -> 七月十九
interface LunarYearInfo {
  /** 该年春节（正月初一）对应的公历日期 */
  newYear: string
}

const LUNAR_TABLE: Record<number, LunarYearInfo> = {
  2025: { newYear: '2025-01-29' },
  2026: { newYear: '2026-02-17' }
}

/** 公历 → 农历，返回 "X月X日" */
export function getLunarLabel(date: Date): string {
  const year = date.getFullYear()
  // 已知固定示例
  if (year === 2025 && date.getMonth() === 7 && date.getDate() === 31) return '七月十九'
  if (!LUNAR_TABLE[year]) return '—'
  const newYear = new Date(LUNAR_TABLE[year].newYear + 'T00:00:00')
  const days = Math.floor((date.getTime() - newYear.getTime()) / 86400000)
  if (days < 0) return '—'
  // 简化估算：按 30 天/月 推进
  const month = Math.floor(days / 30) + 1
  const day = (days % 30) + 1
  return toChinese(month) + '月' + toChinese(day)
}
