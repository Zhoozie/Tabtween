<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTasksStore } from '@/newtab/stores/tasks'
import SettingRadio from '@/newtab/components/settings/SettingRadio.vue'
import SettingSlider from '@/newtab/components/settings/SettingSlider.vue'
import SettingToggle from '@/newtab/components/settings/SettingToggle.vue'
import SvgIcon from '@/newtab/components/common/SvgIcon.vue'
import TaskDateInput from '@/newtab/components/widgets/TaskDateInput.vue'
import PanelShell from '@/newtab/components/common/PanelShell.vue'
import PanelNavItem from '@/newtab/components/common/PanelNavItem.vue'
import SettingGroup from '@/newtab/components/settings/SettingGroup.vue'
import {
  formatDisplayDate,
  parseDisplayDate,
  resolveDefaultDueDate,
  todayIso
} from '@/newtab/utils/task'
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  TASK_DEFAULT_DUE_OPTIONS,
  TASK_FILTERS,
  TASK_FILTER_LABELS,
  TASK_SORT_OPTIONS
} from '@/newtab/constant'
import type { Task, TaskDefaultDueDate, TaskPriority } from '@/newtab/types/task'

const store = useTasksStore()
const { allTasks, settings, filter, visibleTasks, activeCount, completedCount } = storeToRefs(store)

const panelOpen = ref(false)
type PanelView = 'list' | 'edit' | 'settings'
const view = ref<PanelView>('list')
const editingId = ref<string | null>(null)

const addTitle = ref('')
const addPriority = ref<TaskPriority>(store.settings.defaultPriority)
const addDueDate = ref(formatDisplayDate(resolveDefaultDueDate(store.settings.defaultDueDate)))
const addError = ref('')

const formTitle = ref('')
const formPriority = ref<TaskPriority>('medium')
const formDueDate = ref('')
const formNote = ref('')

watch(
  () => store.settings.defaultPriority,
  (value) => {
    addPriority.value = value
  }
)

watch(
  () => store.settings.defaultDueDate,
  (value) => {
    addDueDate.value = formatDisplayDate(resolveDefaultDueDate(value))
  }
)

const PRIORITY_OPTIONS = PRIORITY_ORDER.map((value) => ({
  value,
  label: PRIORITY_LABELS[value]
}))

const totalCount = computed(() => store.tasks.length)
const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

function openPanel(next: PanelView = 'list'): void {
  view.value = next
  panelOpen.value = true
}

function closePanel(): void {
  panelOpen.value = false
}

function onPanelOpenChange(open: boolean): void {
  if (open) {
    panelOpen.value = true
  } else {
    closePanel()
  }
}

function submitAdd(): void {
  const dueDate = parseDisplayDate(addDueDate.value)
  if (!dueDate || dueDate < todayIso()) {
    addError.value = '截止日期不能早于今天'
    return
  }
  const created = store.addTask(addTitle.value, addPriority.value, dueDate)
  if (created) {
    addTitle.value = ''
    addDueDate.value = formatDisplayDate(resolveDefaultDueDate(store.settings.defaultDueDate))
    addError.value = ''
  }
}

function openEdit(task: Task): void {
  editingId.value = task.id
  formTitle.value = task.title
  formPriority.value = task.priority
  formDueDate.value = task.dueDate
    ? formatDisplayDate(task.dueDate)
    : formatDisplayDate(resolveDefaultDueDate(store.settings.defaultDueDate))
  formNote.value = task.note ?? ''
  view.value = 'edit'
  panelOpen.value = true
}

function saveEdit(): void {
  if (!editingId.value) return
  store.updateTask(editingId.value, {
    title: formTitle.value,
    priority: formPriority.value,
    dueDate: parseDisplayDate(formDueDate.value) ?? undefined,
    note: formNote.value.trim() || undefined
  })
  closePanel()
}

function deleteEdit(): void {
  if (!editingId.value) return
  store.removeTask(editingId.value)
  closePanel()
}

type DueTone = 'danger' | 'warning' | 'normal'

interface DueInfo {
  text: string
  tone: DueTone
}

function dueInfo(task: Task): DueInfo | null {
  if (!task.dueDate || task.completed || !settings.value.showDueDate) return null
  const due = new Date(`${task.dueDate.slice(0, 10)}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (Number.isNaN(diff)) return null
  if (diff < 0) return { text: `已过期 ${Math.abs(diff)} 天`, tone: 'danger' }
  if (diff === 0) return { text: '今天', tone: 'danger' }
  if (diff === 1) return { text: '明天', tone: 'warning' }
  return { text: task.dueDate.slice(0, 10), tone: 'normal' }
}

function priorityStyle(priority: TaskPriority): Record<string, string> {
  if (priority === 'high') {
    return { color: 'var(--color-danger)', background: 'var(--color-danger-soft)' }
  }
  if (priority === 'medium') {
    return { color: 'var(--color-today)', background: 'var(--color-hover)' }
  }
  return { color: 'var(--color-text-muted)', background: 'var(--color-hover)' }
}

function dueStyle(tone: DueTone): { color?: string; opacity?: number } {
  if (tone === 'danger') return { color: 'var(--color-danger)' }
  if (tone === 'warning') return { color: 'var(--color-today)' }
  return { opacity: 0.65 }
}

function onSortBy(value: string | number): void {
  if (value === 'priority' || value === 'dueDate' || value === 'createdAt' || value === 'title') {
    store.updateSettings({ sortBy: value })
  }
}
</script>

<template>
  <section
    class="task-card panel-entry-host p-4"
    :style="{ borderRadius: 'var(--radius-component)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }"
  >
    <header class="mb-3 flex items-center justify-between gap-2">
      <h3 class="text-base font-medium">待办事项</h3>
      <div class="flex items-center gap-2">
        <span class="text-xs opacity-60">{{ activeCount }} 项待办</span>
        <button
          type="button"
          class="expand-btn panel-entry-btn flex h-7 w-7 items-center justify-center rounded-md transition-colors"
          :style="{ color: 'var(--color-text)' }"
          aria-label="打开待办面板"
          @click="openPanel('list')"
        >
          <SvgIcon name="more" :size="16" label="打开待办面板" />
        </button>
      </div>
    </header>

    <form class="mb-3 flex flex-wrap gap-2" @submit.prevent="submitAdd">
      <input
        v-model="addTitle"
        type="text"
        placeholder="添加待办..."
        class="min-w-0 flex-1 rounded-md border bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
        :style="{ borderColor: 'var(--color-border)' }"
      />
      <TaskDateInput v-model="addDueDate" class="w-44" />
      <select
        v-model="addPriority"
        class="rounded-md border bg-transparent px-2 py-1.5 text-xs outline-none"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <option v-for="p in PRIORITY_ORDER" :key="p" :value="p">{{ PRIORITY_LABELS[p] }}</option>
      </select>
      <button
        type="submit"
        class="rounded-md px-3 py-1.5 text-sm text-[var(--color-on-accent)] transition-colors"
        :style="{ borderRadius: 'var(--radius-component)', background: 'var(--color-accent)' }"
      >
        新建
      </button>
    </form>
    <p v-if="addError" class="mb-2 text-xs" :style="{ color: 'var(--color-danger)' }">
      {{ addError }}
    </p>

    <div class="mb-2 flex gap-1 text-xs">
      <button
        v-for="f in TASK_FILTERS"
        :key="f"
        type="button"
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

    <ul v-if="visibleTasks.length > 0" class="space-y-1">
      <li
        v-for="task in visibleTasks"
        :key="task.id"
        class="task-item group flex items-start gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[var(--color-hover)]"
        @click="openEdit(task)"
      >
        <button
          type="button"
          class="task-check mt-0.5 shrink-0 text-[15px] leading-none transition-transform active:scale-90"
          :style="{ color: task.completed ? 'var(--color-accent)' : 'var(--color-text)' }"
          :aria-label="task.completed ? '标记为未完成' : '标记为已完成'"
          @click.stop="store.toggleTask(task.id)"
        >
          {{ task.completed ? '☑' : '☐' }}
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span
              :class="{ 'line-through opacity-50': task.completed }"
              class="min-w-0 break-words"
            >
              {{ task.title }}
            </span>
            <span
              v-if="settings.showPriorityLabel"
              class="rounded px-1.5 py-0.5 text-[11px] leading-none"
              :style="priorityStyle(task.priority)"
            >
              [{{ PRIORITY_LABELS[task.priority] }}]
            </span>
          </div>
          <div v-if="dueInfo(task)" class="mt-0.5 text-xs" :style="dueStyle(dueInfo(task)!.tone)">
            {{ dueInfo(task)!.text }}
          </div>
        </div>
        <button
          type="button"
          class="mt-0.5 shrink-0 text-xs opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
          title="删除"
          @click.stop="store.removeTask(task.id)"
        >
          ✕
        </button>
      </li>
    </ul>

    <div v-else class="py-8 text-center text-sm opacity-50">暂无待办，开始添加一个吧</div>

    <div v-if="settings.showProgress" class="mt-4">
      <div class="h-1.5 overflow-hidden rounded-full" :style="{ borderRadius: 'var(--radius-component)', background: 'var(--color-hover)' }">
        <div
          class="h-full rounded-full transition-[width] duration-300"
          :style="{ width: `${progressPercent}%`, background: 'var(--color-accent)' }"
        ></div>
      </div>
      <div class="mt-1.5 flex items-center justify-between text-xs">
        <span class="opacity-60"
          >进度：{{ completedCount }}/{{ totalCount }} ({{ progressPercent }}%)</span
        >
        <button
          type="button"
          class="opacity-60 transition-opacity hover:opacity-100"
          :style="{ color: 'var(--color-accent)' }"
          @click="openPanel('list')"
        >
          查看全部 →
        </button>
      </div>
    </div>
  </section>

  <PanelShell :open="panelOpen" title="待办事项" @update:open="onPanelOpenChange">
    <nav
      class="w-40 shrink-0 border-r py-2"
      :style="{ borderColor: 'var(--color-border)' }"
      aria-label="待办面板导航"
    >
      <PanelNavItem label="待办" icon="📋" :active="view === 'list'" @click="openPanel('list')" />
      <PanelNavItem
        label="设置"
        icon="⚙"
        :active="view === 'settings'"
        @click="openPanel('settings')"
      />
    </nav>

    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div v-if="view === 'list'" class="task-scroll flex-1 overflow-y-auto px-4 py-4 text-sm">
        <ul class="space-y-1">
          <li
            v-for="task in allTasks"
            :key="task.id"
            class="group flex items-start gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--color-hover)]"
            @click="openEdit(task)"
          >
            <button
              type="button"
              class="mt-0.5 shrink-0 text-[15px] leading-none"
              :style="{
                color: task.completed ? 'var(--color-accent)' : 'var(--color-text)'
              }"
              @click.stop="store.toggleTask(task.id)"
            >
              {{ task.completed ? '☑' : '☐' }}
            </button>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span :class="{ 'line-through opacity-50': task.completed }">{{ task.title }}</span>
                <span
                  v-if="settings.showPriorityLabel"
                  class="rounded px-1.5 py-0.5 text-[11px] leading-none"
                  :style="priorityStyle(task.priority)"
                >
                  [{{ PRIORITY_LABELS[task.priority] }}]
                </span>
              </div>
              <div
                v-if="dueInfo(task)"
                class="mt-0.5 text-xs"
                :style="dueStyle(dueInfo(task)!.tone)"
              >
                {{ dueInfo(task)!.text }}
              </div>
            </div>
          </li>
        </ul>
        <div v-if="allTasks.length === 0" class="py-10 text-center text-sm opacity-50">
          暂无待办
        </div>
      </div>

      <div v-else-if="view === 'edit'" class="task-scroll flex-1 overflow-y-auto px-5 py-4">
        <div class="mb-4">
          <label class="mb-1 block text-xs opacity-60">标题 *</label>
          <input v-model="formTitle" type="text" class="form-input" placeholder="待办标题" />
        </div>
        <div class="mb-4">
          <label class="mb-1 block text-xs opacity-60">优先级</label>
          <SettingRadio
            :model-value="formPriority"
            :options="PRIORITY_OPTIONS"
            @update:model-value="formPriority = $event as TaskPriority"
          />
        </div>
        <div class="mb-4">
          <label class="mb-1 block text-xs opacity-60">截止日期</label>
          <TaskDateInput v-model="formDueDate" class="w-full" />
        </div>
        <div class="mb-4">
          <label class="mb-1 block text-xs opacity-60">备注（可选）</label>
          <textarea
            v-model="formNote"
            rows="5"
            class="form-input resize-none"
            placeholder="补充任务备注..."
          ></textarea>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-primary flex-1 rounded-md py-2 text-sm text-[var(--color-on-accent)]"
            :style="{ borderRadius: 'var(--radius-component)', background: 'var(--color-accent)' }"
            @click="saveEdit"
          >
            保存
          </button>
          <button
            type="button"
            class="flex-1 rounded-md border py-2 text-sm opacity-70"
            :style="{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }"
            @click="deleteEdit"
          >
            删除
          </button>
        </div>
      </div>

      <div v-else class="task-scroll flex-1 overflow-y-auto px-5 py-4">
        <SettingGroup title="默认">
          <div class="mb-3">
            <p class="mb-1 text-xs opacity-70">默认优先级</p>
            <SettingRadio
              :model-value="settings.defaultPriority"
              :options="PRIORITY_OPTIONS"
              @update:model-value="
                store.updateSettings({ defaultPriority: $event as TaskPriority })
              "
            />
          </div>
          <div>
            <p class="mb-1 text-xs opacity-70">新待办截止日期</p>
            <SettingRadio
              :model-value="settings.defaultDueDate"
              :options="TASK_DEFAULT_DUE_OPTIONS"
              @update:model-value="
                store.updateSettings({ defaultDueDate: $event as TaskDefaultDueDate })
              "
            />
          </div>
        </SettingGroup>

        <SettingGroup title="排序">
          <div>
            <p class="mb-1 text-xs opacity-70">排序方式</p>
            <SettingRadio
              :model-value="settings.sortBy"
              :options="TASK_SORT_OPTIONS"
              @update:model-value="onSortBy"
            />
          </div>
        </SettingGroup>

        <SettingGroup title="显示">
          <SettingToggle
            :model-value="settings.showCompleted"
            label="显示已完成"
            @update:model-value="store.updateSettings({ showCompleted: $event })"
          />
          <SettingToggle
            :model-value="settings.showProgress"
            label="显示进度条"
            @update:model-value="store.updateSettings({ showProgress: $event })"
          />
          <SettingToggle
            :model-value="settings.showPriorityLabel"
            label="显示优先级标签"
            @update:model-value="store.updateSettings({ showPriorityLabel: $event })"
          />
          <SettingToggle
            :model-value="settings.showExpired"
            label="显示已过期"
            @update:model-value="store.updateSettings({ showExpired: $event })"
          />
          <SettingToggle
            :model-value="settings.expiredOnTop"
            label="已过期置顶"
            @update:model-value="store.updateSettings({ expiredOnTop: $event })"
          />
          <SettingToggle
            :model-value="settings.showDueDate"
            label="显示截止日期"
            @update:model-value="store.updateSettings({ showDueDate: $event })"
          />
        </SettingGroup>

        <SettingGroup title="数据">
          <div>
            <p class="mb-1 text-xs opacity-70">过期待办最长保留时间</p>
            <SettingSlider
              :model-value="settings.expiredRetentionDays"
              :min="7"
              :max="30"
              :step="1"
              suffix=" 天"
              @update:model-value="store.updateSettings({ expiredRetentionDays: $event })"
            />
          </div>
        </SettingGroup>
      </div>
    </div>
  </PanelShell>
</template>

<style scoped>
.task-item {
  cursor: pointer;
}

.expand-btn:hover {
  background: var(--color-hover);
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  font-size: 0.8125rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  border-color: var(--color-accent);
}

.task-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--color-scrollbar-thumb) transparent;
}

.task-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.task-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.task-scroll::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: var(--color-scrollbar-thumb);
}

.task-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--color-scrollbar-thumb-hover);
}
</style>

