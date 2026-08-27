<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatDisplayDate, parseDisplayDate } from '@/newtab/utils/task'

interface Props {
  modelValue: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'dd/mm/yyyy'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const picker = ref<HTMLInputElement | null>(null)

const isoValue = computed(() => parseDisplayDate(props.modelValue) ?? '')

function onPick(event: Event): void {
  const iso = (event.target as HTMLInputElement).value
  emit('update:modelValue', iso ? formatDisplayDate(iso) : '')
}

function openPicker(): void {
  picker.value?.showPicker?.()
}
</script>

<template>
  <div class="task-date relative h-9">
    <div
      class="pointer-events-none absolute inset-0 z-0 flex items-center justify-between gap-1 rounded-md border bg-transparent px-2.5 text-xs"
      :style="{ borderColor: 'var(--color-border)' }"
      :aria-hidden="true"
    >
      <span :class="modelValue ? '' : 'opacity-50'">{{ modelValue || placeholder }}</span>
      <span class="opacity-50">📅</span>
    </div>
    <input
      ref="picker"
      type="date"
      class="relative z-10 h-full w-full cursor-pointer opacity-0"
      :value="isoValue"
      :aria-label="placeholder"
      @click="openPicker"
      @input="onPick"
    />
  </div>
</template>
