<script setup lang="ts">
import WeatherWidget from '@/newtab/components/widgets/WeatherWidget.vue'
import QuickAccess from '@/newtab/components/widgets/QuickAccess.vue'

// 休闲场景：天气 + 推荐占位 + 快捷访问
</script>

<template>
  <div class="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
    <div class="flex flex-col gap-4">
      <WeatherWidget />
    </div>
    <div class="md:col-span-2">
      <section
        class="rounded-xl p-4"
        :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }"
      >
        <h3 class="mb-2 text-base font-medium">今日推荐</h3>
        <p class="py-8 text-center text-sm opacity-50">推荐内容接入即将上线</p>
      </section>
      <div class="mt-4">
        <QuickAccess />
      </div>
    </div>
  </div>
</template>
