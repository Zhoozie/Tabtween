// 任务相关类型定义（依据 PRD V0.2 §F5-c；静态值见 @/newtab/constant/labels）

export type TaskPriority = 'high' | 'medium' | 'low'

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

export type TaskFilter = 'all' | 'active' | 'completed'
