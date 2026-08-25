<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useModeStore } from '@/newtab/stores/mode'
import SearchBar from '@/newtab/components/search/SearchBar.vue'
import ModeSwitcher from '@/newtab/components/common/ModeSwitcher.vue'
import ThemeToggle from '@/newtab/components/common/ThemeToggle.vue'
import { SCENE_LABELS } from '@/newtab/types/mode'
import type { Scene } from '@/newtab/types/mode'

const modeStore = useModeStore()
const { currentScene } = storeToRefs(modeStore)

const emit = defineEmits<{
  'open-settings': []
}>()

// 场景懒加载（AGENTS.md 要求使用 defineAsyncComponent）
const WorkScene = defineAsyncComponent(() => import('@/newtab/scenes/WorkScene.vue'))
const StudyScene = defineAsyncComponent(() => import('@/newtab/scenes/StudyScene.vue'))
const LeisureScene = defineAsyncComponent(() => import('@/newtab/scenes/LeisureScene.vue'))

const SCENE_COMPONENT = computed(() => {
  switch (currentScene.value as Scene) {
    case 'study':
      return StudyScene
    case 'leisure':
      return LeisureScene
    default:
      return WorkScene
  }
})

const sceneLabel = computed(() => SCENE_LABELS[currentScene.value])
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- 顶部栏：搜索 + 场景指示 + 模式切换 + 主题 -->
    <header
      class="flex items-center gap-3 px-4 py-3"
      :style="{ borderBottom: '1px solid var(--color-border)' }"
    >
      <SearchBar size="standard" placeholder="搜索工作内容..." class="flex-1" />
      <span
        class="hidden rounded-md px-2 py-1 text-xs md:inline"
        :style="{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }"
        >{{ sceneLabel }}</span
      >
      <ModeSwitcher />
      <ThemeToggle />
      <button
        class="rounded-md px-2 py-1 text-sm opacity-70 transition-opacity hover:opacity-100"
        title="设置 (Ctrl+,)"
        @click="emit('open-settings')"
      >
        ⚙
      </button>
    </header>

    <!-- 场景内容 -->
    <main class="flex-1 overflow-auto p-4">
      <component :is="SCENE_COMPONENT" />
    </main>
  </div>
</template>
