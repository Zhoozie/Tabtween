<script setup lang="ts">
// 颜色选择器（Color Picker）：预设色块 + 最后一格为自定义调色盘
// 设计：预设色块一排，最后一格固定为圆形 swatch
//       - 选中预设色 → 对应预设色块 ring 高亮，最后一格显示彩虹渐变占位
//       - 选中自定义色（不在预设中）→ 最后一格显示实际颜色并 ring 高亮
//       - <input type="color" 用 absolute+opacity:0 覆盖在最后一格上，点击即弹出系统调色盘
import { ref, computed } from 'vue'

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

/** 当前选中的颜色是否属于自定义（不在预设列表中） */
const isCustomActive = computed(() => {
  if (!props.modelValue) return true
  return !props.presets.some((c) => c.toLowerCase() === props.modelValue.toLowerCase())
})

/** 最后一格自定义色块的背景色 */
const customBg = computed(() => {
  if (isCustomActive.value) return props.modelValue
  // 未激活时显示彩虹渐变占位
  return 'conic-gradient(from 180deg at 50% 50%, #ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #6366f1, #ec4899, #ef4444)'
})

function select(color: string) {
  if (props.disabled) return
  emit('update:modelValue', color)
}

function onCustomInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <!-- 预设色块 -->
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
      :disabled="disabled"
      @click="select(color)"
    />

    <!-- 最后一格：自定义颜色 -->
    <div class="relative h-7 w-7">
      <button
        type="button"
        class="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
        :class="{ 'ring-2 ring-offset-2': isCustomActive }"
        :style="{
          background: customBg,
          borderColor: 'var(--color-border)',
          '--tw-ring-color': modelValue
        }"
        :aria-label="isCustomActive ? '当前自定义颜色 ' + modelValue : '自定义颜色'"
        :disabled="disabled"
        @click="colorInput?.click()"
      >
        <!-- 彩虹渐变占位时，中间显示小十字/加号表示"可自定义" -->
        <span
          v-if="!isCustomActive"
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span class="h-2.5 w-2.5 rounded-full" :style="{ background: 'var(--color-bg)' }" />
        </span>
      </button>
      <!-- 隐藏的原生调色盘，opacity:0 覆盖按钮，点击即触发 -->
      <input
        ref="colorInput"
        type="color"
        class="absolute inset-0 h-7 w-7 cursor-pointer opacity-0"
        tabindex="-1"
        :value="modelValue"
        :disabled="disabled"
        @input="onCustomInput"
      />
    </div>
  </div>
</template>
