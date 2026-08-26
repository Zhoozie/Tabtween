import { onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/newtab/stores/settings'
import { registerShortcut } from '@/newtab/utils/keyboard'
import type { ShortcutKey } from '@/newtab/types/settings'

/**
 * 设置驱动的快捷键：绑定到 settings.shortcuts[action] 当前值，
 * 用户修改快捷键后自动重新注册，组件卸载时清理。
 */
export function useSettingsShortcut(
  action: ShortcutKey,
  handler: (event: KeyboardEvent) => void
): void {
  const settingsStore = useSettingsStore()
  const { settings } = storeToRefs(settingsStore)

  let unregister: (() => void) | null = null

  function register(shortcut: string) {
    unregister?.()
    unregister = shortcut ? registerShortcut(shortcut, handler) : null
  }

  watch(
    () => settings.value.shortcuts[action],
    (value) => register(value),
    { immediate: true }
  )

  onUnmounted(() => unregister?.())
}
