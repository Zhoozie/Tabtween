<script setup lang="ts">
import TaskList from '@/newtab/components/widgets/TaskList.vue'
import CalendarWidget from '@/newtab/components/widgets/CalendarWidget.vue'
import QuickAccess from '@/newtab/components/widgets/QuickAccess.vue'

// 工作场景：任务列表 + 日历 + 快捷访问
</script>

<template>
  <div class="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
    <div class="md:col-span-2">
      <TaskList />
    </div>
    <div class="flex flex-col gap-4">
      <CalendarWidget />
      <QuickAccess />
    </div>
  </div>
</template>
