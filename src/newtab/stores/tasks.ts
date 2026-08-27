import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Task, TaskFilter, TaskPriority, TaskSettings, TaskSortBy } from '@/newtab/types/task'
import { loadLargeData, onStorageChange, saveLargeData } from '@/newtab/utils/storage'
import { DEFAULT_TASK_SETTINGS, LIMITS, STORAGE_KEYS } from '@/newtab/constant'
import { resolveDefaultDueDate } from '@/newtab/utils/task'

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function isOverdueTask(task: Task): boolean {
  return !!task.dueDate && !task.completed && task.dueDate.slice(0, 10) < todayKey()
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isTaskPriority(v: unknown): v is TaskPriority {
  return v === 'high' || v === 'medium' || v === 'low'
}

function isTaskSortBy(v: unknown): v is TaskSortBy {
  return v === 'priority' || v === 'dueDate' || v === 'createdAt' || v === 'title'
}

/** 规整旧任务数据，补齐缺失字段（tags/updatedAt/completedAt） */
function normalizeTask(t: Partial<Task>): Task {
  return {
    id: String(t.id ?? createId()),
    title: String(t.title ?? ''),
    completed: !!t.completed,
    priority: isTaskPriority(t.priority) ? t.priority : 'medium',
    dueDate: typeof t.dueDate === 'string' && t.dueDate ? t.dueDate : undefined,
    tags: Array.isArray(t.tags) ? t.tags : [],
    note: typeof t.note === 'string' ? t.note : undefined,
    createdAt: t.createdAt ?? new Date().toISOString(),
    updatedAt: t.updatedAt ?? t.createdAt ?? new Date().toISOString(),
    completedAt: t.completedAt
  }
}

function normalizeTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return []
  return raw.map((t) => normalizeTask(t as Partial<Task>))
}

function normalizeTaskSettings(raw: unknown): TaskSettings {
  const value = isPlainObject(raw) ? raw : {}
  return {
    defaultPriority: isTaskPriority(value.defaultPriority)
      ? value.defaultPriority
      : DEFAULT_TASK_SETTINGS.defaultPriority,
    defaultDueDate:
      value.defaultDueDate === 'today' ||
      value.defaultDueDate === 'tomorrow' ||
      value.defaultDueDate === 'threeDays' ||
      value.defaultDueDate === 'oneWeek'
        ? value.defaultDueDate
        : 'today',
    sortBy: isTaskSortBy(value.sortBy) ? value.sortBy : DEFAULT_TASK_SETTINGS.sortBy,
    showCompleted:
      typeof value.showCompleted === 'boolean'
        ? value.showCompleted
        : DEFAULT_TASK_SETTINGS.showCompleted,
    showProgress:
      typeof value.showProgress === 'boolean'
        ? value.showProgress
        : DEFAULT_TASK_SETTINGS.showProgress,
    showPriorityLabel:
      typeof value.showPriorityLabel === 'boolean'
        ? value.showPriorityLabel
        : DEFAULT_TASK_SETTINGS.showPriorityLabel,
    showExpired:
      typeof value.showExpired === 'boolean'
        ? value.showExpired
        : DEFAULT_TASK_SETTINGS.showExpired,
    expiredOnTop:
      typeof value.expiredOnTop === 'boolean'
        ? value.expiredOnTop
        : DEFAULT_TASK_SETTINGS.expiredOnTop,
    showDueDate:
      typeof value.showDueDate === 'boolean'
        ? value.showDueDate
        : DEFAULT_TASK_SETTINGS.showDueDate,
    expiredRetentionDays:
      typeof value.expiredRetentionDays === 'number'
        ? Math.min(30, Math.max(7, Math.round(value.expiredRetentionDays)))
        : DEFAULT_TASK_SETTINGS.expiredRetentionDays
  }
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

function compareDueDate(a: Task, b: Task): number {
  if (!a.dueDate && !b.dueDate) return 0
  if (!a.dueDate) return 1
  if (!b.dueDate) return -1
  return a.dueDate.slice(0, 10).localeCompare(b.dueDate.slice(0, 10))
}

function sortTasks(list: Task[], settings: TaskSettings): Task[] {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1

    if (settings.expiredOnTop) {
      const aOver = isOverdueTask(a)
      const bOver = isOverdueTask(b)
      if (aOver !== bOver) return aOver ? -1 : 1
      if (aOver && bOver) return compareDueDate(a, b)
    }

    switch (settings.sortBy) {
      case 'dueDate':
        return compareDueDate(a, b)
      case 'createdAt':
        return b.createdAt.localeCompare(a.createdAt)
      case 'title':
        return a.title.localeCompare(b.title, 'zh-Hans-CN')
      case 'priority':
      default:
        return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] || compareDueDate(a, b)
    }
  })
}

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const filter = ref<TaskFilter>('all')
  const settings = ref<TaskSettings>(structuredClone(DEFAULT_TASK_SETTINGS))
  let synced = false

  const allTasks = computed(() => sortTasks(tasks.value, settings.value))

  const visibleTasks = computed(() => {
    let list = tasks.value.filter((t) => {
      if (filter.value === 'active') return !t.completed
      if (filter.value === 'completed') return t.completed
      return true
    })
    if (!settings.value.showCompleted) list = list.filter((t) => !t.completed)
    if (!settings.value.showExpired) list = list.filter((t) => !isOverdueTask(t))
    return sortTasks(list, settings.value)
  })

  const activeCount = computed(() => tasks.value.filter((t) => !t.completed).length)
  const completedCount = computed(() => tasks.value.filter((t) => t.completed).length)

  function addTask(title: string, priority?: TaskPriority, dueDate?: string): Task | null {
    const trimmed = title.trim()
    if (!trimmed) return null
    if (tasks.value.length >= LIMITS.maxTasks) return null
    const now = new Date().toISOString()
    const nextPriority = isTaskPriority(priority) ? priority : settings.value.defaultPriority
    const nextDueDate =
      (dueDate && dueDate.trim()) || resolveDefaultDueDate(settings.value.defaultDueDate)
    const task: Task = {
      id: createId(),
      title: trimmed,
      completed: false,
      priority: nextPriority,
      dueDate: nextDueDate,
      tags: [],
      createdAt: now,
      updatedAt: now
    }
    tasks.value.unshift(task)
    void persist()
    return task
  }

  function toggleTask(id: string) {
    const task = tasks.value.find((t) => t.id === id)
    if (!task) return
    task.completed = !task.completed
    task.updatedAt = new Date().toISOString()
    task.completedAt = task.completed ? task.updatedAt : undefined
    void persist()
  }

  /** 更新任务字段（标题/优先级/截止日期/标签/备注），并同步 updatedAt */
  function updateTask(
    id: string,
    patch: Partial<Pick<Task, 'title' | 'priority' | 'dueDate' | 'tags' | 'note'>>
  ) {
    const task = tasks.value.find((t) => t.id === id)
    if (!task) return
    if (patch.title !== undefined && !patch.title.trim()) return
    Object.assign(task, patch)
    task.updatedAt = new Date().toISOString()
    void persist()
  }

  function removeTask(id: string) {
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx === -1) return
    tasks.value.splice(idx, 1)
    void persist()
  }

  function clearCompleted() {
    tasks.value = tasks.value.filter((t) => !t.completed)
    void persist()
  }

  /** 清理超过保留期的已完成过期待办 */
  function pruneExpired() {
    const before = tasks.value.length
    const keepMs = settings.value.expiredRetentionDays * 24 * 60 * 60 * 1000
    const now = Date.now()
    tasks.value = tasks.value.filter((t) => {
      if (!t.completed || !t.dueDate) return true
      const dueMs = new Date(`${t.dueDate.slice(0, 10)}T00:00:00`).getTime()
      return Number.isNaN(dueMs) || now - dueMs <= keepMs
    })
    if (tasks.value.length !== before) void persist()
  }

  function updateSettings(patch: Partial<TaskSettings>) {
    settings.value = {
      ...settings.value,
      ...patch,
      expiredRetentionDays:
        typeof patch.expiredRetentionDays === 'number'
          ? Math.min(30, Math.max(7, Math.round(patch.expiredRetentionDays)))
          : settings.value.expiredRetentionDays
    }
    void saveLargeData(STORAGE_KEYS.tasksSettings, settings.value)
  }

  function setFilter(next: TaskFilter) {
    filter.value = next
  }

  async function persist() {
    await saveLargeData(STORAGE_KEYS.tasks, tasks.value)
  }

  async function load() {
    const [storedTasks, storedSettings] = await Promise.all([
      loadLargeData<unknown>(STORAGE_KEYS.tasks),
      loadLargeData<unknown>(STORAGE_KEYS.tasksSettings)
    ])
    tasks.value = normalizeTasks(storedTasks)
    settings.value = normalizeTaskSettings(storedSettings)
    pruneExpired()
    if (!synced) {
      onStorageChange((changes) => {
        const taskChange = changes[STORAGE_KEYS.tasks]
        if (taskChange !== undefined) {
          tasks.value = normalizeTasks(taskChange.newValue)
        }
        const settingsChange = changes[STORAGE_KEYS.tasksSettings]
        if (settingsChange !== undefined) {
          settings.value = normalizeTaskSettings(settingsChange.newValue)
        }
      })
      synced = true
    }
  }

  return {
    tasks,
    allTasks,
    settings,
    filter,
    visibleTasks,
    activeCount,
    completedCount,
    addTask,
    toggleTask,
    updateTask,
    removeTask,
    clearCompleted,
    pruneExpired,
    updateSettings,
    setFilter,
    persist,
    load
  }
})
