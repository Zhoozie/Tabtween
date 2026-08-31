<script setup lang="ts">
// 字体选择下拉框：左侧显示字体名称，右侧显示字体预览
import { onMounted, onUnmounted, ref, computed } from 'vue'

export interface FontOption {
  value: string
  label: string
  /** 字体 CSS 族，用于预览；未提供时使用 value */
  fontFamily?: string
  /** 该选项独立的预览文本 */
  previewText?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: FontOption[]
    placeholder?: string
    disabled?: boolean
    /** 全局预览文本（可被 option.previewText 覆盖） */
    previewText?: string
  }>(),
  { placeholder: '请选择', disabled: false, previewText: 'Aa' }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const activeIndex = ref(-1)
const dropdownStyle = ref<{ top: number; left: number; width: number }>({
  top: 0,
  left: 0,
  width: 200
})

const currentLabel = computed(
  () => props.options.find((o) => o.value === props.modelValue)?.label ?? props.placeholder
)

function getFontFamily(opt: FontOption): string {
  return opt.fontFamily ?? opt.value
}

function getPreviewText(opt: FontOption): string {
  return opt.previewText ?? props.previewText
}

function updatePosition() {
  const el = triggerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const top = spaceBelow > 240 ? rect.bottom + 6 : Math.max(8, rect.top - 6)
  dropdownStyle.value = { top, left: rect.left, width: rect.width }
}

function toggle() {
  if (props.disabled) return
  if (open.value) {
    open.value = false
    return
  }
  updatePosition()
  activeIndex.value = props.options.findIndex((o) => o.value === props.modelValue)
  open.value = true
}

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target as Node
  if (triggerRef.value?.contains(target)) return
  if (dropdownRef.value?.contains(target)) return
  open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!open.value) {
      updatePosition()
      open.value = true
      return
    }
    const len = props.options.length
    const delta = event.key === 'ArrowDown' ? 1 : -1
    activeIndex.value = (activeIndex.value + delta + len) % len
    return
  }
  if (event.key === 'Enter') {
    if (open.value && activeIndex.value >= 0) {
      const opt = props.options[activeIndex.value]
      if (opt) select(opt.value)
    } else {
      updatePosition()
      open.value = true
    }
    return
  }
  if (event.key === 'Escape') {
    open.value = false
  }
}

function onScrollOrResize() {
  if (open.value) updatePosition()
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentClick)
  window.addEventListener('resize', onScrollOrResize)
  window.addEventListener('scroll', onScrollOrResize, true)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocumentClick)
  window.removeEventListener('resize', onScrollOrResize)
  window.removeEventListener('scroll', onScrollOrResize, true)
})
</script>

<template>
  <div ref="triggerRef" class="relative" @keydown="onKeydown">
    <button
      type="button"
      :disabled="disabled"
      class="flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm transition-colors disabled:opacity-50"
      :style="{ borderColor: 'var(--color-border)' }"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="truncate">{{ currentLabel }}</span>
      <span
        class="text-xs opacity-60 transition-transform duration-200"
        :style="{ transform: open ? 'rotate(180deg)' : 'none' }"
        >▼</span
      >
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="dropdownRef"
        class="fixed z-[60] max-h-60 min-w-[14rem] overflow-y-auto rounded-lg py-1 shadow-lg"
        :style="{
          top: dropdownStyle.top + 'px',
          left: dropdownStyle.left + 'px',
          width: dropdownStyle.width + 'px',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-border) transparent'
        }"
      >
        <button
          v-for="(opt, idx) in options"
          :key="String(opt.value)"
          type="button"
          class="flex w-full items-center justify-between px-3 py-2 text-sm transition-colors"
          :style="{
            color: modelValue === opt.value ? 'var(--color-accent)' : 'var(--color-text)',
            background:
              modelValue === opt.value || idx === activeIndex
                ? 'var(--color-accent-soft)'
                : 'transparent',
            fontFamily: getFontFamily(opt)
          }"
          @click="select(opt.value)"
        >
          <span>{{ opt.label }}</span>
          <span class="ml-4 text-xs opacity-60" :style="{ fontFamily: getFontFamily(opt) }">
            {{ getPreviewText(opt) }}
          </span>
        </button>
      </div>
    </Teleport>
  </div>
</template>
