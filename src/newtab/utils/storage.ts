// Chrome Storage API 统一封装（依据 PRD V0.2 §F5-a）
// - sync：≤100KB，用于设置、偏好、搜索历史、快捷方式
// - local：≤10MB，用于笔记、任务
// 在 dev 环境（非扩展上下文）自动降级到 localStorage，便于本地调试
// 所有操作包裹 try/catch，存储失败仅 console.warn，不影响调用方

import { STORAGE_KEYS } from '@/newtab/constant/storage'

const isExtension =
  typeof chrome !== 'undefined' && !!chrome?.storage?.sync && !!chrome?.storage?.local

/** 判断当前是否运行在扩展上下文中 */
export function isExtensionContext(): boolean {
  return isExtension
}

/** 存储区域：sync（自动跨设备同步）或 local（仅本机） */
export type StorageAreaName = 'sync' | 'local'

/** 单个 key 的变化信息 */
export interface StorageChange {
  /** 旧值（缺失时为 undefined） */
  oldValue?: unknown
  /** 新值（被删除时为 undefined） */
  newValue?: unknown
}

/** chrome.storage.onChanged 回调签名 */
export type StorageChangeCallback = (
  changes: Record<string, StorageChange>,
  areaName: StorageAreaName
) => void

// ===== 内部：按 area 读写 =====

function getArea(area: StorageAreaName): chrome.storage.StorageArea {
  return area === 'sync' ? chrome.storage.sync : chrome.storage.local
}

async function rawGet<T>(area: StorageAreaName, key: string): Promise<T | undefined> {
  try {
    if (isExtension) {
      const result = await getArea(area).get(key)
      return result[key] as T | undefined
    }
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch (e) {
    console.warn(`[storage] 读取失败 (${area}/${key}):`, e)
    return undefined
  }
}

async function rawSet<T>(area: StorageAreaName, key: string, value: T): Promise<void> {
  try {
    if (isExtension) {
      await getArea(area).set({ [key]: value })
      return
    }
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn(`[storage] 写入失败 (${area}/${key}):`, e)
  }
}

async function rawRemove(area: StorageAreaName, key: string): Promise<void> {
  try {
    if (isExtension) {
      await getArea(area).remove(key)
      return
    }
    localStorage.removeItem(key)
  } catch (e) {
    console.warn(`[storage] 删除失败 (${area}/${key}):`, e)
  }
}

// ===== 同步存储（设置、偏好、搜索历史、快捷方式）=====

export async function saveData<T>(key: string, value: T): Promise<void> {
  await rawSet('sync', key, value)
}

export async function loadData<T>(key: string): Promise<T | undefined> {
  return rawGet<T>('sync', key)
}

export async function removeData(key: string): Promise<void> {
  await rawRemove('sync', key)
}

// ===== 本地存储（笔记、任务等大数据）=====

export async function saveLargeData<T>(key: string, value: T): Promise<void> {
  await rawSet('local', key, value)
}

export async function loadLargeData<T>(key: string): Promise<T | undefined> {
  return rawGet<T>('local', key)
}

// ===== 批量读写（PRD §F5-a 操作类型：批量读取 / 批量写入）=====

/** 批量写入：一次写入多个 key → value */
export async function saveMany(
  area: StorageAreaName,
  items: Record<string, unknown>
): Promise<void> {
  try {
    if (isExtension) {
      await getArea(area).set(items)
      return
    }
    for (const [k, v] of Object.entries(items)) {
      localStorage.setItem(k, JSON.stringify(v))
    }
  } catch (e) {
    console.warn(`[storage] 批量写入失败 (${area}):`, e)
  }
}

/** 批量读取：一次读取多个 key，返回 key → value 映射 */
export async function loadMany<T = unknown>(
  area: StorageAreaName,
  keys: string[]
): Promise<Record<string, T>> {
  try {
    if (isExtension) {
      const result = await getArea(area).get(keys)
      return result as Record<string, T>
    }
    const out: Record<string, T> = {}
    for (const k of keys) {
      const raw = localStorage.getItem(k)
      if (raw) out[k] = JSON.parse(raw) as T
    }
    return out
  } catch (e) {
    console.warn(`[storage] 批量读取失败 (${area}):`, e)
    return {}
  }
}

/** 批量删除 */
export async function removeMany(area: StorageAreaName, keys: string[]): Promise<void> {
  try {
    if (isExtension) {
      await getArea(area).remove(keys)
      return
    }
    keys.forEach((k) => localStorage.removeItem(k))
  } catch (e) {
    console.warn(`[storage] 批量删除失败 (${area}):`, e)
  }
}

// ===== 默认值兜底（PRD §F5-a：无数据时返回默认值）=====

/** 读取单个 key，无数据时返回传入默认值 */
export async function loadWithDefault<T>(
  area: StorageAreaName,
  key: string,
  defaultValue: T
): Promise<T> {
  const value = await rawGet<T>(area, key)
  return value === undefined ? defaultValue : value
}

// ===== 监听变化（PRD §F5-a 操作类型：监听变化；跨标签同步）=====

/**
 * 注册 chrome.storage.onChanged 监听器。
 * - 扩展上下文：监听 chrome.storage.onChanged（跨标签页触发）
 * - dev 上下文：降级监听 window 'storage' 事件（跨同源标签页触发）
 * - 均不可用时返回 no-op
 * 返回取消监听函数。
 */
export function onStorageChange(callback: StorageChangeCallback): () => void {
  if (isExtension && chrome.storage.onChanged) {
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: chrome.storage.AreaName
    ) => {
      callback(changes, areaName as StorageAreaName)
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    const parse = (v: string | null): unknown => {
      if (v === null) return undefined
      try {
        return JSON.parse(v) as unknown
      } catch {
        return v
      }
    }
    const handler = (e: StorageEvent) => {
      if (!e.key) return
      callback(
        { [e.key]: { oldValue: parse(e.oldValue), newValue: parse(e.newValue) } },
        'local'
      )
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }
  return () => {}
}

// ===== 数据清理（隐私与数据）=====

/**
 * 清除全部持久化数据。
 * @param area 仅清除指定区域；不传则同时清除 sync 与 local
 */
export async function clearAllData(area?: StorageAreaName): Promise<void> {
  const keys = Object.values(STORAGE_KEYS)
  try {
    if (isExtension) {
      if (!area || area === 'sync') await chrome.storage.sync.remove(keys)
      if (!area || area === 'local') await chrome.storage.local.remove(keys)
      return
    }
    keys.forEach((k) => localStorage.removeItem(k))
  } catch (e) {
    console.warn('[storage] 清除失败:', e)
  }
}
