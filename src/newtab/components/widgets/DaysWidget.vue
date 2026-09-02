<script setup lang="ts">
/**
 * DaysWidget — 日子小部件入口
 * 负责展示卡片态；面板逻辑委托给 DaysPanel
 */
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDaysStore } from '@/newtab/stores/days'
import { daysDiffFromToday, formatDateDisplay } from '@/newtab/stores/days'
import { DAY_CATEGORY_LABELS } from '@/newtab/constant'
import SvgIcon from '@/newtab/components/common/SvgIcon.vue'
import DaysPanel from '@/newtab/components/panel/DaysPanel.vue'

const store = useDaysStore()
const { settings, displayDays, currentIndex, sortedDays } = storeToRefs(store)

// ===== 面板开关 =====
const panelOpen = ref(false)

function openPanel(): void {
  panelOpen.value = true
}

// ===== 当前卡片数据 =====
function dayCountInfo(dateStr: string): { text: string; tone: 'future' | 'today' | 'past' } {
  const diff = daysDiffFromToday(dateStr)
  if (diff === 0) return { text: '就是今天', tone: 'today' }
  if (diff > 0) return { text: `还有 ${diff} 天`, tone: 'future' }
  return { text: `已经 ${Math.abs(diff)} 天`, tone: 'past' }
}

function toneStyle(tone: 'future' | 'today' | 'past'): Record<string, string> {
  if (tone === 'today') return { color: 'var(--color-today)' }
  if (tone === 'future') return { color: 'var(--color-accent)' }
  return { color: 'var(--color-text)', opacity: '0.5' }
}

const currentDayInfo = computed(() => {
  const day = displayDays.value[currentIndex.value]
  if (!day) return null
  return dayCountInfo(day.date)
})

const currentDay = computed(() => displayDays.value[currentIndex.value] ?? null)

const totalCount = computed(() => sortedDays.value.length)
</script>

<template>
  <!-- ===== 本体卡片 ===== -->
  <section
    class="days-card panel-entry-host p-4"
    :style="{
      borderRadius: 'var(--radius-component)',
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)'
    }"
    @click="openPanel"
  >
    <header class="mb-3 flex items-center justify-between">
      <h3 class="text-base font-medium">日子</h3>
      <div class="flex items-center gap-2">
        <span v-if="displayDays.length > 0" class="text-xs opacity-50">共 {{ totalCount }} 个</span>
        <button
          type="button"
          class="expand-btn panel-entry-btn flex items-center justify-center rounded-md"
          :style="{ width: '24px', height: '24px', color: 'var(--color-text)' }"
          aria-label="展开日子面板"
          @click.stop="openPanel"
        >
          <SvgIcon name="more" :size="16" :label="'展开日子面板'" />
        </button>
      </div>
    </header>

    <!-- 空状态 -->
    <div v-if="displayDays.length === 0" class="flex flex-col items-center gap-2 py-6 text-center">
      <span class="text-4xl">📅</span>
      <p class="text-sm opacity-50">还没有记录任何日子</p>
    </div>

    <!-- 卡片轮播 -->
    <div v-else class="flex items-stretch gap-2">
      <button
        v-if="displayDays.length > 1"
        type="button"
        class="arrow-btn flex items-center justify-center rounded-md"
        :style="{ width: '24px', color: 'var(--color-text)' }"
        aria-label="上一个日子"
        @click.stop="store.prev()"
      >
        ‹
      </button>

      <div class="flex flex-1 items-center justify-center">
        <Transition name="days-slide" mode="out-in">
          <div v-if="currentDay" :key="currentDay.id" class="flex flex-col items-center gap-1 py-2">
            <div class="text-4xl">
              {{ DAY_CATEGORY_LABELS[currentDay.category].icon }}
            </div>
            <div class="font-medium">{{ currentDay.name }}</div>
            <div v-if="settings.showDate" class="text-xs opacity-60">
              {{ formatDateDisplay(currentDay.date) }}
            </div>
            <div v-if="currentDayInfo" class="text-sm" :style="toneStyle(currentDayInfo.tone)">
              {{ currentDayInfo.text }}
            </div>
          </div>
        </Transition>
      </div>

      <button
        v-if="displayDays.length > 1"
        type="button"
        class="arrow-btn flex items-center justify-center rounded-md"
        :style="{ width: '24px', color: 'var(--color-text)' }"
        aria-label="下一个日子"
        @click.stop="store.next()"
      >
        ›
      </button>
    </div>

    <!-- 底部指示点 -->
    <div v-if="displayDays.length > 0" class="mt-3 flex items-center justify-center gap-3">
      <div v-if="displayDays.length > 1" class="flex items-center gap-1">
        <button
          v-for="(_, i) in displayDays"
          :key="i"
          type="button"
          class="dot"
          :class="{ 'dot--active': i === currentIndex }"
          :aria-label="`跳转到第 ${i + 1} 个日子`"
          @click.stop="store.goTo(i)"
        />
      </div>
      <span class="text-xs opacity-50">共 {{ totalCount }} 个日子</span>
    </div>
  </section>

  <!-- ===== 弹窗面板 ===== -->
  <DaysPanel v-model:open="panelOpen" />
</template>

<style scoped>
.days-card {
  cursor: pointer;
}

.expand-btn {
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background-color 0.15s ease;
}
.expand-btn:hover {
  background: var(--color-hover);
}
.expand-btn:active {
  transform: scale(0.92);
}

.arrow-btn {
  transition:
    transform 0.15s ease,
    background-color 0.15s ease;
}
.arrow-btn:hover {
  background: var(--color-hover);
}
.arrow-btn:active {
  transform: scale(0.92);
}

.dot {
  width: 6px;
  height: 6px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-border);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.15s ease;
}
.dot:hover {
  transform: scale(1.2);
}
.dot--active {
  background: var(--color-accent);
}

.days-slide-enter-active,
.days-slide-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.days-slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}
.days-slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>
