import { storeToRefs } from 'pinia'
import { useModeStore } from '@/newtab/stores/mode'
import type { Mode, Scene } from '@/newtab/types/mode'
import { useKeyboard } from '@/newtab/composables/useKeyboard'

// 模式切换 composable：聚合 store 状态与快捷键 Ctrl+M / Ctrl+1~4
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

  // 注册模式相关快捷键
  useKeyboard('Ctrl+M', () => store.toggleMode())
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
