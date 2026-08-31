<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/newtab/stores/settings'

const props = withDefaults(
  defineProps<{
    large?: boolean
  }>(),
  { large: false }
)

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const now = ref(new Date())
let timer: number | undefined

function tick() {
  now.value = new Date()
}

onMounted(() => {
  tick()
  timer = window.setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timer !== undefined) window.clearInterval(timer)
})

// 表盘尺寸：极简 200px，标准 120px
const clockSize = computed(() => (props.large ? 200 : 120))
const cx = computed(() => clockSize.value / 2)
const cy = computed(() => clockSize.value / 2)
const r = computed(() => clockSize.value / 2 - 4)

const hourAngle = computed(() => {
  const h = now.value.getHours() % 12
  const m = now.value.getMinutes()
  const s = now.value.getSeconds()
  return (h * 30 + m * 0.5 + s * (0.5 / 60)) * (Math.PI / 180)
})

const minuteAngle = computed(() => {
  const m = now.value.getMinutes()
  const s = now.value.getSeconds()
  return (m * 6 + s * 0.1) * (Math.PI / 180)
})

const secondAngle = computed(() => now.value.getSeconds() * 6 * (Math.PI / 180))

// 黑色 / 深色系描边色；仅秒针色可由用户自定义
const dialColor = '#000000'
const secondColor = computed(() => settings.value.clock.secondHandColor || '#000000')

interface Tick {
  x1: number
  y1: number
  x2: number
  y2: number
  dotX: number
  dotY: number
  numX: number
  numY: number
  label: number
  isMajor: boolean
}

const ticks = computed<Tick[]>(() => {
  const list: Tick[] = []
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 - 90) * (Math.PI / 180)
    const inner = r.value - 8
    list.push({
      x1: cx.value + inner * Math.cos(angle),
      y1: cy.value + inner * Math.sin(angle),
      x2: cx.value + r.value * Math.cos(angle),
      y2: cy.value + r.value * Math.sin(angle),
      dotX: cx.value + (r.value - 4) * Math.cos(angle),
      dotY: cy.value + (r.value - 4) * Math.sin(angle),
      numX: cx.value + (r.value - 15) * Math.cos(angle),
      numY: cy.value + (r.value - 15) * Math.sin(angle),
      label: i === 0 ? 12 : i,
      isMajor: i % 3 === 0
    })
  }
  return list
})

// 圆点刻度 / 数字刻度尺寸随表盘等比缩放
const majorDotR = computed(() => Math.max(2, clockSize.value * 0.018))
const minorDotR = computed(() => Math.max(1.4, clockSize.value * 0.011))
const numFontSize = computed(() => clockSize.value * 0.11)

function endOf(angle: number, length: number) {
  return {
    x: cx.value + length * Math.sin(angle),
    y: cy.value - length * Math.cos(angle)
  }
}

const hourEnd = computed(() => endOf(hourAngle.value, r.value * 0.5))
const minuteEnd = computed(() => endOf(minuteAngle.value, r.value * 0.78))
const secondEnd = computed(() => endOf(secondAngle.value, r.value * 0.85))

const timeLabel = computed(() => {
  const d = now.value
  const h24 = settings.value.clock.use24Hour
  const h = h24 ? d.getHours() : d.getHours() % 12 === 0 ? 12 : d.getHours() % 12
  const m = d.getMinutes().toString().padStart(2, '0')
  const s = d.getSeconds().toString().padStart(2, '0')
  return h + ':' + m + (settings.value.clock.showSeconds ? ':' + s : '')
})
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <svg :width="clockSize" :height="clockSize" role="img" aria-label="模拟时钟">
      <!-- 表盘外圈 -->
      <circle
        :cx="cx"
        :cy="cy"
        :r="r"
        fill="none"
        :stroke="dialColor"
        stroke-width="2"
        opacity="0.7"
      />

      <!-- 12 个刻度：线型 / 圆点 / 数字 -->
      <template v-if="settings.clock.showTicks">
        <template v-if="settings.clock.tickStyle === 'line'">
          <line
            v-for="(t, i) in ticks"
            :key="i"
            :x1="t.x1"
            :y1="t.y1"
            :x2="t.x2"
            :y2="t.y2"
            :stroke="dialColor"
            :stroke-width="t.isMajor ? 3 : 1.5"
            stroke-linecap="round"
            :opacity="t.isMajor ? 1 : 0.6"
          />
        </template>
        <template v-else-if="settings.clock.tickStyle === 'dot'">
          <circle
            v-for="(t, i) in ticks"
            :key="i"
            :cx="t.dotX"
            :cy="t.dotY"
            :r="t.isMajor ? majorDotR : minorDotR"
            :fill="dialColor"
            :opacity="t.isMajor ? 1 : 0.6"
          />
        </template>
        <template v-else>
          <text
            v-for="(t, i) in ticks"
            :key="i"
            :x="t.numX"
            :y="t.numY"
            text-anchor="middle"
            dominant-baseline="central"
            :font-size="numFontSize"
            :fill="dialColor"
            :opacity="t.isMajor ? 1 : 0.7"
          >
            {{ t.label }}
          </text>
        </template>
      </template>

      <!-- 时针 -->
      <line
        :x1="cx"
        :y1="cy"
        :x2="hourEnd.x"
        :y2="hourEnd.y"
        :stroke="dialColor"
        stroke-width="3"
        stroke-linecap="round"
      />

      <!-- 分针 -->
      <line
        :x1="cx"
        :y1="cy"
        :x2="minuteEnd.x"
        :y2="minuteEnd.y"
        :stroke="dialColor"
        stroke-width="2"
        stroke-linecap="round"
      />

      <!-- 秒针 -->
      <line
        v-if="settings.clock.showSecondsHand"
        :x1="cx"
        :y1="cy"
        :x2="secondEnd.x"
        :y2="secondEnd.y"
        :stroke="secondColor"
        stroke-width="1"
        stroke-linecap="round"
      />

      <!-- 中心点 -->
      <circle :cx="cx" :cy="cy" :r="3" :fill="dialColor" />
    </svg>

    <!-- 表盘下方时间 -->
    <div
      v-if="settings.clock.showAnalogTime"
      class="font-light tabular-nums tracking-tight text-black dark:text-white"
    >
      <span class="text-2xl">{{ timeLabel }}</span>
    </div>
  </div>
</template>
