import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Mode, ModeState, Scene } from '@/newtab/types/mode'
import { SCENE_LIST } from '@/newtab/types/mode'
import { loadData, saveData } from '@/newtab/utils/storage'

const STORAGE_KEY = 'tabtween.mode'

export const useModeStore = defineStore('mode', () => {
  const currentMode = ref<Mode>('minimal')
  const currentScene = ref<Scene>('work')

  const isMinimal = computed(() => currentMode.value === 'minimal')
  const isStandard = computed(() => currentMode.value === 'standard')

  function setMode(mode: Mode) {
    currentMode.value = mode
    void persist()
  }

  function setScene(scene: Scene) {
    currentScene.value = scene
    void persist()
  }

  /** 极简 ↔ 标准 切换 */
  function toggleMode() {
    currentMode.value = currentMode.value === 'minimal' ? 'standard' : 'minimal'
    void persist()
  }

  /** 循环切换场景（仅标准模式有效） */
  function cycleScene() {
    const idx = SCENE_LIST.indexOf(currentScene.value)
    currentScene.value = SCENE_LIST[(idx + 1) % SCENE_LIST.length]!
    void persist()
  }

  async function persist() {
    const state: ModeState = { mode: currentMode.value, scene: currentScene.value }
    await saveData(STORAGE_KEY, state)
  }

  async function load() {
    const state = await loadData<ModeState>(STORAGE_KEY)
    if (state) {
      currentMode.value = state.mode
      currentScene.value = state.scene
    }
  }

  return {
    currentMode,
    currentScene,
    isMinimal,
    isStandard,
    setMode,
    setScene,
    toggleMode,
    cycleScene,
    load
  }
})
