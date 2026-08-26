import { computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/newtab/stores/settings'
import { useSettingsShortcut } from '@/newtab/composables/useSettingsShortcut'

// 主题切换 composable：跟随系统 auto 模式时监听系统主题变化
export function useTheme() {
  const store = useSettingsStore()
  const { settings, resolvedTheme } = storeToRefs(store)

  const isDark = computed(() => resolvedTheme.value === 'dark')

  function setTheme(mode: 'light' | 'dark' | 'auto') {
    store.setTheme(mode)
  }

  function cycleTheme() {
    store.cycleTheme()
  }

  // 设置驱动的 Ctrl+D 切换主题
  useSettingsShortcut('toggleTheme', () => store.cycleTheme())

  // auto 模式下监听系统主题变化
  let media: MediaQueryList | null = null
  const handleMediaChange = () => {
    if (settings.value.appearance.theme === 'auto') {
      store.applyTheme()
    }
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', handleMediaChange)
  })

  onUnmounted(() => {
    if (media) media.removeEventListener('change', handleMediaChange)
  })

  return {
    theme: computed(() => settings.value.appearance.theme),
    resolvedTheme,
    isDark,
    setTheme,
    cycleTheme
  }
}

export type UseThemeReturn = ReturnType<typeof useTheme>
