<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotesStore } from '@/newtab/stores/notes'
import SettingRadio from '@/newtab/components/settings/SettingRadio.vue'
import SettingSlider from '@/newtab/components/settings/SettingSlider.vue'
import SettingToggle from '@/newtab/components/settings/SettingToggle.vue'
import SvgIcon from '@/newtab/components/common/SvgIcon.vue'
import PanelShell from '@/newtab/components/common/PanelShell.vue'
import PanelNavItem from '@/newtab/components/common/PanelNavItem.vue'
import SettingGroup from '@/newtab/components/settings/SettingGroup.vue'
import { NOTE_SORT_OPTIONS } from '@/newtab/constant'
import type { Note, NoteSortBy } from '@/newtab/types/note'

const store = useNotesStore()
const { notes, displayNotes, recentNote, settings, sortedNotes } = storeToRefs(store)

const panelOpen = ref(false)
const view = ref<'edit' | 'settings'>('edit')
const editingId = ref<string | null>(null)
const quickTitle = ref('')
const isNewDraft = ref(false)

const draftTitle = ref('')
const draftContent = ref('')
let saveTimer: ReturnType<typeof setTimeout> | null = null

const wordCount = computed(() => draftContent.value.length)
const editingNote = computed<Note | null>(() => {
  return notes.value.find((n) => n.id === editingId.value) ?? null
})

function summaryOf(content: string): string {
  const text = content.trim().replace(/\s+/g, ' ')
  return text.length > 50 ? `${text.slice(0, 50)}...` : text
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return '刚刚'
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

function formatExactTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function saveNote(): void {
  if (!editingId.value || !draftContent.value.trim()) return
  store.updateNote(editingId.value, {
    title: draftTitle.value,
    content: draftContent.value
  })
  isNewDraft.value = false
}

function scheduleSave(): void {
  if (!settings.value.autoSave || !draftContent.value.trim()) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    if (draftContent.value.trim()) saveNote()
  }, settings.value.saveInterval * 1000)
}

function flushSave(): void {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (!editingId.value) return
  if (isNewDraft.value && !draftContent.value.trim()) {
    store.deleteNote(editingId.value)
    editingId.value = null
    draftTitle.value = ''
    draftContent.value = ''
    isNewDraft.value = false
    return
  }
  if (draftContent.value.trim()) saveNote()
}

function openEdit(note: Note): void {
  if (note.id === editingId.value) {
    view.value = 'edit'
    panelOpen.value = true
    return
  }
  flushSave()
  editingId.value = note.id
  draftTitle.value = note.title
  draftContent.value = note.content
  isNewDraft.value = false
  store.setActiveId(note.id)
  view.value = 'edit'
  panelOpen.value = true
}

function openPanel(): void {
  if (sortedNotes.value.length > 0) {
    openEdit(sortedNotes.value[0]!)
  } else {
    createDraft('')
  }
}

function openSettings(): void {
  flushSave()
  view.value = 'settings'
  panelOpen.value = true
}

function createDraft(title = ''): Note | null {
  flushSave()
  const note = store.createNote(title, '')
  if (!note) return null
  editingId.value = note.id
  draftTitle.value = note.title
  draftContent.value = ''
  isNewDraft.value = true
  view.value = 'edit'
  panelOpen.value = true
  return note
}

function submitQuick(): void {
  if (createDraft(quickTitle.value)) quickTitle.value = ''
}

function deleteNote(id: string): void {
  const wasEditing = editingId.value === id
  store.deleteNote(id)
  if (wasEditing) {
    const next = notes.value[0]
    if (next) {
      editingId.value = next.id
      draftTitle.value = next.title
      draftContent.value = next.content
      isNewDraft.value = false
    } else {
      editingId.value = null
      draftTitle.value = ''
      draftContent.value = ''
      isNewDraft.value = false
    }
  }
}

function closePanel(): void {
  flushSave()
  panelOpen.value = false
}

function onPanelOpenChange(open: boolean): void {
  if (open) {
    panelOpen.value = true
  } else {
    closePanel()
  }
}

function onSortBy(value: string | number): void {
  if (value === 'updatedAt' || value === 'createdAt' || value === 'title') {
    store.updateSettings({ sortBy: value as NoteSortBy })
  }
}

onUnmounted(() => {
  flushSave()
})
</script>

<template>
  <section
    class="panel-entry-host p-4"
    :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }"
  >
    <header class="mb-3 flex items-center justify-between gap-2">
      <h3 class="text-base font-medium">笔记</h3>
      <div class="flex items-center gap-2">
        <span v-if="notes.length > 0" class="text-xs opacity-60">{{ notes.length }} 篇笔记</span>
        <button
          type="button"
          class="panel-entry-btn flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-hover)]"
          :style="{ color: 'var(--color-text)' }"
          aria-label="打开笔记面板"
          @click="openPanel"
        >
          <SvgIcon name="more" :size="16" label="打开笔记面板" />
        </button>
      </div>
    </header>

    <form class="mb-3 flex gap-2" @submit.prevent="submitQuick">
      <input
        v-model="quickTitle"
        type="text"
        placeholder="新建笔记..."
        class="min-w-0 flex-1 rounded-md border bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
        :style="{ borderColor: 'var(--color-border)' }"
      />
      <button
        type="submit"
        class="rounded-md px-3 py-1.5 text-sm text-[var(--color-on-accent)]"
        :style="{ background: 'var(--color-accent)' }"
      >
        新建
      </button>
    </form>

    <div v-if="displayNotes.length > 0" class="space-y-2">
      <div
        v-for="note in displayNotes"
        :key="note.id"
        class="group cursor-pointer rounded-lg border p-3 transition-colors hover:bg-[var(--color-hover)]"
        :style="{ borderColor: 'var(--color-border)' }"
        @click="openEdit(note)"
      >
        <div class="flex items-start justify-between gap-2">
          <span class="font-medium">{{ note.title || '无标题' }}</span>
          <button
            type="button"
            class="shrink-0 text-xs opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
            title="删除"
            @click.stop="deleteNote(note.id)"
          >
            ✕
          </button>
        </div>
        <p v-if="settings.showSummary && summaryOf(note.content)" class="mt-1 text-xs opacity-60">
          {{ summaryOf(note.content) }}
        </p>
        <div v-if="settings.showTime" class="mt-2 text-xs opacity-45">
          更新于 {{ relativeTime(note.updatedAt) }}
        </div>
      </div>
    </div>

    <div v-else class="py-8 text-center text-sm opacity-50">暂无笔记，点击「新建」开始</div>

    <div class="mt-3 flex items-center justify-between text-xs">
      <span class="truncate opacity-60">最近编辑：{{ recentNote?.title || '暂无笔记' }}</span>
      <button
        type="button"
        class="shrink-0 opacity-60 transition-opacity hover:opacity-100"
        :style="{ color: 'var(--color-accent)' }"
        @click="openPanel"
      >
        查看全部 →
      </button>
    </div>
  </section>

  <PanelShell
    title="笔记"
    width="min(1080px, 96vw)"
    height="min(780px, 90vh)"
    :open="panelOpen"
    @update:open="onPanelOpenChange"
  >
    <aside
      class="flex w-52 shrink-0 flex-col border-r"
      :style="{ borderColor: 'var(--color-border)' }"
    >
      <div class="note-nav min-h-0 flex-1 overflow-y-auto p-2">
        <PanelNavItem
          v-for="note in sortedNotes"
          :key="note.id"
          :label="note.title || '无标题'"
          :active="note.id === editingId"
          @click="openEdit(note)"
        >
          <template #trailing>
            <span
              class="shrink-0 text-xs opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
              title="删除"
              @click.stop="deleteNote(note.id)"
            >
              ✕
            </span>
          </template>
        </PanelNavItem>
        <div v-if="notes.length === 0" class="py-8 text-center text-xs opacity-50">暂无笔记</div>
      </div>

      <div class="flex shrink-0 gap-2 border-t p-2" :style="{ borderColor: 'var(--color-border)' }">
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs text-[var(--color-on-accent)]"
          :style="{ background: 'var(--color-accent)' }"
          @click="createDraft('')"
        >
          ＋ 新建
        </button>
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs"
          :style="{ borderColor: 'var(--color-border)' }"
          @click="openSettings"
        >
          ⚙ 设置
        </button>
      </div>
    </aside>

    <main class="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <template v-if="view === 'edit'">
        <div v-if="editingId" class="flex min-h-0 flex-1 flex-col">
          <div class="shrink-0 px-5 pt-4">
            <input
              v-model="draftTitle"
              type="text"
              class="note-title-input h-11 w-full rounded-lg border bg-transparent px-3 text-base font-medium outline-none transition-colors focus:border-[var(--color-accent)]"
              :style="{ borderColor: 'var(--color-border)' }"
              placeholder="笔记标题"
              @input="scheduleSave"
            />
          </div>

          <div class="min-h-0 flex-1 px-5 py-4">
            <textarea
              v-model="draftContent"
              class="note-content h-full w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
              placeholder="开始记录..."
              @input="scheduleSave"
            ></textarea>
          </div>

          <footer
            class="flex shrink-0 items-center justify-between gap-3 border-t px-5 py-3 text-xs"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <div class="flex min-w-0 flex-wrap items-center gap-2 opacity-60">
              <span>{{ wordCount }}字</span>
              <span v-if="editingNote">创建：{{ formatExactTime(editingNote.createdAt) }}</span>
              <span v-if="editingNote">更新：{{ formatExactTime(editingNote.updatedAt) }}</span>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-md px-4 py-1.5 text-sm text-[var(--color-on-accent)]"
              :style="{ background: 'var(--color-accent)' }"
              @click="saveNote"
            >
              保存
            </button>
          </footer>
        </div>
        <div v-else class="flex flex-1 items-center justify-center text-sm opacity-50">
          暂无笔记，点击左侧「新建」开始
        </div>
      </template>

      <div v-else class="note-settings min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <SettingGroup title="编辑">
          <SettingToggle
            :model-value="settings.autoSave"
            label="自动保存"
            description="输入停止后自动保存笔记"
            @update:model-value="store.updateSettings({ autoSave: $event })"
          />
          <div class="mt-2">
            <p class="mb-1 text-xs opacity-70">保存间隔</p>
            <SettingSlider
              :model-value="settings.saveInterval"
              :min="1"
              :max="10"
              :step="1"
              suffix=" 秒"
              @update:model-value="store.updateSettings({ saveInterval: $event })"
            />
          </div>
        </SettingGroup>

        <SettingGroup title="显示">
          <SettingToggle
            :model-value="settings.showSummary"
            label="显示摘要"
            @update:model-value="store.updateSettings({ showSummary: $event })"
          />
          <SettingToggle
            :model-value="settings.showTime"
            label="显示时间"
            @update:model-value="store.updateSettings({ showTime: $event })"
          />
        </SettingGroup>

        <SettingGroup title="排序">
          <div>
            <p class="mb-1 text-xs opacity-70">排序方式</p>
            <SettingRadio
              :model-value="settings.sortBy"
              :options="NOTE_SORT_OPTIONS"
              @update:model-value="onSortBy"
            />
          </div>
        </SettingGroup>

        <SettingGroup title="本体">
          <div>
            <p class="mb-1 text-xs opacity-70">显示数量</p>
            <SettingSlider
              :model-value="settings.displayCount"
              :min="3"
              :max="10"
              :step="1"
              suffix=" 篇"
              @update:model-value="store.updateSettings({ displayCount: $event })"
            />
          </div>
        </SettingGroup>
      </div>
    </main>
  </PanelShell>
</template>

<style scoped>
.note-content {
  scrollbar-width: thin;
  scrollbar-color: var(--color-scrollbar-thumb) transparent;
}

.note-content::-webkit-scrollbar {
  width: 6px;
}

.note-content::-webkit-scrollbar-track {
  background: transparent;
}

.note-content::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: var(--color-scrollbar-thumb);
}

.note-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-scrollbar-thumb-hover);
}

.note-nav {
  scrollbar-width: thin;
  scrollbar-color: var(--color-scrollbar-thumb) transparent;
}

.note-nav::-webkit-scrollbar {
  width: 6px;
}

.note-nav::-webkit-scrollbar-track {
  background: transparent;
}

.note-nav::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: var(--color-scrollbar-thumb);
}

.note-settings {
  scrollbar-width: thin;
  scrollbar-color: var(--color-scrollbar-thumb) transparent;
}

.note-settings::-webkit-scrollbar {
  width: 6px;
}

.note-settings::-webkit-scrollbar-track {
  background: transparent;
}

.note-settings::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: var(--color-scrollbar-thumb);
}

.note-settings::-webkit-scrollbar-thumb:hover {
  background: var(--color-scrollbar-thumb-hover);
}
</style>
