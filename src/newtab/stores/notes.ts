import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Note, NoteSettings, NoteSortBy } from '@/newtab/types/note'
import { loadLargeData, onStorageChange, saveLargeData } from '@/newtab/utils/storage'
import { DEFAULT_NOTE_SETTINGS, LIMITS, STORAGE_KEYS } from '@/newtab/constant'

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isNoteSortBy(v: unknown): v is NoteSortBy {
  return v === 'updatedAt' || v === 'createdAt' || v === 'title'
}

function normalizeNotes(raw: unknown): Note[] {
  if (typeof raw === 'string') {
    if (!raw.trim()) return []
    const now = new Date().toISOString()
    return [
      {
        id: createId(),
        title: '快速笔记',
        content: raw,
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
        createdAt: it.createdAt ?? new Date().toISOString(),
        updatedAt: it.updatedAt ?? it.createdAt ?? new Date().toISOString()
      }
    })
  }
  return []
}

function normalizeNoteSettings(raw: unknown): NoteSettings {
  const value = isPlainObject(raw) ? raw : {}
  return {
    autoSave: typeof value.autoSave === 'boolean' ? value.autoSave : DEFAULT_NOTE_SETTINGS.autoSave,
    saveInterval:
      typeof value.saveInterval === 'number'
        ? Math.min(10, Math.max(1, Math.round(value.saveInterval)))
        : DEFAULT_NOTE_SETTINGS.saveInterval,
    showSummary:
      typeof value.showSummary === 'boolean'
        ? value.showSummary
        : DEFAULT_NOTE_SETTINGS.showSummary,
    showTime: typeof value.showTime === 'boolean' ? value.showTime : DEFAULT_NOTE_SETTINGS.showTime,
    sortBy: isNoteSortBy(value.sortBy) ? value.sortBy : DEFAULT_NOTE_SETTINGS.sortBy,
    displayCount:
      typeof value.displayCount === 'number'
        ? Math.min(10, Math.max(3, Math.round(value.displayCount)))
        : DEFAULT_NOTE_SETTINGS.displayCount
  }
}

function sortNotes(list: Note[], settings: NoteSettings): Note[] {
  return [...list].sort((a, b) => {
    if (settings.sortBy === 'createdAt') return b.createdAt.localeCompare(a.createdAt)
    if (settings.sortBy === 'title') return a.title.localeCompare(b.title, 'zh-Hans-CN')
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const activeId = ref<string | null>(null)
  const settings = ref<NoteSettings>(structuredClone(DEFAULT_NOTE_SETTINGS))
  let synced = false

  const sortedNotes = computed(() => sortNotes(notes.value, settings.value))
  const displayNotes = computed(() => sortedNotes.value.slice(0, settings.value.displayCount))
  const recentNote = computed(() => sortedNotes.value[0] ?? null)

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

  function createNote(title = '', content = ''): Note | null {
    if (notes.value.length >= LIMITS.maxNotes) return null
    const now = new Date().toISOString()
    const note: Note = {
      id: createId(),
      title: title.trim(),
      content,
      createdAt: now,
      updatedAt: now
    }
    notes.value.unshift(note)
    activeId.value = note.id
    void persist()
    return note
  }

  /** 更新笔记字段（标题/内容），并同步 updatedAt */
  function updateNote(id: string, patch: Partial<Pick<Note, 'title' | 'content'>>) {
    const note = notes.value.find((n) => n.id === id)
    if (!note) return
    if (patch.title !== undefined) note.title = patch.title.trim()
    if (patch.content !== undefined) note.content = patch.content
    note.updatedAt = new Date().toISOString()
    void persist()
  }

  function updateSettings(patch: Partial<NoteSettings>) {
    settings.value = {
      ...settings.value,
      ...patch,
      saveInterval:
        typeof patch.saveInterval === 'number'
          ? Math.min(10, Math.max(1, Math.round(patch.saveInterval)))
          : settings.value.saveInterval,
      displayCount:
        typeof patch.displayCount === 'number'
          ? Math.min(10, Math.max(3, Math.round(patch.displayCount)))
          : settings.value.displayCount
    }
    void saveLargeData(STORAGE_KEYS.noteSettings, settings.value)
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
    const [storedNotes, storedSettings] = await Promise.all([
      loadLargeData<unknown>(STORAGE_KEYS.note),
      loadLargeData<unknown>(STORAGE_KEYS.noteSettings)
    ])
    notes.value = normalizeNotes(storedNotes)
    settings.value = normalizeNoteSettings(storedSettings)
    if (notes.value.length > 0 && !activeId.value) {
      activeId.value = notes.value[0]!.id
    }
    if (!synced) {
      onStorageChange((changes) => {
        const noteChange = changes[STORAGE_KEYS.note]
        if (noteChange !== undefined) {
          notes.value = normalizeNotes(noteChange.newValue)
          const exists = notes.value.some((n) => n.id === activeId.value)
          if (!exists) activeId.value = notes.value[0]?.id ?? null
        }
        const settingsChange = changes[STORAGE_KEYS.noteSettings]
        if (settingsChange !== undefined) {
          settings.value = normalizeNoteSettings(settingsChange.newValue)
        }
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
    sortedNotes,
    displayNotes,
    recentNote,
    settings,
    createNote,
    updateNote,
    deleteNote,
    setActiveId,
    updateSettings,
    persist,
    load
  }
})
