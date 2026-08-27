// 任务相关类型定义（依据 PRD V0.2 §F5-c；静态值见 @/newtab/constant/labels）

export type TaskPriority = 'high' | 'medium' | 'low'

/** 待办排序方式：优先级 / 截止日期 / 创建时间 / 标题 */
export type TaskSortBy = 'priority' | 'dueDate' | 'createdAt' | 'title'

/** 新增待办时默认截止日期 */
export type TaskDefaultDueDate = 'today' | 'tomorrow' | 'threeDays' | 'oneWeek'

export interface Task {
  /** 任务唯一标识 */
  id: string
  /** 任务标题 */
  title: string
  /** 是否完成 */
  completed: boolean
  /** 优先级 */
  priority: TaskPriority
  /** 截止日期（ISO 字符串），可选 */
  dueDate?: string
  /** 任务标签 */
  tags: string[]
  /** 备注，可选 */
  note?: string
  /** 创建时间（ISO 字符串） */
  createdAt: string
  /** 最近更新时间（ISO 字符串） */
  updatedAt: string
  /** 完成时间（ISO 字符串）；未完成或取消完成时为 undefined */
  completedAt?: string
}

/**
 * 待办组件设置（PRD V0.2 F9）
 * 独立于全局 Settings，只作用于待办面板。
 */
export interface TaskSettings {
  /** 新建待办默认优先级 */
  defaultPriority: TaskPriority
  /** 新建待办默认截止日期 */
  defaultDueDate: TaskDefaultDueDate
  /** 列表排序方式 */
  sortBy: TaskSortBy
  /** 显示已完成待办 */
  showCompleted: boolean
  /** 显示底部进度条 */
  showProgress: boolean
  /** 显示优先级标签 */
  showPriorityLabel: boolean
  /** 显示已过期待办 */
  showExpired: boolean
  /** 已过期待办置顶 */
  expiredOnTop: boolean
  /** 显示截止日期 */
  showDueDate: boolean
  /** 过期待办最长保留时间（天） */
  expiredRetentionDays: number
}

export type TaskFilter = 'all' | 'active' | 'completed'
