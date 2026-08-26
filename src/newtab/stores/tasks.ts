import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Task, TaskFilter, TaskPriority } from '@/newtab/types/task'
import { loadLargeData, onStorageChange, saveLargeData } from '@/newtab/utils/storage'
import { LIMITS, STORAGE_KEYS } from '@/newtab/constant'

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** 规整旧任务数据，补齐缺失字段（tags/updatedAt/completedAt） */
function normalizeTask(t: Partial<Task>): Task {
  return {
    id: String(t.id ?? createId()),
    title: String(t.title ?? ''),
    completed: !!t.completed,
    priority: t.priority ?? 'medium',
    dueDate: t.dueDate,
    tags: Array.isArray(t.tags) ? t.tags : [],
    note: t.note,
    createdAt: t.createdAt ?? new Date().toISOString(),
    updatedAt: t.updatedAt ?? t.createdAt ?? new Date().toISOString(),
    completedAt: t.completedAt
  }
}

function normalizeTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return []
  return raw.map((t) => normalizeTask(t as Partial<Task>))
}

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const filter = ref<TaskFilter>('all')
  let synced = false

  const visibleTasks = computed(() => {
    switch (filter.value) {
      case 'active':
        return tasks.value.filter((t) => !t.completed)
      case 'completed':
        return tasks.value.filter((t) => t.completed)
      default:
        return tasks.value
    }
  })

  const activeCount = computed(() => tasks.value.filter((t) => !t.completed).length)

  function addTask(title: string, priority: TaskPriority = 'medium'): Task | null {
    const trimmed = title.trim()
    if (!trimmed) return null
    if (tasks.value.length >= LIMITS.maxTasks) return null
    const now = new Date().toISOString()
    const task: Task = {
      id: createId(),
      title: trimmed,
      completed: false,
      priority,
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

  function setFilter(next: TaskFilter) {
    filter.value = next
  }

  async function persist() {
    await saveLargeData(STORAGE_KEYS.tasks, tasks.value)
  }

  async function load() {
    const stored = await loadLargeData<unknown>(STORAGE_KEYS.tasks)
    tasks.value = normalizeTasks(stored)
    if (!synced) {
      onStorageChange((changes) => {
        const change = changes[STORAGE_KEYS.tasks]
        if (!change) return
        tasks.value = normalizeTasks(change.newValue)
      })
      synced = true
    }
  }

  return {
    tasks,
    filter,
    visibleTasks,
    activeCount,
    addTask,
    toggleTask,
    updateTask,
    removeTask,
    clearCompleted,
    setFilter,
    persist,
    load
  }
})
