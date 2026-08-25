// 模式与场景类型定义

/** 大模式：极简 / 标准 */
export type Mode = 'minimal' | 'standard'

/** 标准模式下的场景 */
export type Scene = 'work' | 'study' | 'leisure'

/** 模式状态快照（用于持久化） */
export interface ModeState {
  mode: Mode
  scene: Scene
}

export const MODE_LIST: Mode[] = ['minimal', 'standard']
export const SCENE_LIST: Scene[] = ['work', 'study', 'leisure']

export const SCENE_LABELS: Record<Scene, string> = {
  work: '工作',
  study: '学习',
  leisure: '休闲'
}

export const MODE_LABELS: Record<Mode, string> = {
  minimal: '极简',
  standard: '标准'
}
