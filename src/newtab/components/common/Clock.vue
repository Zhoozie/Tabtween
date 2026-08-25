<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/newtab/stores/settings'
import { getClockParts, getGreeting, type ClockParts } from '@/newtab/utils/time'

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

const greeting = computed(() => getGreeting())

const mainSize = computed(() => (props.large ? 'text-7xl md:text-8xl' : 'text-2xl'))
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <div
      class="font-light tabular-nums tracking-tight"
      :class="mainSize"
      :style="{ color: 'var(--color-text)' }"
    >
      <span>{{ parts.main }}</span>
      <span v-if="settings.clock.showSeconds" class="text-[0.55em] opacity-60">{{
        parts.seconds
      }}</span>
    </div>
    <div v-if="settings.clock.showDate || settings.clock.showWeek" class="text-sm opacity-70">
      <span v-if="settings.clock.showDate">{{ parts.date }}</span>
      <span v-if="settings.clock.showDate && settings.clock.showWeek" class="mx-2">·</span>
      <span v-if="settings.clock.showWeek">{{ parts.week }}</span>
    </div>
    <div v-if="large" class="text-sm opacity-60">{{ greeting }}</div>
  </div>
</template>
