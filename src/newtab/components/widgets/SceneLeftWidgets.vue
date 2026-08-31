<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useModeStore } from '@/newtab/stores/mode'
import CalendarWidget from '@/newtab/components/widgets/CalendarWidget.vue'
import PomodoroTimer from '@/newtab/components/widgets/PomodoroTimer.vue'
import WeatherWidget from '@/newtab/components/widgets/WeatherWidget.vue'
import DaysWidget from '@/newtab/components/widgets/DaysWidget.vue'

const modeStore = useModeStore()
const { currentScene } = storeToRefs(modeStore)
</script>

<template>
  <div class="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto overscroll-contain">
    <!-- 工作场景：日历 -->
    <CalendarWidget v-if="currentScene === 'work'" />

    <!-- 学习场景：番茄钟 + 阅读列表 -->
    <template v-else-if="currentScene === 'study'">
      <PomodoroTimer />
      <section class="widget-card p-4">
        <h3 class="mb-2 text-base font-medium">阅读列表</h3>
        <p class="py-4 text-center text-sm opacity-50">阅读列表功能即将上线</p>
      </section>
    </template>

    <!-- 休闲场景：天气 + 日子 -->
    <template v-else-if="currentScene === 'leisure'">
      <WeatherWidget />
      <DaysWidget />
    </template>
  </div>
</template>