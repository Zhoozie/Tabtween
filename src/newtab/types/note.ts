// 笔记数据结构（依据 PRD V0.2 §F5-d）

/** 笔记排序方式 */
export type NoteSortBy = 'updatedAt' | 'createdAt' | 'title'

/** 单条笔记 */
export interface Note {
  /** 笔记唯一标识 */
  id: string
  /** 标题 */
  title: string
  /** 内容 */
  content: string
  /** 创建时间（ISO 字符串） */
  createdAt: string
  /** 最近更新时间（ISO 字符串） */
  updatedAt: string
}

/**
 * 笔记组件设置（PRD V0.2 F10）
 * 独立于全局 Settings，只作用于笔记组件。
 */
export interface NoteSettings {
  /** 自动保存（默认开） */
  autoSave: boolean
  /** 自动保存间隔（秒，范围 1-10，默认 3） */
  saveInterval: number
  /** 显示摘要 */
  showSummary: boolean
  /** 显示更新时间 */
  showTime: boolean
  /** 排序方式（默认更新时间） */
  sortBy: NoteSortBy
  /** 本体显示数量（范围 3-10，默认 3） */
  displayCount: number
}
