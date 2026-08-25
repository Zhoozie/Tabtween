<script setup lang="ts">
import NotePad from '@/newtab/components/widgets/NotePad.vue'
import QuickAccess from '@/newtab/components/widgets/QuickAccess.vue'

// 学习场景：笔记 + 阅读列表占位 + 快捷访问
</script>

<template>
  <div class="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
    <div class="md:col-span-2">
      <NotePad />
    </div>
    <div class="flex flex-col gap-4">
      <section
        class="rounded-xl p-4"
        :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }"
      >
        <h3 class="mb-2 text-base font-medium">阅读列表</h3>
        <p class="py-4 text-center text-sm opacity-50">阅读列表功能即将上线</p>
      </section>
      <QuickAccess />
    </div>
  </div>
</template>
