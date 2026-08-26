<script setup lang="ts">
// 列表管理（List Manager）：PRD V0.2 F2-g，添加 / 删除 / 拖拽排序
import { ref } from 'vue'

type ListItem = {
  id: string
  label: string
}

const props = withDefaults(
  defineProps<{
    items: ListItem[]
    addLabel?: string
    emptyText?: string
    disabled?: boolean
  }>(),
  { addLabel: '添加', emptyText: '暂无内容', disabled: false }
)

const emit = defineEmits<{
  add: []
  remove: [id: string]
  reorder: [items: ListItem[]]
}>()

const dragIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)

function onDragStart(index: number) {
  if (props.disabled) return
  dragIndex.value = index
}

function onDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  overIndex.value = index
}

function onDrop(event: DragEvent, index: number) {
  event.preventDefault()
  const from = dragIndex.value
  const to = index
  if (from === null || from === to) {
    dragIndex.value = null
    overIndex.value = null
    return
  }
  const next = [...props.items]
  const [moved] = next.splice(from, 1)
  if (moved) next.splice(to, 0, moved)
  emit('reorder', next)
  dragIndex.value = null
  overIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
  overIndex.value = null
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border" :style="{ borderColor: 'var(--color-border)' }">
    <ul class="divide-y" :style="{ borderColor: 'var(--color-border)' }">
      <li
        v-for="(item, index) in items"
        :key="item.id"
        :draggable="!disabled"
        class="flex cursor-grab items-center justify-between gap-2 px-3 py-2 text-sm transition-colors"
        :style="{
          background:
            dragIndex === index ? 'var(--color-accent-soft)' : 'transparent',
          borderColor: 'var(--color-border)'
        }"
        @dragstart="onDragStart(index)"
        @dragover="onDragOver($event, index)"
        @drop="onDrop($event, index)"
        @dragend="onDragEnd"
      >
        <span class="mr-1 opacity-40">⠿</span>
        <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
        <button
          type="button"
          class="rounded px-1.5 text-sm opacity-50 transition-opacity hover:opacity-100 disabled:opacity-30"
          aria-label="删除"
          :disabled="disabled"
          @click="emit('remove', item.id)"
        >
          ✕
        </button>
      </li>
    </ul>
    <p v-if="items.length === 0" class="px-3 py-3 text-xs opacity-55">{{ emptyText }}</p>
    <button
      type="button"
      class="w-full border-t px-3 py-2 text-left text-sm text-[var(--color-accent)] transition-colors hover:bg-[var(--color-hover)] disabled:opacity-50"
      :style="{ borderColor: 'var(--color-border)' }"
      :disabled="disabled"
      @click="emit('add')"
    >
      + {{ addLabel }}
    </button>
  </div>
</template>
