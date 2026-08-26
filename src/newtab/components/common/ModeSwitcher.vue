<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useModeStore } from '@/newtab/stores/mode'
import { MODE_LABELS, SCENE_LABELS } from '@/newtab/constant'
import type { Mode, Scene } from '@/newtab/types/mode'

withDefaults(
  defineProps<{
    /** 是否仅显示图标（极简模式右上角） */
    compact?: boolean
  }>(),
  { compact: false }
)

const modeStore = useModeStore()
const { currentMode, currentScene, isMinimal, isStandard } = storeToRefs(modeStore)

const modes = computed<Mode[]>(() => ['minimal', 'standard'])
const scenes = computed<Scene[]>(() => ['work', 'study', 'leisure'])
</script>

<template>
  <div class="flex items-center gap-1 text-sm">
    <!-- 大模式切换 -->
    <div
      class="flex overflow-hidden rounded-md border"
      :style="{ borderColor: 'var(--color-border)' }"
    >
      <button
        v-for="m in modes"
        :key="m"
        class="px-2.5 py-1 transition-colors"
        :class="[
          currentMode === m
            ? 'bg-[var(--color-accent)] text-white'
            : 'hover:bg-black/5 dark:hover:bg-white/10'
        ]"
        :title="MODE_LABELS[m]"
        @click="modeStore.setMode(m)"
      >
        {{ compact ? MODE_LABELS[m].slice(0, 1) : MODE_LABELS[m] }}
      </button>
    </div>

    <!-- 场景切换（仅标准模式可见） -->
    <div
      v-if="isStandard"
      class="flex overflow-hidden rounded-md border"
      :style="{ borderColor: 'var(--color-border)' }"
    >
      <button
        v-for="s in scenes"
        :key="s"
        class="px-2.5 py-1 transition-colors"
        :class="[
          currentScene === s
            ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
            : 'hover:bg-black/5 dark:hover:bg-white/10'
        ]"
        :title="SCENE_LABELS[s]"
        @click="modeStore.setScene(s)"
      >
        {{ compact ? SCENE_LABELS[s].slice(0, 1) : SCENE_LABELS[s] }}
      </button>
    </div>

    <span v-if="!compact && isMinimal" class="text-xs opacity-60">极简</span>
  </div>
</template>
