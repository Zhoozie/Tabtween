// 时间格式化工具

const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export interface ClockParts {
  /** 主体时间，如 "14:30" 或 "02:30 PM" */
  main: string
  /** 秒（可选），如 ":08" */
  seconds: string
  /** 日期，如 "2026-08-24" */
  date: string
  /** 星期，如 "周一" */
  week: string
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
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
    const period = hours < 12 ? 'AM' : 'PM'
    const h12 = hours % 12 === 0 ? 12 : hours % 12
    main = `${pad(h12)}:${pad(minutes)} ${period}`
  }

  return {
    main,
    seconds: `:${pad(seconds)}`,
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    week: WEEK_LABELS[date.getDay()] ?? ''
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
