<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useModeStore } from '@/newtab/stores/mode'
import { MODE_LABELS, MODE_LIST, SCENE_LABELS, SCENE_LIST } from '@/newtab/constant'
withDefaults(
  defineProps<{
    /** 是否仅显示图标（极简模式右上角） */
    compact?: boolean
  }>(),
  { compact: false }
)

const modeStore = useModeStore()
const { currentMode, currentScene, isMinimal, isStandard } = storeToRefs(modeStore)

</script>

<template>
  <div class="flex items-center gap-1 text-sm">
    <!-- 大模式切换 -->
    <div
      class="flex overflow-hidden rounded-md border"
      :style="{ borderColor: 'var(--color-border)' }"
    >
      <button
        v-for="m in MODE_LIST"
        :key="m"
        class="px-2.5 py-1 transition-colors"
        :class="[
          currentMode === m
            ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
            : 'hover:bg-[var(--color-hover)]'
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
        v-for="s in SCENE_LIST"
        :key="s"
        class="px-2.5 py-1 transition-colors"
        :class="[
          currentScene === s
            ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
            : 'hover:bg-[var(--color-hover)]'
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
