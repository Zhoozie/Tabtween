// 日子组件类型定义（依据 PRD V0.2 §F7）

/** 日子分类：生日 / 纪念 / 考试 / 工作 / 假期 / 其他 */
export type DayCategory = 'birthday' | 'anniversary' | 'exam' | 'work' | 'holiday' | 'other'

/** 日子排序方式：按日期 / 按创建时间 / 按名称 */
export type DaySortBy = 'date' | 'created' | 'name'

/** 单个日子实体 */
export interface Day {
  /** 唯一标识 */
  id: string
  /** 事件名称 */
  name: string
  /** 日期（'YYYY-MM-DD' 字符串，便于排序与 type=date 输入直通） */
  date: string
  /** 分类 */
  category: DayCategory
  /** 备注（可选） */
  note?: string
  /** 创建时间（ISO 字符串） */
  createdAt: string
  /** 最近更新时间（ISO 字符串） */
  updatedAt: string
}

/**
 * 日子组件设置（存 chrome.storage.sync，跨设备同步）。
 * 独立于全局 Settings，仅作用于本组件。
 */
export interface DaySettings {
  /** 显示已过去的日子（默认 true，关闭后隐藏已过去日子） */
  showExpired: boolean
  /** 卡片 / 列表中显示具体日期（默认 true） */
  showDate: boolean
  /** 列表中显示备注（默认 false） */
  showNote: boolean
  /** 本体轮播最大显示数，范围 1-9（默认 3） */
  maxDisplay: number
  /** 排序方式（默认 'date'） */
  sortBy: DaySortBy
  /** 本体自动轮播（默认 false） */
  autoCarousel: boolean
  /** 自动轮播间隔秒数，范围 3-10（默认 5） */
  carouselInterval: number
}

/** 日子面板左栏导航标签 */
export type DaysNavTab = 'list' | 'add' | 'settings'

/** 日子列表分组：今天 / 即将到来 / 已经过去 */
export type DayGroupKey = 'today' | 'upcoming' | 'past'
