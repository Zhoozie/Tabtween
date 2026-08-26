<script setup lang="ts">
import TaskList from '@/newtab/components/widgets/TaskList.vue'
import CalendarWidget from '@/newtab/components/widgets/CalendarWidget.vue'

// 工作场景：任务列表 + 日历
</script>

<template>
  <div class="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
    <div class="flex flex-col gap-4">
      <CalendarWidget />
    </div>
    <div class="md:col-span-2">
      <TaskList />
    </div>
  </div>
</template>
