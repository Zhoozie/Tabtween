import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Mode, ModeState, Scene } from '@/newtab/types/mode'
import { SCENE_LIST, STORAGE_KEYS } from '@/newtab/constant'
import { loadData, onStorageChange, saveData } from '@/newtab/utils/storage'

export const useModeStore = defineStore('mode', () => {
  const currentMode = ref<Mode>('minimal')
  const currentScene = ref<Scene>('work')
  let synced = false

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
    await saveData(STORAGE_KEYS.mode, state)
  }

  async function load() {
    const state = await loadData<ModeState>(STORAGE_KEYS.mode)
    if (state) {
      currentMode.value = state.mode
      currentScene.value = state.scene
    }
    if (!synced) {
      // 跨标签同步：其他标签页切换模式/场景时更新本地（不回写，避免循环）
      onStorageChange((changes) => {
        const change = changes[STORAGE_KEYS.mode]
        if (!change) return
        const next = change.newValue as ModeState | undefined
        if (!next) return
        currentMode.value = next.mode
        currentScene.value = next.scene
      })
      synced = true
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
