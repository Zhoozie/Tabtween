<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCalendarStore } from '@/newtab/stores/calendar'
import SettingToggle from '@/newtab/components/settings/SettingToggle.vue'
import PanelShell from '@/newtab/components/common/PanelShell.vue'
import SettingGroup from '@/newtab/components/settings/SettingGroup.vue'
import { FIRST_DAY_OPTIONS } from '@/newtab/constant'
// 日历弹出面板：单栏设置视图（状态与本体共享）
// 依据 PRD V0.2 §F8 工作场景日历组件

const store = useCalendarStore()
const { panelOpen, settings } = storeToRefs(store)
</script>

<template>
  <PanelShell
    v-model:open="panelOpen"
    title="日历设置"
    width="min(480px, 95vw)"
    height="min(560px, 80vh)"
  >
    <div
      class="cal-scroll min-h-0 flex-1 overflow-y-auto p-5 text-sm"
      :style="{ color: 'var(--color-text)' }"
    >
      <!-- 分组：视图设置 -->
      <SettingGroup title="视图设置">
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
      </SettingGroup>

      <!-- 分组：周首日 -->
      <SettingGroup title="周首日">
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
      </SettingGroup>
    </div>
  </PanelShell>
</template>

<style scoped>
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
