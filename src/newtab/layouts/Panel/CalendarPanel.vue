<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCalendarStore } from '@/newtab/stores/calendar'
import SettingToggle from '@/newtab/components/settings/SettingToggle.vue'
import { FIRST_DAY_OPTIONS } from '@/newtab/constant'
// 日历弹出面板：单栏设置视图（状态与本体共享）
// 依据 PRD V0.2 §F8 工作场景日历组件

const store = useCalendarStore()
const { panelOpen, settings } = storeToRefs(store)

function closePanel() {
  store.closePanel()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="cal-fade">
      <div
        v-if="panelOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4"
        @click.self="closePanel"
      >
        <div
          class="flex max-h-[80vh] w-[min(480px,95vw)] flex-col overflow-hidden rounded-xl"
          :style="{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)'
          }"
        >
          <!-- 顶部：标题居中 + 关闭按钮 -->
          <header
            class="relative flex items-center border-b px-4 py-3"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <h2
              class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-base font-medium"
            >
              日历设置
            </h2>
            <button
              type="button"
              class="close-btn ml-auto flex items-center justify-center rounded-md"
              :style="{ width: '28px', height: '28px', color: 'var(--color-text)' }"
              aria-label="关闭"
              @click="closePanel"
            >
              ✕
            </button>
          </header>

          <!-- 主体：单栏设置内容 -->
          <div
            class="cal-scroll overflow-y-auto p-5 text-sm"
            :style="{ color: 'var(--color-text)' }"
          >
            <!-- 分组：视图设置 -->
            <section class="setting-group">
              <h3 class="setting-group__title">视图设置</h3>
              <SettingToggle
                :model-value="settings.showTodayMarker"
                label="高亮今日"
                description="在网格中高亮今天的日期"
                @update:model-value="store.updateSettings({ showTodayMarker: $event })"
              />
              <SettingToggle
                :model-value="settings.showOtherMonthDates"
                label="显示非当月日期"
                description="开启则灰色显示非当月日期，关闭则不显示"
                @update:model-value="store.updateSettings({ showOtherMonthDates: $event })"
              />
              <SettingToggle
                :model-value="settings.showBottomBar"
                label="显示底部信息栏"
                description="在日历底部显示选中日期的详细信息"
                @update:model-value="store.updateSettings({ showBottomBar: $event })"
              />
            </section>

            <!-- 分组：周首日 -->
            <section class="setting-group">
              <h3 class="setting-group__title">周首日</h3>
              <div class="flex items-center gap-2 py-1">
                <button
                  v-for="opt in FIRST_DAY_OPTIONS"
                  :key="opt.value"
                  type="button"
                  class="rounded-lg px-3 py-1.5 text-sm transition-colors"
                  :style="
                    settings.firstDayOfWeek === opt.value
                      ? { background: 'var(--color-accent)', color: 'var(--color-on-accent)' }
                      : {
                          background: 'var(--color-accent-soft)',
                          color: 'var(--color-accent)'
                        }
                  "
                  @click="store.updateFirstDayOfWeek(opt.value)"
                >
                  {{ opt.label }}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 关闭按钮：悬浮内压 */
.close-btn {
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}
.close-btn:hover {
  transform: scale(0.92);
  background: var(--color-accent-soft);
  box-shadow: var(--shadow-inset);
}
.close-btn:active {
  transform: scale(0.82);
  box-shadow: var(--shadow-inset-lg);
}

/* 分组卡片 */
.setting-group {
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}
.setting-group:last-child {
  margin-bottom: 0;
}
.setting-group__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  padding-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}
.setting-group__title::before {
  content: '';
  display: block;
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--color-accent);
}

/* 弹出层淡入淡出 */
.cal-fade-enter-active,
.cal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.cal-fade-enter-from,
.cal-fade-leave-to {
  opacity: 0;
}

/* 滚动条 */
.cal-scroll {
  scrollbar-width: thin;
}
.cal-scroll::-webkit-scrollbar {
  width: 6px;
}
.cal-scroll::-webkit-scrollbar-thumb {
  background: var(--color-scrollbar-thumb);
  border-radius: 3px;
}
</style>
