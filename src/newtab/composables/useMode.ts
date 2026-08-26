import { storeToRefs } from 'pinia'
import { useModeStore } from '@/newtab/stores/mode'
import type { Mode, Scene } from '@/newtab/types/mode'
import { useKeyboard } from '@/newtab/composables/useKeyboard'
import { useSettingsShortcut } from '@/newtab/composables/useSettingsShortcut'

// 模式切换 composable：聚合 store 状态与快捷键（切换模式设置驱动，场景快捷键固定）
export function useMode() {
  const store = useModeStore()
  const { currentMode, currentScene, isMinimal, isStandard } = storeToRefs(store)

  function setMode(mode: Mode) {
    store.setMode(mode)
  }

  function setScene(scene: Scene) {
    store.setScene(scene)
  }

  function toggleMode() {
    store.toggleMode()
  }

  // 设置驱动的模式切换快捷键（默认 Ctrl+M）
  useSettingsShortcut('switchMode', () => store.toggleMode())

  // 场景快捷键固定注册
  useKeyboard('Ctrl+1', () => {
    store.setMode('standard')
    store.setScene('work')
  })
  useKeyboard('Ctrl+2', () => {
    store.setMode('standard')
    store.setScene('study')
  })
  useKeyboard('Ctrl+3', () => {
    store.setMode('standard')
    store.setScene('leisure')
  })
  useKeyboard('Ctrl+4', () => store.setMode('minimal'))

  return {
    currentMode,
    currentScene,
    isMinimal,
    isStandard,
    setMode,
    setScene,
    toggleMode
  }
}

export type UseModeReturn = ReturnType<typeof useMode>
