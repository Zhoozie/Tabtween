// 设置数据工具：导入校验 / 默认值合并
import type { CustomEngine, Settings } from '@/newtab/types/settings'
import { DEFAULT_SETTINGS } from '@/newtab/constant/defaults'
import {
  getAllSearchEngines,
  MAX_MINIMAL_ENGINES,
  MAX_VISIBLE_SEARCH_ENGINES,
  isValidSearchEngineUrl
} from '@/newtab/constant/searchEngines'

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** 校验 16 进制颜色（#RGB / #RRGGBB） */
export function isValidHexColor(v: unknown): v is string {
  return typeof v === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)
}

/** 生成唯一 ID（优先使用 crypto.randomUUID，低版本浏览器降级） */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** 校验导入的 JSON 是否为合法的设置对象（顶层为对象即可，分区缺失时自动补齐） */
export function validateSettings(data: unknown): data is Settings {
  return isPlainObject(data)
}

/**
 * 合并导入的设置：与默认值逐分区合并，缺失字段自动补齐。
 * 非法输入（非对象）返回 null。
 */
export function mergeSettings(raw: unknown): Settings | null {
  if (!isPlainObject(raw)) return null
  const appearance = isPlainObject(raw.appearance) ? raw.appearance : {}
  const clock = isPlainObject(raw.clock) ? raw.clock : {}
  const display = isPlainObject(raw.display) ? raw.display : {}
  const search = isPlainObject(raw.search) ? raw.search : {}
  const shortcuts = isPlainObject(raw.shortcuts) ? raw.shortcuts : {}
  const cornerButton = isPlainObject(raw.cornerButton) ? raw.cornerButton : {}
  const customEngines = Array.isArray(search.customEngines)
    ? search.customEngines
        .filter((item): item is Partial<CustomEngine> => isPlainObject(item))
        .map((item) => ({
          id: typeof item.id === 'string' && item.id ? item.id : generateId(),
          name: typeof item.name === 'string' ? item.name.trim() : '',
          url: typeof item.url === 'string' ? item.url.trim() : '',
          icon: typeof item.icon === 'string' ? item.icon.trim().slice(0, 4) : ''
        }))
        .filter((item) => item.name && isValidSearchEngineUrl(item.url))
        .slice(0, MAX_VISIBLE_SEARCH_ENGINES)
    : []
  const searchSettings = { ...DEFAULT_SETTINGS.search, ...search, customEngines }
  if (
    typeof searchSettings.engine !== 'string' ||
    !searchSettings.engine ||
    !getAllSearchEngines(customEngines).some((engine) => engine.id === searchSettings.engine)
  ) {
    searchSettings.engine = DEFAULT_SETTINGS.search.engine
  }
  // minimalEngines：内置引擎不再锁定，按用户保存顺序去重 / 过滤失效 id / 截断到 8
  const all = getAllSearchEngines(customEngines)
  const allIds = new Set(all.map((e) => e.id))
  const seen = new Set<string>()
  const minimalEngines: string[] = []
  // 1) 按用户保存顺序去重 / 过滤失效 id
  if (Array.isArray(search.minimalEngines)) {
    for (const id of search.minimalEngines) {
      if (typeof id !== 'string' || !allIds.has(id) || seen.has(id)) continue
      seen.add(id)
      minimalEngines.push(id)
      if (minimalEngines.length >= MAX_MINIMAL_ENGINES) break
    }
  }
  // 2) 兜底：若列表为空（异常数据），填入第一个内置引擎（保证至少 1 个）
  if (minimalEngines.length === 0) {
    const fallback = all.find((e) => e.builtin)
    if (fallback) minimalEngines.push(fallback.id)
  }
  // 3) 若默认引擎已不在预设列表中，自动设第一个预设引擎为默认
  if (!minimalEngines.includes(searchSettings.engine) && minimalEngines.length > 0) {
    searchSettings.engine = minimalEngines[0]!
  }

  searchSettings.minimalEngines = minimalEngines

  return {
    appearance: { ...DEFAULT_SETTINGS.appearance, ...appearance },
    clock: { ...DEFAULT_SETTINGS.clock, ...clock },
    display: { ...DEFAULT_SETTINGS.display, ...display },
    search: searchSettings,
    shortcuts: { ...DEFAULT_SETTINGS.shortcuts, ...shortcuts },
    cornerButton: { ...DEFAULT_SETTINGS.cornerButton, ...cornerButton }
  }
}
