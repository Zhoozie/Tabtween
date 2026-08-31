<script setup lang="ts">
// 天气组件占位：MVP 阶段不接真实 API，仅展示骨架
defineProps<{
  city?: string
}>()
</script>

<template>
  <section
    style="border-radius:var(--radius-component)" class=" p-4"
    :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }"
  >
    <header class="mb-3 flex items-center justify-between">
      <h3 class="text-base font-medium">天气</h3>
      <span class="text-xs opacity-50">即将上线</span>
    </header>
    <div class="flex items-center justify-center gap-4 py-6 opacity-50">
      <span class="text-5xl">⛅</span>
      <div class="text-left">
        <div class="text-3xl font-light">--°</div>
        <div class="text-xs">{{ city ?? '本地' }}</div>
      </div>
    </div>
    <p class="text-center text-xs opacity-40">天气数据接入即将上线</p>
  </section>
</template>
