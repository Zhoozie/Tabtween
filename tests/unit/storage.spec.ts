import { beforeEach, describe, expect, it, vi } from 'vitest'

// storage 工具在非扩展环境降级到 localStorage，便于本地测试
describe('utils/storage (dev fallback)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should save and load data', async () => {
    const { saveData, loadData } = await import('@/newtab/utils/storage')
    await saveData('test.key', { a: 1 })
    const loaded = await loadData<{ a: number }>('test.key')
    expect(loaded).toEqual({ a: 1 })
  })

  it('should return undefined for missing key', async () => {
    const { loadData } = await import('@/newtab/utils/storage')
    const loaded = await loadData('test.missing')
    expect(loaded).toBeUndefined()
  })

  it('should remove data', async () => {
    const { saveData, removeData, loadData } = await import('@/newtab/utils/storage')
    await saveData('test.remove', 'value')
    await removeData('test.remove')
    const loaded = await loadData('test.remove')
    expect(loaded).toBeUndefined()
  })

  it('should handle large data via local', async () => {
    const { saveLargeData, loadLargeData } = await import('@/newtab/utils/storage')
    const big = Array.from({ length: 100 }, (_, i) => i)
    await saveLargeData('test.large', big)
    const loaded = await loadLargeData<number[]>('test.large')
    expect(loaded?.length).toBe(100)
    expect(loaded?.[99]).toBe(99)
  })

  it('isExtensionContext should be false in test env', async () => {
    const { isExtensionContext } = await import('@/newtab/utils/storage')
    expect(isExtensionContext()).toBe(false)
  })
})

// mock chrome.storage 以测试扩展分支
describe('utils/storage (extension context)', () => {
  const store: Record<string, unknown> = {}
  const chromeMock = {
    storage: {
      sync: {
        get: vi.fn((key: string) => Promise.resolve({ [key]: store[key] })),
        set: vi.fn((items: Record<string, unknown>) => {
          Object.assign(store, items)
          return Promise.resolve()
        }),
        remove: vi.fn((key: string) => {
          delete store[key]
          return Promise.resolve()
        })
      },
      local: {
        get: vi.fn((key: string) => Promise.resolve({ [key]: store[key] })),
        set: vi.fn((items: Record<string, unknown>) => {
          Object.assign(store, items)
          return Promise.resolve()
        })
      }
    }
  }

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k])
    vi.resetModules()
    // 注入 chrome 全局
    vi.stubGlobal('chrome', chromeMock)
  })

  it('should use chrome.storage.sync for saveData', async () => {
    const { saveData, loadData } = await import('@/newtab/utils/storage')
    await saveData('ext.key', { x: 1 })
    expect(chromeMock.storage.sync.set).toHaveBeenCalled()
    const loaded = await loadData<{ x: number }>('ext.key')
    expect(loaded).toEqual({ x: 1 })
  })

  it('should use chrome.storage.local for saveLargeData', async () => {
    const { saveLargeData, loadLargeData } = await import('@/newtab/utils/storage')
    await saveLargeData('ext.large', [1, 2, 3])
    expect(chromeMock.storage.local.set).toHaveBeenCalled()
    const loaded = await loadLargeData<number[]>('ext.large')
    expect(loaded).toEqual([1, 2, 3])
  })
})
