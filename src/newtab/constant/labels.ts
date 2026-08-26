// 标签 / 图标 / 有序列表等静态映射
import type { Mode, Scene } from '@/newtab/types/mode'
import type { TaskFilter, TaskPriority } from '@/newtab/types/task'
import type { DayCategory, DayGroupKey, DaySortBy, DaysNavTab } from '@/newtab/types/day'
import type { PomodoroTab } from '@/newtab/types/pomodoro'
import type { FirstDayOfWeek } from '@/newtab/types/calendar'
import type {
  ClockSize,
  FontSize,
  LayoutDensity,
  SearchBarStyle,
  SearchBoxStyle,
  SearchEngine,
  ShortcutCategory,
  ShortcutKey,
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

// ============ 场景搜索占位符（SearchBar） ============
export const SCENE_PLACEHOLDER: Record<Scene, string> = {
  work: '搜索工作内容...',
  study: '搜索学习资料...',
  leisure: '搜索...'
}

// ============ 任务筛选（TaskList） ============
export const TASK_FILTERS: TaskFilter[] = ['all', 'active', 'completed']

export const TASK_FILTER_LABELS: Record<TaskFilter, string> = {
  all: '全部',
  active: '进行中',
  completed: '完成'
}

// ============ 番茄钟面板标签（PomodoroTimer） ============
export const POMODORO_TABS: { id: PomodoroTab; label: string; icon: string }[] = [
  { id: 'timer', label: '计时', icon: '⏱' },
  { id: 'stats', label: '统计', icon: '📊' },
  { id: 'settings', label: '设置', icon: '⚙' }
]

// ============ 日子面板导航 / 分组标签（DaysWidget） ============
export const DAYS_NAV_TABS: { id: DaysNavTab; label: string; icon: string }[] = [
  { id: 'list', label: '全部', icon: '📋' },
  { id: 'add', label: '添加', icon: '➕' },
  { id: 'settings', label: '设置', icon: '⚙' }
]

export const DAY_GROUP_LABELS: Record<DayGroupKey, string> = {
  today: '今天',
  upcoming: '即将到来',
  past: '已经过去'
}

// ============ 周首日选项（CalendarPanel） ============
export const FIRST_DAY_OPTIONS: { value: FirstDayOfWeek; label: string }[] = [
  { value: 'sunday', label: '周日' },
  { value: 'monday', label: '周一' }
]

// ============ 快捷键标签（Settings） ============
export const SHORTCUT_LABELS: Record<ShortcutKey, string> = {
  focusSearch: '聚焦搜索',
  openSettings: '打开设置',
  switchMode: '切换模式',
  newNote: '新建笔记',
  addTask: '添加任务',
  quickAccess: '快捷访问',
  toggleTheme: '切换主题',
  randomBackground: '随机背景'
}

export const SHORTCUT_KEYS: ShortcutKey[] = Object.keys(SHORTCUT_LABELS) as ShortcutKey[]

// ============ 快捷访问网站分类 ============
export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  'dev',
  'work',
  'study',
  'design',
  'news',
  'social',
  'entertainment',
  'shopping',
  'life',
  'other'
]

export const SHORTCUT_CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  dev: '开发技术',
  work: '办公效率',
  study: '学习参考',
  design: '设计灵感',
  news: '新闻资讯',
  social: '社交社区',
  entertainment: '娱乐影音',
  shopping: '购物生活',
  life: '生活方式',
  other: '其他'
}

export const SHORTCUT_CATEGORY_ICONS: Record<ShortcutCategory, string> = {
  dev: '💻',
  work: '⚡',
  study: '📚',
  design: '🎨',
  news: '📰',
  social: '💬',
  entertainment: '🎬',
  shopping: '🛍',
  life: '🌿',
  other: '📌'
}
