<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useModeStore } from '@/newtab/stores/mode'
import { useMode } from '@/newtab/composables/useMode'
import { useTheme } from '@/newtab/composables/useTheme'
import { useSearch } from '@/newtab/composables/useSearch'
import { useKeyboard } from '@/newtab/composables/useKeyboard'
import MinimalMode from '@/newtab/modes/MinimalMode.vue'
import StandardMode from '@/newtab/modes/StandardMode.vue'
import ThemeToggle from '@/newtab/components/common/ThemeToggle.vue'
import ModeSwitcher from '@/newtab/components/common/ModeSwitcher.vue'
import SettingsPanel from '@/newtab/components/common/SettingsPanel.vue'

// 全局快捷键注册（每个 composable 内部调用 useKeyboard 自动清理）
const modeStore = useModeStore()
const { isMinimal } = storeToRefs(modeStore)
useMode() // Ctrl+M / Ctrl+1~4
useTheme() // Ctrl+D
useSearch() // / 或 Ctrl+K 聚焦搜索

// 设置面板开关
const settingsOpen = ref(false)
useKeyboard('Ctrl+,', () => {
  settingsOpen.value = true
})

function openSettings() {
  settingsOpen.value = true
}
</script>

<template>
  <div class="min-h-screen">
    <!-- 极简模式：右上角半透明按钮组（30% → 悬停 100%） -->
    <Transition name="overlay-fade">
      <div
        v-if="isMinimal"
        class="fixed right-4 top-4 z-30 flex items-center gap-1 rounded-lg p-1 opacity-30 transition-opacity duration-200 hover:opacity-100"
      >
        <ThemeToggle />
        <ModeSwitcher compact />
        <button
          class="rounded-md px-2 py-1 text-sm opacity-70 transition-opacity hover:opacity-100"
          title="设置 (Ctrl+,)"
          @click="openSettings"
        >
          ⚙
        </button>
      </div>
    </Transition>

    <!-- 模式切换 -->
    <StandardMode v-if="!isMinimal" @open-settings="openSettings" />
    <MinimalMode v-else />

    <SettingsPanel v-model="settingsOpen" />
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
