import type { CustomEngine } from '@/newtab/types/settings'

export interface SearchEngineDefinition {
  id: string
  name: string
  icon: string
  url: string
  builtin: boolean
}

export const MAX_VISIBLE_SEARCH_ENGINES = 8
/** 极简模式下允许选择的搜索引擎最大数量 */
export const MAX_MINIMAL_ENGINES = 8
/** 内置默认搜索引擎 id（不可修改、不可删除） */
export const DEFAULT_ENGINE_ID = 'baidu'
/** 内置搜索引擎 id 集合（只读标识，不参与业务逻辑判断） */
export const BUILTIN_ENGINE_IDS = ['baidu', 'google', 'bing', 'wikipedia'] as const

/** 搜索引擎 URL 最大长度（参考主流浏览器地址栏上限） */
export const SEARCH_ENGINE_URL_MAX_LENGTH = 2048
/** 搜索词占位符（在 URL 中代表用户输入的关键词） */
export const SEARCH_ENGINE_URL_PLACEHOLDER = '%s' as const

/** 内置搜索引擎（只读 · 不可修改 · 不可删除） */
export const BUILTIN_SEARCH_ENGINES: SearchEngineDefinition[] = [
  { id: 'baidu', name: '百度', icon: '百', url: 'https://www.baidu.com/s?wd=%s', builtin: true },
  { id: 'google', name: 'Google', icon: 'G', url: 'https://www.google.com/search?q=%s', builtin: true },
  { id: 'bing', name: '必应', icon: 'B', url: 'https://www.bing.com/search?q=%s', builtin: true },
  { id: 'wikipedia', name: '维基', icon: 'W', url: 'https://zh.wikipedia.org/w/index.php?search=%s', builtin: true }
]

export function getAllSearchEngines(customEngines: CustomEngine[]): SearchEngineDefinition[] {
  const custom = customEngines.map((engine) => ({
    id: engine.id,
    name: engine.name,
    icon: engine.icon || engine.name.slice(0, 1).toUpperCase(),
    url: engine.url,
    builtin: false
  }))
  return [...custom, ...BUILTIN_SEARCH_ENGINES]
}

/**
 * 获取当前可见（标准模式）的搜索引擎列表：
 *  - 自定义引擎在前，内置引擎在后
 *  - 截取前 MAX_VISIBLE_SEARCH_ENGINES 个
 *  - 若当前选中的引擎不在截取范围内，强制包含
 */
export function getSearchEngines(
  customEngines: CustomEngine[],
  selectedId?: string
): SearchEngineDefinition[] {
  const all = getAllSearchEngines(customEngines)
  const visible = all.slice(0, MAX_VISIBLE_SEARCH_ENGINES)
  const selected = selectedId ? all.find((engine) => engine.id === selectedId) : undefined
  if (selected && !visible.some((engine) => engine.id === selected.id)) {
    visible[visible.length - 1] = selected
  }
  return visible
}

/**
 * 获取极简模式下的搜索引擎列表：
 *  - 来源：用户设置中的 minimalEngines（可任意编辑 / 移除内置）
 *  - 仅过滤已失效 id（自定义引擎被删），按用户保存顺序输出
 *  - 若列表为空（异常情况），回退到第一个内置引擎索引（保证至少 1 个）
 *  - 最多 MAX_MINIMAL_ENGINES 个
 */
export function getMinimalEngines(
  customEngines: CustomEngine[],
  minimalEngines: string[]
): SearchEngineDefinition[] {
  const all = getAllSearchEngines(customEngines)
  const allById = new Map(all.map((e) => [e.id, e]))
  // 1) 按用户保存顺序过滤已失效 id
  const filtered = minimalEngines
    .map((id) => allById.get(id))
    .filter((e): e is SearchEngineDefinition => !!e)
    .slice(0, MAX_MINIMAL_ENGINES)
  // 2) 若列表为空，兜底到第一个内置引擎（保证至少 1 个可选项）
  if (filtered.length === 0) {
    const fallback = BUILTIN_SEARCH_ENGINES[0]
    if (fallback) return [fallback]
  }
  return filtered
}

export function getSearchEngine(id: string, customEngines: CustomEngine[]): SearchEngineDefinition {
  return (
    getAllSearchEngines(customEngines).find((engine) => engine.id === id) ??
    BUILTIN_SEARCH_ENGINES[0]!
  )
}

/** 搜索引擎 URL 详细校验的错误码与原因 */
export type SearchEngineUrlErrorCode =
  | 'empty'
  | 'too_long'
  | 'invalid_protocol'
  | 'no_placeholder'
  | 'multi_placeholder'
  | 'invalid_url'
  | 'missing_host'
  | 'invalid_host'

/** 详细校验结果（用于表单错误提示） */
export interface SearchEngineUrlValidation {
  ok: boolean
  code: SearchEngineUrlErrorCode
  /** 给用户看的中文错误提示文案 */
  message: string
}

/**
 * 搜索引擎 URL 详细校验（isValidSearchEngineUrl 的增强版）：
 *  1. 必须是非空字符串
 *  2. 长度 ≤ SEARCH_ENGINE_URL_MAX_LENGTH（2048）
 *  3. 必须以 http:// 或 https:// 开头（大小写不敏感）
 *  4. 必须恰好包含一个 %s 占位符（搜索关键词）
 *  5. 能被原生 URL 解析，且 hostname 非空
 *  6. hostname 必须含「.」或为 localhost / IP
 */
export function validateSearchEngineUrl(value: unknown): SearchEngineUrlValidation {
  if (typeof value !== 'string') {
    return { ok: false, code: 'empty', message: '地址不能为空' }
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return { ok: false, code: 'empty', message: '地址不能为空' }
  }
  if (trimmed.length > SEARCH_ENGINE_URL_MAX_LENGTH) {
    return {
      ok: false,
      code: 'too_long',
      message: `地址长度不能超过 ${SEARCH_ENGINE_URL_MAX_LENGTH} 个字符`
    }
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return {
      ok: false,
      code: 'invalid_protocol',
      message: '地址必须以 http:// 或 https:// 开头'
    }
  }
  // 占位符：必须恰好 1 个
  const placeholders = trimmed.match(/%s/g) ?? []
  if (placeholders.length === 0) {
    return {
      ok: false,
      code: 'no_placeholder',
      message: `地址必须包含 ${SEARCH_ENGINE_URL_PLACEHOLDER} 占位符（代表搜索关键词）`
    }
  }
  if (placeholders.length > 1) {
    return {
      ok: false,
      code: 'multi_placeholder',
      message: `地址中 ${SEARCH_ENGINE_URL_PLACEHOLDER} 占位符只能出现 1 次`
    }
  }
  // 原生 URL 解析
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return { ok: false, code: 'invalid_url', message: '地址格式不合法' }
  }
  if (!url.hostname) {
    return { ok: false, code: 'missing_host', message: '地址缺少主机名' }
  }
  const host = url.hostname
  // 主机名至少要含一个点；允许 localhost / IPv4 / IPv6
  const isLocalhost = host === 'localhost'
  const isIPv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
  const isIPv6 = /^\[?[0-9a-f:]+\]?$/i.test(host) && host.includes(':')
  const hasDot = host.includes('.')
  if (!hasDot && !isLocalhost && !isIPv4 && !isIPv6) {
    return {
      ok: false,
      code: 'invalid_host',
      message: '主机名格式不合法（需为域名 / localhost / IP）'
    }
  }
  return { ok: true, code: 'empty', message: '' }
}

/**
 * 简化的搜索引擎 URL 校验：只返回布尔值（兼容旧调用）。
 * 校验逻辑详见 validateSearchEngineUrl。
 */
export function isValidSearchEngineUrl(value: string): boolean {
  return validateSearchEngineUrl(value).ok
}