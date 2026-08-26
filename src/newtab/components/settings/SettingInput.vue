<script setup lang="ts">
// 输入框（Input）：PRD V0.2 F2-f，聚焦输入，失焦或 Enter 保存
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    disabled?: boolean
  }>(),
  { placeholder: '', disabled: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** 失焦或回车时提交 */
  commit: [value: string]
}>()

const local = ref(props.modelValue)

function onInput(event: Event) {
  local.value = (event.target as HTMLInputElement).value
  emit('update:modelValue', local.value)
}

function onBlur() {
  emit('commit', local.value)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    ;(event.target as HTMLInputElement).blur()
  }
}
</script>

<template>
  <input
    type="text"
    :value="local"
    :placeholder="placeholder"
    :disabled="disabled"
    autocomplete="off"
    spellcheck="false"
    class="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-accent)] disabled:opacity-50"
    :style="{ borderColor: 'var(--color-border)' }"
    @input="onInput"
    @blur="onBlur"
    @keydown="onKeydown"
  />
</template>
