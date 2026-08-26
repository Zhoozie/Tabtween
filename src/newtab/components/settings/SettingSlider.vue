<script setup lang="ts">
// 滑块（Slider）：PRD V0.2 F2-d，拖动调整、实时反馈、切换即保存
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    suffix?: string
    disabled?: boolean
  }>(),
  { min: 0, max: 100, step: 1, suffix: '', disabled: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function onInput(event: Event) {
  if (props.disabled) return
  const v = Number((event.target as HTMLInputElement).value)
  emit('update:modelValue', v)
}
</script>

<template>
  <div class="flex items-center gap-3">
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :disabled="disabled"
      class="w-full"
      :style="{ accentColor: 'var(--color-accent)' }"
      @input="onInput"
    />
    <span class="w-14 shrink-0 text-right text-xs tabular-nums opacity-70">
      {{ modelValue }}{{ suffix }}
    </span>
  </div>
</template>
