// 模式与场景类型定义（静态值见 @/newtab/constant/labels）

/** 大模式：极简 / 标准 */
export type Mode = 'minimal' | 'standard'

/** 标准模式下的场景 */
export type Scene = 'work' | 'study' | 'leisure'

/** 模式状态快照（用于持久化） */
export interface ModeState {
  mode: Mode
  scene: Scene
}
