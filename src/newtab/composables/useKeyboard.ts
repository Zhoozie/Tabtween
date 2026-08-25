import { onUnmounted } from 'vue'
import { registerShortcut, type ShortcutMatch } from '@/newtab/utils/keyboard'

// 在组件作用域内注册快捷键，组件卸载时自动清理
export function useKeyboard(
  shortcut: string | ShortcutMatch,
  handler: (event: KeyboardEvent) => void
): void {
  const unregister = registerShortcut(shortcut, handler)
  onUnmounted(unregister)
}
