<script setup lang="ts">
// 单选组（Radio Group）：PRD V0.2 F2-b，点击选中、选中项高亮、切换即保存

type RadioOption = {
  value: string | number
  label: string
  description?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number
    options: RadioOption[]
    disabled?: boolean
  }>(),
  { disabled: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

function select(value: string | number) {
  if (props.disabled || props.modelValue === value) return
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="flex flex-wrap gap-2" role="radiogroup">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      role="radio"
      :aria-checked="modelValue === opt.value"
      :disabled="disabled"
      class="rounded-md border px-3 py-1 text-xs transition-colors disabled:opacity-50"
      :style="{
        borderColor:
          modelValue === opt.value ? 'var(--color-accent)' : 'var(--color-border)',
        color: modelValue === opt.value ? 'var(--color-accent)' : 'var(--color-text)',
        background: modelValue === opt.value ? 'var(--color-accent-soft)' : 'transparent'
      }"
      @click="select(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
