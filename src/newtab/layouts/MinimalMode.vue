<script setup lang="ts">
import Clock from '@/newtab/components/common/Clock.vue'
import SearchBar from '@/newtab/components/search/SearchBar.vue'

// 极简模式：极简时钟 + 搜索框，整体偏上布局
</script>

<template>
  <main
    class="flex h-screen min-h-screen flex-col items-center gap-8 overflow-hidden px-4 pt-[18vh]"
  >
    <Clock large />
    <SearchBar size="minimal" placeholder="搜索" />
    <p class="text-xs opacity-40">
      按 <kbd class="rounded border px-1">/</kbd> 或
      <kbd class="rounded border px-1">Ctrl+K</kbd> 聚焦搜索 ·
      <kbd class="rounded border px-1">Ctrl+M</kbd> 切换模式
    </p>
  </main>
</template>
