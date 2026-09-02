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
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <div class="relative flex items-center justify-center">
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
