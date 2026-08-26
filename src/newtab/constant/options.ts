// 设置面板选项列表 / 分类 / 搜索索引 / 文案（供 Settings.vue 使用）
import type {
  ClockClickAction,
  ClockDoubleClickAction,
  ClockSettings,
  ClockSize,
  ClockStyle,
  CornerButtonVisibility,
  FontSize,
  LayoutDensity,
  SearchBarStyle,
  SearchEngine,
  SearchEnterBehavior,
  SearchSettings,
  SettingsCategory,
  ThemeMode
} from '@/newtab/types/settings'
import {
  CLOCK_SIZE_LABELS,
  FONT_SIZE_LABELS,
  LAYOUT_DENSITY_LABELS,
  SEARCH_BAR_STYLE_LABELS,
  SEARCH_ENGINE_LABELS,
  THEME_LABELS
} from './labels'

// ============ 设置面板分类与导航 ============
export interface SettingsCategoryItem {
  id: SettingsCategory
  label: string
  icon: string
}

export const SETTING_CATEGORIES: SettingsCategoryItem[] = [
  { id: 'appearance', label: '外观', icon: '🎨' },
  { id: 'display', label: '显示', icon: '🖥' },
  { id: 'search', label: '搜索设置', icon: '🔍' },
  { id: 'shortcuts', label: '快捷键设置', icon: '⌨' },
  { id: 'privacy', label: '隐私与数据', icon: '🔒' },
  { id: 'about', label: '关于', icon: 'ℹ' }
]

// ============ 设置项搜索索引 ============
export interface SettingSearchEntry {
  category: SettingsCategory
  categoryLabel: string
  label: string
  description: string
}

export const SETTING_SEARCH_INDEX: SettingSearchEntry[] = [
  {
    category: 'appearance',
    categoryLabel: '外观',
    label: '主题模式',
    description: '暗色 / 亮色 / 跟随系统'
  },
  {
    category: 'appearance',
    categoryLabel: '外观',
    label: '主题颜色',
    description: '强调色自定义'
  },
  { category: 'appearance', categoryLabel: '外观', label: '字体', description: '字体族选择' },
  {
    category: 'appearance',
    categoryLabel: '外观',
    label: '字号',
    description: '小 / 中 / 大'
  },
  {
    category: 'appearance',
    categoryLabel: '外观',
    label: '搜索框样式',
    description: '全圆角 / 小圆角 / 直角'
  },
  {
    category: 'appearance',
    categoryLabel: '外观',
    label: '布局密度',
    description: '紧凑 / 标准 / 宽松'
  },
  {
    category: 'appearance',
    categoryLabel: '外观',
    label: '右上角按钮',
    description: '隐藏 / 悬停 / 始终显示'
  },
  {
    category: 'appearance',
    categoryLabel: '外观',
    label: '时钟字体',
    description: '时钟字体族'
  },
  {
    category: 'appearance',
    categoryLabel: '外观',
    label: '时钟大小',
    description: '小 / 中 / 大'
  },
  {
    category: 'appearance',
    categoryLabel: '外观',
    label: '时钟颜色',
    description: '时钟文字颜色'
  },
  {
    category: 'appearance',
    categoryLabel: '外观',
    label: '时钟显示',
    description: '日期 / 星期 / 秒钟 / 24小时制'
  },
  {
    category: 'display',
    categoryLabel: '显示',
    label: '快捷访问',
    description: '显示 / 隐藏全局快捷访问'
  },
  {
    category: 'search',
    categoryLabel: '搜索设置',
    label: '默认搜索引擎',
    description: '百度 / Google / 必应 / DuckDuckGo'
  },
  { category: 'search', categoryLabel: '搜索设置', label: '搜索建议', description: '搜索建议开关' },
  {
    category: 'search',
    categoryLabel: '搜索设置',
    label: '搜索历史',
    description: '显示 / 记录搜索历史'
  },
  {
    category: 'search',
    categoryLabel: '搜索设置',
    label: '热门搜索',
    description: '显示 / 隐藏热门搜索'
  },
  {
    category: 'search',
    categoryLabel: '搜索设置',
    label: '工作区内容搜索',
    description: '笔记 / 书签 / 任务'
  },
  {
    category: 'search',
    categoryLabel: '搜索设置',
    label: '回车行为',
    description: '新标签页 / 当前页打开'
  },
  {
    category: 'search',
    categoryLabel: '搜索设置',
    label: '建议数量',
    description: '搜索建议最大数量'
  },
  {
    category: 'search',
    categoryLabel: '搜索设置',
    label: '快捷命令',
    description: '自定义搜索命令'
  },
  {
    category: 'shortcuts',
    categoryLabel: '快捷键设置',
    label: '快捷键列表',
    description: '点击可自定义'
  },
  {
    category: 'shortcuts',
    categoryLabel: '快捷键设置',
    label: '恢复默认',
    description: '重置全部快捷键'
  },
  {
    category: 'privacy',
    categoryLabel: '隐私与数据',
    label: '清除搜索历史',
    description: '删除本地搜索记录'
  },
  {
    category: 'privacy',
    categoryLabel: '隐私与数据',
    label: '清除所有数据',
    description: '重置全部设置与数据'
  },
  {
    category: 'privacy',
    categoryLabel: '隐私与数据',
    label: '导出设置',
    description: '下载为 JSON 文件'
  },
  {
    category: 'privacy',
    categoryLabel: '隐私与数据',
    label: '导入设置',
    description: '从 JSON 文件恢复'
  },
  { category: 'about', categoryLabel: '关于', label: '版本信息', description: '当前版本号' },
  { category: 'about', categoryLabel: '关于', label: '更新日志', description: '版本变更记录' },
  { category: 'about', categoryLabel: '关于', label: '仓库地址', description: 'GitHub 仓库' },
  { category: 'about', categoryLabel: '关于', label: '开源许可', description: 'MIT' }
]

// ============ 外观选项 ============
export const THEME_OPTIONS: { value: ThemeMode; label: string }[] = (
  ['light', 'dark', 'auto'] as ThemeMode[]
).map((v) => ({ value: v, label: THEME_LABELS[v] }))

export const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = (
  ['small', 'medium', 'large'] as FontSize[]
).map((v) => ({ value: v, label: FONT_SIZE_LABELS[v] }))

export const SEARCH_BAR_STYLE_OPTIONS: { value: SearchBarStyle; label: string }[] = (
  ['full', 'small', 'square'] as SearchBarStyle[]
).map((v) => ({ value: v, label: SEARCH_BAR_STYLE_LABELS[v] }))

export const LAYOUT_DENSITY_OPTIONS: { value: LayoutDensity; label: string }[] = (
  ['compact', 'standard', 'spacious'] as LayoutDensity[]
).map((v) => ({ value: v, label: LAYOUT_DENSITY_LABELS[v] }))

export const CORNER_VISIBILITY_OPTIONS: { value: CornerButtonVisibility; label: string }[] = [
  { value: 'hidden', label: '完全隐藏' },
  { value: 'hover', label: '悬停显示' },
  { value: 'always', label: '始终显示' }
]

// ============ 时钟选项 ============
export const CLOCK_STYLE_OPTIONS: { value: ClockStyle; label: string }[] = [
  { value: 'digital', label: '数字' },
  { value: 'minimal', label: '极简' },
  { value: 'analog', label: '模拟' }
]

export const CLOCK_SIZE_OPTIONS: { value: ClockSize; label: string }[] = (
  ['small', 'medium', 'large'] as ClockSize[]
).map((v) => ({ value: v, label: CLOCK_SIZE_LABELS[v] }))

export const CLICK_ACTION_OPTIONS: { value: ClockClickAction; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'toggleFormat', label: '切换格式' },
  { value: 'openSettings', label: '打开设置' }
]

export const DOUBLE_CLICK_ACTION_OPTIONS: { value: ClockDoubleClickAction; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'quickSettings', label: '快速设置' },
  { value: 'fullscreen', label: '全屏' }
]

/** 时钟布尔开关项（仅含 boolean 字段） */
export const CLOCK_TOGGLES = [
  { key: 'visible' as const, label: '显示时钟' },
  { key: 'showDate' as const, label: '显示日期' },
  { key: 'showWeek' as const, label: '显示星期' },
  { key: 'showSeconds' as const, label: '显示秒钟' },
  { key: 'use24Hour' as const, label: '24小时制' },
  { key: 'hoverDetail' as const, label: '悬停显示详情' }
] satisfies { key: keyof ClockSettings; label: string }[]

// ============ 搜索选项 ============
export const SEARCH_ENGINE_OPTIONS: { value: SearchEngine; label: string }[] = (
  ['baidu', 'google', 'bing', 'duckduckgo'] as SearchEngine[]
).map((v) => ({ value: v, label: SEARCH_ENGINE_LABELS[v] }))

export const ENTER_BEHAVIOR_OPTIONS: { value: SearchEnterBehavior; label: string }[] = [
  { value: 'newTab', label: '新标签页打开' },
  { value: 'currentTab', label: '当前页打开' }
]

/** 搜索布尔开关项 */
export const SEARCH_TOGGLES = [
  { key: 'showSuggestions' as const, label: '搜索建议', description: '输入时展示建议' },
  { key: 'showHistory' as const, label: '搜索历史', description: '展示历史搜索' },
  { key: 'showHot' as const, label: '热门搜索', description: '展示热门搜索' },
  { key: 'localSearch' as const, label: '工作区内容搜索', description: '搜索笔记 / 书签 / 任务' },
  {
    key: 'workspaceContentSearch' as const,
    label: '工作区内容搜索（V0.2）',
    description: '笔记 / 书签 / 任务'
  },
  { key: 'recordHistory' as const, label: '记录搜索历史', description: '保存历史记录' },
  { key: 'privacyMode' as const, label: '隐私搜索模式', description: '不记录历史' }
] satisfies { key: keyof SearchSettings; label: string; description: string }[]

// ============ 隐私与数据 / 快捷命令文案 ============
export const SETTINGS_MESSAGES = {
  /** 清除所有数据确认框 */
  clearAllConfirm: '确定清除所有数据吗？该操作不可撤销，将重置全部设置、任务、笔记与搜索历史。',
  /** 导入文件缺少有效设置 */
  importFormatInvalid: '文件格式无效：缺少有效设置内容',
  /** 导入内容无效 */
  importContentInvalid: '文件内容无效',
  /** 导入 JSON 解析失败 */
  importParseError: '无法解析 JSON 文件',
  /** 新建快捷命令默认名称 */
  newCommandName: '新命令',
  /** 快捷命令关键词前缀（后接序号） */
  commandKeywordPrefix: '命令',
  /** 新建快捷命令默认 URL 模板（%s 为搜索词占位） */
  defaultCommandUrl: 'https://www.google.com/search?q=%s'
} as const
