// 设置相关类型定义（依据 PRD V1.0 §2.3 个性化设置 与 PRD V0.2 设置系统）
// 静态映射/默认值见 @/newtab/constant

// ============ 主题 ============
export type ThemeMode = 'light' | 'dark' | 'auto'

// ============ 搜索 ============
export type SearchEngine = 'baidu' | 'google' | 'bing' | 'duckduckgo'
export type SearchEnterBehavior = 'newTab' | 'currentTab'

/** 用户自定义搜索引擎 */
export interface CustomEngine {
  id: string
  name: string
  /** 搜索 URL 模板，用 %s 占位搜索词 */
  url: string
}

/** 自定义搜索命令 */
export interface SearchCommand {
  id: string
  name: string
  /** 触发关键词 */
  keyword: string
  /** 命中后跳转 URL（含 %s）或命令标识 */
  url: string
}

export interface SearchSettings {
  /** 默认搜索引擎 */
  engine: SearchEngine
  /** 用户自定义搜索引擎 */
  customEngines: CustomEngine[]
  /** 搜索建议开关 */
  showSuggestions: boolean
  /** 显示搜索历史 */
  showHistory: boolean
  /** 显示热门搜索 */
  showHot: boolean
  /** 本地内容搜索（工作区内容：笔记/书签/任务） */
  localSearch: boolean
  /** 工作区内容搜索（V0.2，与 localSearch 同义，独立字段以兼容旧版） */
  workspaceContentSearch: boolean
  /** 搜索建议最大数量 */
  suggestionCount: number
  /** 回车行为：新标签页 / 当前页打开 */
  enterBehavior: SearchEnterBehavior
  /** 记录搜索历史 */
  recordHistory: boolean
  /** 隐私搜索模式（不记录历史） */
  privacyMode: boolean
  /** 自定义搜索命令 */
  commands: SearchCommand[]
}

// ============ 时钟 ============
export type ClockStyle = 'digital' | 'minimal' | 'analog'
export type ClockClickAction = 'none' | 'toggleFormat' | 'openSettings'
export type ClockDoubleClickAction = 'none' | 'quickSettings' | 'fullscreen'
/** 时钟大小（V0.2）：小 / 中 / 大 */
export type ClockSize = 'small' | 'medium' | 'large'

export interface ClockSettings {
  visible: boolean
  showDate: boolean
  showWeek: boolean
  showSeconds: boolean
  use24Hour: boolean
  /** 时钟样式 */
  style: ClockStyle
  /** 点击时钟动作 */
  clickAction: ClockClickAction
  /** 双击时钟动作 */
  doubleClickAction: ClockDoubleClickAction
  /** 悬停显示详情 */
  hoverDetail: boolean
  /** 时钟字体（V0.2） */
  clockFont: string
  /** 时钟大小（V0.2） */
  clockSize: ClockSize
  /** 时钟颜色（V0.2，hex） */
  clockColor: string
}

// ============ 显示 ============
export interface DisplaySettings {
  /** 是否显示全局快捷访问 */
  showQuickAccess: boolean
}

// ============ 外观 ============
export type FontSize = 'small' | 'medium' | 'large'
/** 搜索框样式（V1.0）：全圆角 / 小圆角 / 直角 */
export type SearchBoxStyle = 'full' | 'rounded' | 'square'
/** 搜索框样式（V0.2）：全圆角 / 小圆角 / 直角 */
export type SearchBarStyle = 'full' | 'small' | 'square'
/** 布局密度：紧凑 / 标准 / 宽松 */
export type LayoutDensity = 'compact' | 'standard' | 'spacious'

export interface AppearanceSettings {
  theme: ThemeMode
  /** 主题颜色（hex，运行时覆盖 --color-accent） */
  themeColor: string
  /** 字体族 */
  fontFamily: string
  /** 字号 */
  fontSize: FontSize
  /** 搜索框样式（V1.0） */
  searchBoxStyle: SearchBoxStyle
  /** 搜索框样式（V0.2） */
  searchBarStyle: SearchBarStyle
  /** 布局密度 */
  layoutDensity: LayoutDensity
}

// ============ 快捷键 ============
export interface ShortcutSettings {
  focusSearch: string
  openSettings: string
  switchMode: string
  newNote: string
  addTask: string
  quickAccess: string
  toggleTheme: string
  randomBackground: string
}

export type ShortcutKey = keyof ShortcutSettings

// ============ 快捷访问（数据实体，对应 PRD V0.2 §F5-e；区别于上方 ShortcutSettings 快捷键设置） ============

/** 快捷方式（书签卡片） */
export type ShortcutCategory =
  | 'dev'
  | 'work'
  | 'study'
  | 'design'
  | 'news'
  | 'social'
  | 'entertainment'
  | 'shopping'
  | 'life'
  | 'other'

export interface Shortcut {
  /** 唯一标识 */
  id: string
  /** 显示名称 */
  name: string
  /** 链接地址 */
  url: string
  /** 图标（emoji 或图片 URL），可选 */
  icon?: string
  /** 网站分类 */
  category: ShortcutCategory
  /** 显示顺序（升序） */
  order: number
  /** 创建时间（ISO 字符串） */
  createdAt: string
}

// ============ 右上角按钮（PRD §2.5.2） ============
export type CornerButtonVisibility = 'hidden' | 'hover' | 'always'

export interface CornerButtonSettings {
  /** 右上角按钮组可见性 */
  visibility: CornerButtonVisibility
}

// ============ 关于（只读信息） ============
export interface AboutInfo {
  version: string
  changelog: string
  author: string
  repository: string
  license: string
}

// ============ 根 Settings ============
export interface Settings {
  appearance: AppearanceSettings
  clock: ClockSettings
  display: DisplaySettings
  search: SearchSettings
  shortcuts: ShortcutSettings
  cornerButton: CornerButtonSettings
}

// ============ 设置面板 ============
/** 设置面板左侧分类（Settings.vue 导航） */
export type SettingsCategory =
  'appearance' | 'display' | 'search' | 'shortcuts' | 'privacy' | 'about'
