import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Shortcut } from '@/newtab/types/settings'
import { loadData, onStorageChange, saveData } from '@/newtab/utils/storage'
import { DEFAULT_SHORTCUTS, STORAGE_KEYS } from '@/newtab/constant'

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 规整旧快捷方式数据：旧版结构 { id, title, url }（存储在 local），
 * 新版 { id, name, url, icon?, scene, order, createdAt }（存储在 sync）。
 */
function normalizeShortcuts(raw: unknown): Shortcut[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s, i) => {
    const it = s as Partial<Shortcut> & { title?: string }
    return {
      id: String(it.id ?? createId()),
      name: String(it.name ?? it.title ?? ''),
      url: String(it.url ?? ''),
      icon: it.icon,
      scene: it.scene ?? 'work',
      order: typeof it.order === 'number' ? it.order : i,
      createdAt: it.createdAt ?? new Date().toISOString()
    }
  })
}

export const useShortcutsStore = defineStore('shortcuts', () => {
  const shortcuts = ref<Shortcut[]>([])
  let synced = false

  function addShortcut(name: string, url: string): Shortcut | null {
    const trimmedName = name.trim()
    let normalizedUrl = url.trim()
    if (!trimmedName || !normalizedUrl) return null
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`
    }
    const now = new Date().toISOString()
    const item: Shortcut = {
      id: createId(),
      name: trimmedName,
      url: normalizedUrl,
      icon: '🌐',
      scene: 'work',
      order: shortcuts.value.length,
      createdAt: now
    }
    shortcuts.value.push(item)
    void persist()
    return item
  }

  function removeShortcut(id: string) {
    shortcuts.value = shortcuts.value.filter((s) => s.id !== id)
    void persist()
  }

  async function persist() {
    await saveData(STORAGE_KEYS.shortcuts, shortcuts.value)
  }

  async function load() {
    const stored = await loadData<unknown>(STORAGE_KEYS.shortcuts)
    const list = normalizeShortcuts(stored)
    shortcuts.value = list.length > 0 ? list : DEFAULT_SHORTCUTS.map((s) => ({ ...s }))
    if (!synced) {
      onStorageChange((changes) => {
        const change = changes[STORAGE_KEYS.shortcuts]
        if (!change) return
        const next = normalizeShortcuts(change.newValue)
        shortcuts.value = next.length > 0 ? next : DEFAULT_SHORTCUTS.map((s) => ({ ...s }))
      })
      synced = true
    }
  }

  // 启动时自加载持久化数据（单例自加载，确保搜索等模块随时可读）
  void load()

  return {
    shortcuts,
    addShortcut,
    removeShortcut,
    persist,
    load
  }
})
