<script setup lang="ts">
import { computed } from 'vue'

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

const rangePercent = computed(() => {
  const span = props.max - props.min
  if (span <= 0) return 0
  const value = Math.min(props.max, Math.max(props.min, props.modelValue))
  return ((value - props.min) / span) * 100
})

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
      class="slider w-full"
      :style="{ '--range-progress': `${rangePercent}%` }"
      @input="onInput"
    />
    <span class="w-14 shrink-0 text-right text-xs tabular-nums opacity-70">
      {{ modelValue }}{{ suffix }}
    </span>
  </div>
</template>

<style scoped>
/* 滑块：已滑到位置显示主色，未滑到的轨道使用浅色 */
.slider {
  --range-track-color: var(--color-range-track, var(--color-accent-soft));

  appearance: none;
  -webkit-appearance: none;
  height: 20px;
  margin: 0;
  background: transparent;
  cursor: pointer;
}

.slider:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.slider::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 9999px;
  background: linear-gradient(
    to right,
    var(--color-accent) 0,
    var(--color-accent) var(--range-progress, 0%),
    var(--range-track-color) var(--range-progress, 0%),
    var(--range-track-color) 100%
  );
}

.slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -4px;
  border: none;
  border-radius: 9999px;
  background: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-bg-elevated);
}

.slider::-moz-range-track {
  height: 6px;
  border-radius: 9999px;
  background: var(--range-track-color);
}

.slider::-moz-range-progress {
  height: 6px;
  border-radius: 9999px;
  background: var(--color-accent);
}

.slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: none;
  border-radius: 9999px;
  background: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-bg-elevated);
}
</style>
