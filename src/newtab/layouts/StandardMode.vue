<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useModeStore } from '@/newtab/stores/mode'
import SearchBar from '@/newtab/components/search/SearchBar.vue'
import ModeSwitcher from '@/newtab/components/common/ModeSwitcher.vue'
import ThemeToggle from '@/newtab/components/common/ThemeToggle.vue'
import type { Scene } from '@/newtab/types/mode'

const modeStore = useModeStore()
const { currentScene } = storeToRefs(modeStore)

const emit = defineEmits<{
  'open-settings': []
}>()

// 场景懒加载（AGENTS.md 要求使用 defineAsyncComponent）
const WorkScene = defineAsyncComponent(() => import('@/newtab/layouts/Scene/WorkScene.vue'))
const StudyScene = defineAsyncComponent(() => import('@/newtab/layouts/Scene/StudyScene.vue'))
const LeisureScene = defineAsyncComponent(() => import('@/newtab/layouts/Scene/LeisureScene.vue'))

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
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- 顶部栏：左栏搜索（本地/网络）· 右栏主题 + 模式 + 场景 + 设置 -->
    <header
      class="flex items-center justify-between gap-4 px-4 py-3"
      :style="{ borderBottom: '1px solid var(--color-border)' }"
    >
      <!-- 左栏：搜索框（宽度与占位文字由 SearchBar 内部按场景管理） -->
      <SearchBar size="standard" />
      <!-- 右栏：极简模式右上角内容 + 标准模式场景切换 -->
      <div class="flex shrink-0 items-center gap-1.5">
        <ThemeToggle />
        <ModeSwitcher />
        <button
          class="rounded-md px-2 py-1 text-sm opacity-70 transition-opacity hover:opacity-100"
          title="设置 (Ctrl+,)"
          @click="emit('open-settings')"
        >
          ⚙
        </button>
      </div>
    </header>

    <!-- 场景内容 -->
    <main class="flex-1 overflow-auto p-4">
      <component :is="SCENE_COMPONENT" />
    </main>
  </div>
</template>
