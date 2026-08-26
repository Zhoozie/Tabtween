// 标签 / 图标 / 有序列表等静态映射
import type { Mode, Scene } from '@/newtab/types/mode'
import type { TaskPriority } from '@/newtab/types/task'
import type { DayCategory, DaySortBy } from '@/newtab/types/day'
import type {
  ClockSize,
  FontSize,
  LayoutDensity,
  SearchBarStyle,
  SearchBoxStyle,
  SearchEngine,
  ThemeMode
} from '@/newtab/types/settings'

// ============ 星期 ============
export const WEEK_LABELS: string[] = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// ============ 主题 ============
export const THEME_ICONS: Record<ThemeMode, string> = {
  light: '☀',
  dark: '☾',
  auto: '◐'
}

export const THEME_LABELS: Record<ThemeMode, string> = {
  light: '亮色',
  dark: '暗色',
  auto: '跟随系统'
}

// ============ 模式与场景 ============
export const MODE_LIST: Mode[] = ['minimal', 'standard']
export const SCENE_LIST: Scene[] = ['work', 'study', 'leisure']

export const MODE_LABELS: Record<Mode, string> = {
  minimal: '极简',
  standard: '标准'
}

export const SCENE_LABELS: Record<Scene, string> = {
  work: '工作',
  study: '学习',
  leisure: '休闲'
}

// ============ 任务优先级 ============
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: '高',
  medium: '中',
  low: '低'
}

export const PRIORITY_ORDER: TaskPriority[] = ['high', 'medium', 'low']

// ============ 搜索引擎 ============
export const SEARCH_ENGINE_URL: Record<SearchEngine, string> = {
  baidu: 'https://www.baidu.com/s?wd=',
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q='
}

export const SEARCH_ENGINE_LABELS: Record<SearchEngine, string> = {
  baidu: '百度',
  google: 'Google',
  bing: '必应',
  duckduckgo: 'DuckDuckGo'
}

// 搜索引擎 chips（PRD V0.2 §F4 输入态切换引擎）：从 SEARCH_ENGINE_LABELS 派生
export const SEARCH_ENGINE_CHIPS: { engine: SearchEngine; label: string }[] = (
  Object.keys(SEARCH_ENGINE_LABELS) as SearchEngine[]
).map((engine) => ({ engine, label: SEARCH_ENGINE_LABELS[engine] }))

// ============ 外观 ============
export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  small: '小',
  medium: '中',
  large: '大'
}

export const SEARCH_BOX_STYLE_LABELS: Record<SearchBoxStyle, string> = {
  full: '全圆角',
  rounded: '小圆角',
  square: '直角'
}

export const LAYOUT_DENSITY_LABELS: Record<LayoutDensity, string> = {
  compact: '紧凑',
  standard: '标准',
  spacious: '宽松'
}

// 搜索框样式（V0.2）
export const SEARCH_BAR_STYLE_LABELS: Record<SearchBarStyle, string> = {
  full: '全圆角',
  small: '小圆角',
  square: '直角'
}

// 时钟大小（V0.2）
export const CLOCK_SIZE_LABELS: Record<ClockSize, string> = {
  small: '小',
  medium: '中',
  large: '大'
}

// 时钟颜色预设（V0.2）
export const CLOCK_COLOR_PRESETS: string[] = [
  '#ffffff', // 白
  '#9ca3af', // 灰
  '#1f2024', // 黑
  '#3b82f6', // 蓝
  '#10b981', // 翠绿
  '#f59e0b', // 琥珀
  '#ef4444', // 红
  '#8b5cf6' // 紫
]

// 时钟 / 主题字体下拉选项（V0.2）
export const CLOCK_FONT_OPTIONS: { value: string; label: string }[] = [
  { value: 'system-ui', label: '系统默认' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Courier New", monospace', label: 'Courier New' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: '"Roboto Mono", monospace', label: 'Roboto Mono' }
]

// 预设主题颜色（供颜色选择器使用）
export const ACCENT_COLOR_PRESETS: string[] = [
  '#6366f1', // 靛蓝（默认）
  '#0ea5e9', // 天蓝
  '#10b981', // 翠绿
  '#f59e0b', // 琥珀
  '#ef4444', // 红
  '#ec4899', // 粉
  '#8b5cf6', // 紫
  '#64748b' // 石板灰
]

// ============ 日子分类（V0.2 §F7）============
export const DAY_CATEGORY_LABELS: Record<DayCategory, { icon: string; label: string }> = {
  birthday: { icon: '🎂', label: '生日' },
  anniversary: { icon: '💕', label: '纪念' },
  exam: { icon: '🎓', label: '考试' },
  work: { icon: '💼', label: '工作' },
  holiday: { icon: '🎉', label: '假期' },
  other: { icon: '📅', label: '其他' }
}

/** 分类 chip 顺序（默认选中 other） */
export const DAY_CATEGORY_LIST: DayCategory[] = [
  'birthday',
  'anniversary',
  'exam',
  'work',
  'holiday',
  'other'
]

// ============ 日子排序方式（V0.2 §F7）============
export const DAY_SORT_BY_LABELS: Record<DaySortBy, string> = {
  date: '日期',
  created: '创建时间',
  name: '名称'
}

export const DAY_SORT_BY_OPTIONS: { value: DaySortBy; label: string }[] = (
  Object.keys(DAY_SORT_BY_LABELS) as DaySortBy[]
).map((value) => ({ value, label: DAY_SORT_BY_LABELS[value] }))
