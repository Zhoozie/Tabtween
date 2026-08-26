import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Note } from '@/newtab/types/note'
import { loadLargeData, onStorageChange, saveLargeData } from '@/newtab/utils/storage'
import { LIMITS, STORAGE_KEYS } from '@/newtab/constant'

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** 规整旧笔记数据：旧版为单字符串内容，转换为一条笔记 */
function normalizeNotes(raw: unknown): Note[] {
  if (typeof raw === 'string') {
    if (!raw.trim()) return []
    const now = new Date().toISOString()
    return [
      {
        id: createId(),
        title: '快速笔记',
        content: raw,
        tags: [],
        createdAt: now,
        updatedAt: now
      }
    ]
  }
  if (Array.isArray(raw)) {
    return raw.map((n) => {
      const it = n as Partial<Note>
      return {
        id: String(it.id ?? createId()),
        title: String(it.title ?? ''),
        content: String(it.content ?? ''),
        tags: Array.isArray(it.tags) ? it.tags : [],
        createdAt: it.createdAt ?? new Date().toISOString(),
        updatedAt: it.updatedAt ?? it.createdAt ?? new Date().toISOString()
      }
    })
  }
  return []
}

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const activeId = ref<string | null>(null)
  let synced = false

  const activeNote = computed<Note | null>(() => {
    const list = notes.value
    if (list.length === 0) return null
    const id = activeId.value
    if (id) {
      const found = list.find((n) => n.id === id)
      if (found) return found
    }
    return list[0] ?? null
  })

  function createNote(): Note | null {
    if (notes.value.length >= LIMITS.maxNotes) return null
    const now = new Date().toISOString()
    const note: Note = {
      id: createId(),
      title: '',
      content: '',
      tags: [],
      createdAt: now,
      updatedAt: now
    }
    notes.value.unshift(note)
    activeId.value = note.id
    void persist()
    return note
  }

  /** 更新笔记字段（标题/内容/标签），并同步 updatedAt */
  function updateNote(id: string, patch: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) {
    const note = notes.value.find((n) => n.id === id)
    if (!note) return
    Object.assign(note, patch)
    note.updatedAt = new Date().toISOString()
    void persist()
  }

  function deleteNote(id: string) {
    const idx = notes.value.findIndex((n) => n.id === id)
    if (idx === -1) return
    notes.value.splice(idx, 1)
    if (activeId.value === id) {
      activeId.value = notes.value[0]?.id ?? null
    }
    void persist()
  }

  function setActiveId(id: string | null) {
    activeId.value = id
  }

  async function persist() {
    await saveLargeData(STORAGE_KEYS.note, notes.value)
  }

  async function load() {
    const stored = await loadLargeData<unknown>(STORAGE_KEYS.note)
    notes.value = normalizeNotes(stored)
    if (notes.value.length > 0 && !activeId.value) {
      activeId.value = notes.value[0]!.id
    }
    if (!synced) {
      onStorageChange((changes) => {
        const change = changes[STORAGE_KEYS.note]
        if (!change) return
        notes.value = normalizeNotes(change.newValue)
        const exists = notes.value.some((n) => n.id === activeId.value)
        if (!exists) activeId.value = notes.value[0]?.id ?? null
      })
      synced = true
    }
  }

  // 启动时自加载持久化数据（单例自加载，确保搜索等模块随时可读）
  void load()

  return {
    notes,
    activeId,
    activeNote,
    createNote,
    updateNote,
    deleteNote,
    setActiveId,
    persist,
    load
  }
})
