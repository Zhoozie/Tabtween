<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useModeStore } from '@/newtab/stores/mode'
import { useMode } from '@/newtab/composables/useMode'
import { useTheme } from '@/newtab/composables/useTheme'
import { useSearch } from '@/newtab/composables/useSearch'
import { useSettingsShortcut } from '@/newtab/composables/useSettingsShortcut'
import MinimalMode from '@/newtab/layouts/MinimalMode.vue'
import StandardMode from '@/newtab/layouts/StandardMode.vue'
import ThemeToggle from '@/newtab/components/common/ThemeToggle.vue'
import ModeSwitcher from '@/newtab/components/common/ModeSwitcher.vue'
import Settings from '@/newtab/layouts/Panel/Settings.vue'
import CalendarSettings from '@/newtab/layouts/Panel/CalendarSettings.vue'

// 全局快捷键注册（每个 composable 内部调用 useSettingsShortcut 自动清理）
const modeStore = useModeStore()
const { isMinimal } = storeToRefs(modeStore)
useMode() // Ctrl+M（设置驱动）/ Ctrl+1~4
useTheme() // Ctrl+D（设置驱动）
useSearch() // 聚焦搜索（设置驱动）

// 设置面板开关
const settingsOpen = ref(false)

// 设置驱动的打开设置快捷键（默认 Ctrl+,）
useSettingsShortcut('openSettings', () => {
  settingsOpen.value = true
})

function openSettings() {
  settingsOpen.value = true
}

// 搜索命令"设置"通过事件打开设置面板
function onOpenSettingsCommand() {
  settingsOpen.value = true
}

onMounted(() => {
  window.addEventListener('tabtween:open-settings', onOpenSettingsCommand)
})

onUnmounted(() => {
  window.removeEventListener('tabtween:open-settings', onOpenSettingsCommand)
})
</script>

<template>
  <div class="h-screen min-h-screen overflow-hidden">
    <!-- 极简模式：右上角半透明按钮组（30% → 悬停 100%） -->
    <Transition name="overlay-fade">
      <div v-if="isMinimal" class="fixed right-4 top-4 z-30 flex items-center gap-1 rounded-lg p-1">
        <ThemeToggle />
        <ModeSwitcher compact />
        <button class="rounded-md px-2 py-1 text-sm" title="设置 (Ctrl+,)" @click="openSettings">
          ⚙
        </button>
      </div>
    </Transition>

    <!-- 模式切换 -->
    <StandardMode v-if="!isMinimal" @open-settings="openSettings" />
    <MinimalMode v-else />

    <Settings v-model="settingsOpen" />
    <CalendarSettings />
  </div>
</template>

<style scoped>
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>
