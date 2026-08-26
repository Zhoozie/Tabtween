<script setup lang="ts">
// 颜色选择器（Color Picker）：PRD V0.2 F2-e，预设色块 + 自定义调色板，选择即保存
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    presets?: string[]
    disabled?: boolean
  }>(),
  { presets: () => [], disabled: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const colorInput = ref<HTMLInputElement | null>(null)

function select(color: string) {
  if (props.disabled) return
  emit('update:modelValue', color)
}

function openCustom() {
  if (props.disabled) return
  colorInput.value?.click()
}

function onCustomInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <button
      v-for="color in presets"
      :key="color"
      type="button"
      class="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
      :class="modelValue.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-offset-2' : ''"
      :style="{
        background: color,
        borderColor: 'var(--color-border)',
        '--tw-ring-color': color
      }"
      :aria-label="'选择颜色 ' + color"
      @click="select(color)"
    />
    <button
      type="button"
      class="flex h-7 items-center gap-1 rounded-md border px-2 text-xs transition-colors"
      :style="{ borderColor: 'var(--color-border)' }"
      @click="openCustom"
    >
      <span
        class="inline-block h-4 w-4 rounded-full"
        :style="{ background: modelValue, border: '1px solid var(--color-border)' }"
      />
      <span>自定义</span>
    </button>
    <input
      ref="colorInput"
      type="color"
      class="sr-only"
      tabindex="-1"
      :value="modelValue"
      @input="onCustomInput"
    />
  </div>
</template>
