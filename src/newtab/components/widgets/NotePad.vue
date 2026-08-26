<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotesStore } from '@/newtab/stores/notes'

const store = useNotesStore()
const { notes, activeNote } = storeToRefs(store)

const title = ref('')
const content = ref('')
let saveTimer: ReturnType<typeof setTimeout> | null = null

// 仅在「活动笔记切换」时同步本地输入框，避免内容更新时回填导致光标跳动
const activeNoteId = computed(() => activeNote.value?.id ?? null)

function syncFromActive() {
  const note = activeNote.value
  title.value = note?.title ?? ''
  content.value = note?.content ?? ''
}

function persistNow() {
  const note = activeNote.value
  if (!note) return
  store.updateNote(note.id, { title: title.value, content: content.value })
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    persistNow()
  }, 400)
}

function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
    persistNow()
  }
}

function selectNote(id: string) {
  if (id === activeNote.value?.id) return
  flushSave()
  store.setActiveId(id)
}

function createNote() {
  flushSave()
  store.createNote()
}

function deleteNote(id: string) {
  store.deleteNote(id)
}

watch(activeNoteId, () => syncFromActive(), { immediate: true })

onUnmounted(() => {
  flushSave()
})
</script>

<template>
  <section
    class="rounded-xl p-4"
    :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }"
  >
    <header class="mb-2 flex items-center justify-between">
      <h3 class="text-base font-medium">笔记</h3>
      <button class="text-xs opacity-60 hover:opacity-100" @click="createNote">+ 新建</button>
    </header>
    <div class="flex gap-3">
      <!-- 笔记列表（仅在多于 1 条时显示） -->
      <ul
        v-if="notes.length > 1"
        class="w-28 shrink-0 space-y-1 overflow-y-auto"
        :style="{ maxHeight: '14rem' }"
      >
        <li
          v-for="n in notes"
          :key="n.id"
          class="group flex cursor-pointer items-center justify-between gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          :class="n.id === activeNote?.id ? 'text-[var(--color-accent)]' : 'opacity-70'"
          @click="selectNote(n.id)"
        >
          <span class="truncate" :title="n.title || '无标题'">{{ n.title || '无标题' }}</span>
          <button
            class="hidden text-xs opacity-50 hover:opacity-100 group-hover:block"
            title="删除"
            @click.stop="deleteNote(n.id)"
          >
            ✕
          </button>
        </li>
      </ul>

      <!-- 编辑区 -->
      <div v-if="activeNote" class="flex-1">
        <input
          v-model="title"
          type="text"
          placeholder="标题"
          class="mb-2 w-full rounded-md border bg-transparent p-1 text-sm outline-none"
          :style="{ borderColor: 'var(--color-border)' }"
          @input="scheduleSave"
        />
        <textarea
          v-model="content"
          rows="6"
          placeholder="随手记录灵感..."
          class="w-full resize-none rounded-md border bg-transparent p-2 text-sm outline-none"
          :style="{ borderColor: 'var(--color-border)' }"
          @input="scheduleSave"
        />
        <div class="mt-1 text-right text-xs opacity-40">自动保存</div>
      </div>
      <div v-else class="flex-1 py-6 text-center text-sm opacity-50">
        暂无笔记，点击「新建」开始
      </div>
    </div>
  </section>
</template>
