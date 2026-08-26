// 内置搜索命令：输入特定文字执行操作（PRD V0.2 §F4 标准模式专用，极简模式禁用）
import type { Mode, Scene } from '@/newtab/types/mode'

/** 命令动作类型 */
export type CommandAction = 'scene' | 'mode' | 'theme' | 'settings' | 'calc' | 'url' | 'clearHistory'

/** 命令匹配方式：精确 / 前缀 / URL 形态 */
export type CommandMatch = 'exact' | 'prefix' | 'url'

export interface BuiltinCommand {
  /** 触发关键词（url 类型时忽略） */
  keyword: string
  /** 展示标签 */
  label: string
  /** 展示图标 */
  icon: string
  /** 动作类型 */
  action: CommandAction
  /** 匹配方式，默认 exact */
  match?: CommandMatch
  /** 动作附加参数：scene / mode / theme 的目标值 */
  payload?: Scene | Mode | 'light' | 'dark'
  /** 触发后派发的事件名（仅 settings 等场景使用） */
  event?: string
}

export const BUILTIN_COMMANDS: BuiltinCommand[] = [
  { keyword: '工作', label: '切换到工作场景', icon: '💼', action: 'scene', payload: 'work' },
  { keyword: '学习', label: '切换到学习场景', icon: '📚', action: 'scene', payload: 'study' },
  { keyword: '休闲', label: '切换到休闲场景', icon: '🎮', action: 'scene', payload: 'leisure' },
  { keyword: '极简', label: '切换到极简模式', icon: '🌑', action: 'mode', payload: 'minimal' },
  { keyword: '夜间', label: '切换到夜间主题', icon: '🌙', action: 'theme', payload: 'dark' },
  { keyword: '白天', label: '切换到白天主题', icon: '☀️', action: 'theme', payload: 'light' },
  { keyword: '设置', label: '打开设置面板', icon: '⚙️', action: 'settings', event: 'tabtween:open-settings' },
  { keyword: 'settings', label: '打开设置面板', icon: '⚙️', action: 'settings', event: 'tabtween:open-settings' },
  { keyword: '清除历史', label: '清除搜索历史', icon: '🧹', action: 'clearHistory' },
  { keyword: '计算:', label: '快速计算', icon: '🧮', action: 'calc', match: 'prefix' },
  { keyword: 'calc:', label: '快速计算', icon: '🧮', action: 'calc', match: 'prefix' },
  { keyword: '', label: '打开网站', icon: '🌐', action: 'url', match: 'url' }
]
