// 任务相关类型定义

export type TaskPriority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  completed: boolean
  priority: TaskPriority
  /** ISO 字符串，可选 */
  dueDate?: string
  createdAt: string
}

export type TaskFilter = 'all' | 'active' | 'completed'

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: '高',
  medium: '中',
  low: '低'
}

export const PRIORITY_ORDER: TaskPriority[] = ['high', 'medium', 'low']
