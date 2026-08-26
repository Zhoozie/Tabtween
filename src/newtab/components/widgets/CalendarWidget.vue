<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCalendarStore } from '@/newtab/stores/calendar'

// 日历组件本体：薄壳，状态与设置由 store 管理，与弹出面板共享
// 结构：① 标题栏（含"查看更多"→打开面板） ② 月份导航 ③ 星期标题 ④ 日期网格（带月份背景水印） ⑤ 底部信息栏

const store = useCalendarStore()
const { orderedWeekdays, cells, monthLabel, bgMonthText, selectedInfo } = storeToRefs(store)
</script>

<template>
  <section
    class="rounded-xl p-4"
    :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }"
  >
    <!-- ① 标题栏 -->
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-base font-medium">日历</h3>
      <button
        class="rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        :style="{ color: 'var(--color-accent)' }"
        @click="store.openPanel()"
      >
        查看更多 ›
      </button>
    </div>

    <!-- ② 月份导航 -->
    <div class="mb-3 flex items-center justify-between">
      <button
        class="rounded-md p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        :style="{ color: 'var(--color-text)' }"
        aria-label="上个月"
        @click="store.prevMonth()"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium">{{ monthLabel }}</span>
        <button
          v-if="!(store.viewYear === store.today.getFullYear() && store.viewMonth === store.today.getMonth())"
          class="rounded px-2 py-0.5 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          :style="{ color: 'var(--color-accent)' }"
          @click="store.goToday()"
        >
          回到今天
        </button>
      </div>
      <button
        class="rounded-md p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        :style="{ color: 'var(--color-text)' }"
        aria-label="下个月"
        @click="store.nextMonth()"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 4L10 8L6 12"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- ③ 星期标题 -->
    <div class="mb-1 grid grid-cols-7">
      <div
        v-for="(w, i) in orderedWeekdays"
        :key="i"
        class="py-1.5 text-center text-xs font-medium"
        :style="{ color: i === 0 || i === 6 ? 'var(--color-accent)' : 'var(--color-text)' }"
      >
        {{ w }}
      </div>
    </div>

    <!-- ④ 日期网格（核心区域，带月份背景水印） -->
    <div class="relative grid grid-cols-7">
      <!-- 月份背景水印：z-index 在日期文本之下，低透明度 -->
      <span
        class="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center text-[150px] font-bold leading-none"
        :style="{ color: 'var(--color-text)', opacity: 0.05 }"
        aria-hidden="true"
      >
        {{ bgMonthText }}
      </span>

      <!-- 日期单元格：z-index 在水印之上 -->
      <button
        v-for="cell in cells"
        :key="cell.date"
        class="relative z-10 flex aspect-square items-center justify-center rounded-md text-sm transition-colors"
        :class="[
          cell.isCurrentMonth ? '' : 'opacity-30',
          cell.isToday ? 'font-bold' : 'font-normal'
        ]"
        :style="
          cell.isToday
            ? { background: 'var(--color-accent)', color: '#fff' }
            : cell.isSelected
              ? { background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }
              : { color: 'var(--color-text)' }
        "
        @click="store.selectDate(cell.date)"
      >
        {{ cell.day }}
      </button>
    </div>

    <!-- ⑤ 底部信息栏 -->
    <div class="mt-3 flex items-center justify-between border-t pt-3" :style="{ borderColor: 'var(--color-border)' }">
      <div class="flex items-center gap-2 text-sm">
        <span
          v-if="selectedInfo.isToday"
          class="rounded px-1.5 py-0.5 text-xs"
          :style="{ background: 'var(--color-accent)', color: '#fff' }"
        >
          今天
        </span>
        <span :style="{ color: 'var(--color-text)' }">{{ selectedInfo.text }}</span>
      </div>
    </div>
  </section>
</template>
