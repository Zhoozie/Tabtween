<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'

// 极简番茄钟（25 分钟工作 + 5 分钟休息）
const WORK_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

const remaining = ref(WORK_SECONDS)
const isWork = ref(true)
const running = ref(false)
let timer: number | undefined

const display = computed(() => {
  const m = Math.floor(remaining.value / 60)
  const s = remaining.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function tick() {
  if (remaining.value > 0) {
    remaining.value -= 1
  } else {
    // 切换工作/休息
    isWork.value = !isWork.value
    remaining.value = isWork.value ? WORK_SECONDS : BREAK_SECONDS
  }
}

function toggle() {
  if (running.value) {
    running.value = false
    if (timer !== undefined) window.clearInterval(timer)
  } else {
    running.value = true
    timer = window.setInterval(tick, 1000)
  }
}

function reset() {
  running.value = false
  if (timer !== undefined) window.clearInterval(timer)
  isWork.value = true
  remaining.value = WORK_SECONDS
}

onUnmounted(() => {
  if (timer !== undefined) window.clearInterval(timer)
})
</script>

<template>
  <section
    class="rounded-xl p-4"
    :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }"
  >
    <header class="mb-3 flex items-center justify-between">
      <h3 class="text-base font-medium">番茄钟</h3>
      <span class="text-xs opacity-60">{{ isWork ? '专注中' : '休息中' }}</span>
    </header>
    <div class="text-center text-5xl font-light tabular-nums">{{ display }}</div>
    <div class="mt-3 flex justify-center gap-2">
      <button
        class="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm text-white"
        @click="toggle"
      >
        {{ running ? '暂停' : '开始' }}
      </button>
      <button
        class="rounded-md border px-4 py-1.5 text-sm opacity-70 hover:opacity-100"
        :style="{ borderColor: 'var(--color-border)' }"
        @click="reset"
      >
        重置
      </button>
    </div>
  </section>
</template>
