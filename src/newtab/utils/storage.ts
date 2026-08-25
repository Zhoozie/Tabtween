// Chrome Storage API 统一封装
// - sync：≤100KB，用于设置、偏好
// - local：≤10MB，用于笔记、任务
// 在 dev 环境（非扩展上下文）自动降级到 localStorage，便于本地调试

const isExtension =
  typeof chrome !== 'undefined' && !!chrome?.storage?.sync && !!chrome?.storage?.local

/** 判断当前是否运行在扩展上下文中 */
export function isExtensionContext(): boolean {
  return isExtension
}

// ===== 同步存储（设置、偏好）=====

export async function saveData<T>(key: string, value: T): Promise<void> {
  if (isExtension) {
    await chrome.storage.sync.set({ [key]: value })
    return
  }
  // dev 降级
  localStorage.setItem(key, JSON.stringify(value))
}

export async function loadData<T>(key: string): Promise<T | undefined> {
  if (isExtension) {
    const result = await chrome.storage.sync.get(key)
    return result[key] as T | undefined
  }
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T) : undefined
}

export async function removeData(key: string): Promise<void> {
  if (isExtension) {
    await chrome.storage.sync.remove(key)
    return
  }
  localStorage.removeItem(key)
}

// ===== 本地存储（笔记、任务等大数据）=====

export async function saveLargeData<T>(key: string, value: T): Promise<void> {
  if (isExtension) {
    await chrome.storage.local.set({ [key]: value })
    return
  }
  localStorage.setItem(key, JSON.stringify(value))
}

export async function loadLargeData<T>(key: string): Promise<T | undefined> {
  if (isExtension) {
    const result = await chrome.storage.local.get(key)
    return result[key] as T | undefined
  }
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T) : undefined
}
