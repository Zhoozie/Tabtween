// 设置数据工具：导入校验 / 默认值合并
import type { Settings } from '@/newtab/types/settings'
import { DEFAULT_SETTINGS } from '@/newtab/constant/defaults'

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
  const search = isPlainObject(raw.search) ? raw.search : {}
  const shortcuts = isPlainObject(raw.shortcuts) ? raw.shortcuts : {}
  const cornerButton = isPlainObject(raw.cornerButton) ? raw.cornerButton : {}
  return {
    appearance: { ...DEFAULT_SETTINGS.appearance, ...appearance },
    clock: { ...DEFAULT_SETTINGS.clock, ...clock },
    search: { ...DEFAULT_SETTINGS.search, ...search },
    shortcuts: { ...DEFAULT_SETTINGS.shortcuts, ...shortcuts },
    cornerButton: { ...DEFAULT_SETTINGS.cornerButton, ...cornerButton }
  }
}
