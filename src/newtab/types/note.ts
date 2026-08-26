// 笔记数据结构（依据 PRD V0.2 §F5-d）

/** 单条笔记 */
export interface Note {
  /** 笔记唯一标识 */
  id: string
  /** 标题 */
  title: string
  /** 内容 */
  content: string
  /** 标签 */
  tags: string[]
  /** 创建时间（ISO 字符串） */
  createdAt: string
  /** 最近更新时间（ISO 字符串） */
  updatedAt: string
}
