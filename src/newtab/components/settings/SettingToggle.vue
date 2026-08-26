<script setup lang="ts">
// 开关（Toggle）：PRD V0.2 F2-a
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    label?: string
    description?: string
    disabled?: boolean
  }>(),
  { label: '', description: '', disabled: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div class="flex items-center justify-between gap-3 py-1.5">
    <div class="min-w-0">
      <div class="text-sm">{{ label }}</div>
      <div v-if="description" class="mt-0.5 text-xs opacity-55">{{ description }}</div>
    </div>
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-label="label || '开关'"
      :disabled="disabled"
      class="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out disabled:opacity-50"
      :style="{
        background: modelValue ? 'var(--color-accent)' : 'var(--color-border)'
      }"
      @click="toggle"
    >
      <span
        class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[var(--color-on-accent)] shadow transition-transform duration-200 ease-in-out"
        :style="{ transform: `translateX(${modelValue ? '20px' : '0px'})` }"
      />
    </button>
  </div>
</template>
