<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/newtab/stores/settings'
import { getClockParts, type ClockParts } from '@/newtab/utils/time'

const props = withDefaults(
  defineProps<{
    /** 极简模式下放大字号 */
    large?: boolean
  }>(),
  { large: false }
)

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const parts = ref<ClockParts>(getClockParts(new Date(), settings.value.clock.use24Hour))

let timer: number | undefined

function tick() {
  parts.value = getClockParts(new Date(), settings.value.clock.use24Hour)
}

onMounted(() => {
  tick()
  timer = window.setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timer !== undefined) window.clearInterval(timer)
})

const mainSize = computed(() => (props.large ? 'text-7xl md:text-8xl' : 'text-2xl'))

// 数字时钟副显示是否有任意子项（控制父容器显示）
const showSubRow = computed(
  () =>
    settings.value.clock.showDate || settings.value.clock.showLunar || settings.value.clock.showWeek
)

// ============ 刻度环（开启“刻度显示”时在主时间外围绘制表盘刻度） ============
const ringSize = computed(() => (props.large ? 320 : 160))
const tickColor = 'var(--color-text)'
const cx = computed(() => ringSize.value / 2)
const cy = computed(() => ringSize.value / 2)
const r = computed(() => ringSize.value / 2 - 8)

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
    const inner = r.value - 10
    list.push({
      x1: cx.value + inner * Math.cos(angle),
      y1: cy.value + inner * Math.sin(angle),
      x2: cx.value + r.value * Math.cos(angle),
      y2: cy.value + r.value * Math.sin(angle),
      dotX: cx.value + (r.value - 5) * Math.cos(angle),
      dotY: cy.value + (r.value - 5) * Math.sin(angle),
      numX: cx.value + (r.value - 18) * Math.cos(angle),
      numY: cy.value + (r.value - 18) * Math.sin(angle),
      label: i === 0 ? 12 : i,
      isMajor: i % 3 === 0
    })
  }
  return list
})

const majorDotR = computed(() => Math.max(2, ringSize.value * 0.02))
const minorDotR = computed(() => Math.max(1.4, ringSize.value * 0.012))
const numFontSize = computed(() => ringSize.value * 0.09)
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <div
      class="relative flex items-center justify-center"
      :style="
        settings.clock.showTicks ? { width: ringSize + 'px', height: ringSize + 'px' } : undefined
      "
    >
      <svg
        v-if="settings.clock.showTicks"
        :width="ringSize"
        :height="ringSize"
        class="absolute inset-0"
      >
        <!-- 表盘外圈 -->
        <circle
          :cx="cx"
          :cy="cy"
          :r="r"
          fill="none"
          :stroke="tickColor"
          stroke-width="1.5"
          opacity="0.3"
        />
        <!-- 12 个刻度：线型 / 圆点 / 数字 -->
        <template v-if="settings.clock.tickStyle === 'line'">
          <line
            v-for="(t, i) in ticks"
            :key="i"
            :x1="t.x1"
            :y1="t.y1"
            :x2="t.x2"
            :y2="t.y2"
            :stroke="tickColor"
            :stroke-width="t.isMajor ? 2.5 : 1.5"
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
            :fill="tickColor"
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
            :fill="tickColor"
            :opacity="t.isMajor ? 1 : 0.7"
          >
            {{ t.label }}
          </text>
        </template>
      </svg>

      <div
        class="relative font-light tabular-nums tracking-tight"
        :class="mainSize"
        :style="{ color: 'var(--color-text)', fontFamily: settings.clock.clockFont }"
      >
        <span>{{ parts.main }}</span>
        <span v-if="settings.clock.showSeconds" class="text-[0.55em] opacity-60">{{
          parts.seconds
        }}</span>
      </div>
    </div>
    <div v-if="showSubRow" class="flex items-center gap-0.5 text-sm opacity-70">
      <span v-if="settings.clock.showDate">{{ parts.date }}</span>
      <span v-if="settings.clock.showDate && settings.clock.showLunar" class="opacity-40">·</span>
      <span v-if="settings.clock.showLunar">{{ parts.lunar }}</span>
      <span
        v-if="(settings.clock.showDate || settings.clock.showLunar) && settings.clock.showWeek"
        class="opacity-40"
        >·</span
      >
      <span v-if="settings.clock.showWeek">{{ parts.week }}</span>
    </div>
  </div>
</template>
