import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Task, TaskFilter, TaskPriority } from '@/newtab/types/task'
import { saveLargeData, loadLargeData } from '@/newtab/utils/storage'

const STORAGE_KEY = 'tabtween.tasks'
const MAX_TASKS = 100

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const filter = ref<TaskFilter>('all')

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
    if (tasks.value.length >= MAX_TASKS) return null
    const task: Task = {
      id: createId(),
      title: trimmed,
      completed: false,
      priority,
      createdAt: new Date().toISOString()
    }
    tasks.value.unshift(task)
    void persist()
    return task
  }

  function toggleTask(id: string) {
    const task = tasks.value.find((t) => t.id === id)
    if (!task) return
    task.completed = !task.completed
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
    await saveLargeData(STORAGE_KEY, tasks.value)
  }

  async function load() {
    const stored = await loadLargeData<Task[]>(STORAGE_KEY)
    if (stored) tasks.value = stored
  }

  return {
    tasks,
    filter,
    visibleTasks,
    activeCount,
    addTask,
    toggleTask,
    removeTask,
    clearCompleted,
    setFilter,
    load
  }
})
