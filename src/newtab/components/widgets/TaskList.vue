<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTasksStore } from '@/newtab/stores/tasks'
import { PRIORITY_LABELS, PRIORITY_ORDER, TASK_FILTERS, TASK_FILTER_LABELS } from '@/newtab/constant'
import type { TaskPriority } from '@/newtab/types/task'

const store = useTasksStore()
const { visibleTasks, filter, activeCount } = storeToRefs(store)

const newTitle = ref('')
const newPriority = ref<TaskPriority>('medium')

function add() {
  if (store.addTask(newTitle.value, newPriority.value)) {
    newTitle.value = ''
  }
}

</script>

<template>
  <section
    class="rounded-xl p-4"
    :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }"
  >
    <header class="mb-3 flex items-center justify-between">
      <h3 class="text-base font-medium">待办事项</h3>
      <span class="text-xs opacity-60">{{ activeCount }} 项待办</span>
    </header>

    <!-- 新建任务 -->
    <form class="mb-3 flex gap-2" @submit.prevent="add">
      <input
        v-model="newTitle"
        type="text"
        placeholder="新建任务..."
        class="flex-1 rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none"
        :style="{ borderColor: 'var(--color-border)' }"
      />
      <select
        v-model="newPriority"
        class="rounded-md border bg-transparent px-1 py-1.5 text-xs"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <option v-for="p in PRIORITY_ORDER" :key="p" :value="p">{{ PRIORITY_LABELS[p] }}</option>
      </select>
      <button
        type="submit"
        class="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-[var(--color-on-accent)]"
      >
        添加
      </button>
    </form>

    <!-- 过滤器 -->
    <div class="mb-2 flex gap-1 text-xs">
      <button
        v-for="f in TASK_FILTERS"
        :key="f"
        class="rounded px-2 py-1 transition-colors"
        :class="
          filter === f
            ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
            : 'opacity-60 hover:opacity-100'
        "
        @click="store.setFilter(f)"
      >
        {{ TASK_FILTER_LABELS[f] }}
      </button>
    </div>

    <!-- 任务列表 -->
    <ul class="space-y-1">
      <li
        v-for="task in visibleTasks"
        :key="task.id"
        class="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[var(--color-hover)]"
      >
        <input
          type="checkbox"
          :checked="task.completed"
          class="accent-[var(--color-accent)]"
          @change="store.toggleTask(task.id)"
        />
        <span :class="task.completed ? 'line-through opacity-50' : ''">{{ task.title }}</span>
        <span class="ml-auto text-xs opacity-50">{{ PRIORITY_LABELS[task.priority] }}</span>
        <button
          class="text-xs opacity-40 hover:opacity-100"
          title="删除"
          @click="store.removeTask(task.id)"
        >
          ✕
        </button>
      </li>
    </ul>

    <div v-if="visibleTasks.length === 0" class="py-6 text-center text-sm opacity-50">
      暂无任务，开始添加一个吧
    </div>

    <button
      v-if="activeCount > 0 && filter !== 'completed'"
      class="mt-2 text-xs opacity-50 hover:opacity-100"
      @click="store.clearCompleted()"
    >
      清除已完成
    </button>
  </section>
</template>
