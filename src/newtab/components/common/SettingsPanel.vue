<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/newtab/stores/settings'
import { SEARCH_ENGINE_LABELS, type SearchEngine, type ThemeMode } from '@/newtab/types/settings'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
  }>(),
  { modelValue: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const engines = computed<SearchEngine[]>(() => ['baidu', 'google', 'bing', 'duckduckgo'])
const themes = computed<ThemeMode[]>(() => ['light', 'dark', 'auto'])

function close() {
  open.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="settings-fade">
      <div v-if="open" class="fixed inset-0 z-50 flex justify-end" @click.self="close">
        <div
          class="mt-12 mr-4 w-80 max-w-[90vw] rounded-xl p-4 shadow-lg"
          :style="{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)'
          }"
        >
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-base font-medium">设置</h2>
            <button class="rounded p-1 text-sm opacity-60 hover:opacity-100" @click="close">
              ✕
            </button>
          </div>

          <!-- 主题 -->
          <section class="mb-4">
            <h3 class="mb-2 text-xs uppercase tracking-wider opacity-60">主题</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="t in themes"
                :key="t"
                class="rounded-md border px-2 py-1 text-xs transition-colors"
                :style="{
                  borderColor: settings.theme === t ? 'var(--color-accent)' : 'var(--color-border)',
                  color: settings.theme === t ? 'var(--color-accent)' : 'var(--color-text)'
                }"
                @click="settingsStore.setTheme(t)"
              >
                {{ t === 'light' ? '亮色' : t === 'dark' ? '暗色' : '跟随系统' }}
              </button>
            </div>
          </section>

          <!-- 时钟 -->
          <section class="mb-4">
            <h3 class="mb-2 text-xs uppercase tracking-wider opacity-60">时钟</h3>
            <label class="flex items-center justify-between py-1 text-sm">
              <span>显示秒钟</span>
              <input
                type="checkbox"
                :checked="settings.clock.showSeconds"
                @change="
                  settingsStore.updateSettings({
                    clock: { ...settings.clock, showSeconds: !settings.clock.showSeconds }
                  })
                "
              />
            </label>
            <label class="flex items-center justify-between py-1 text-sm">
              <span>24小时制</span>
              <input
                type="checkbox"
                :checked="settings.clock.use24Hour"
                @change="
                  settingsStore.updateSettings({
                    clock: { ...settings.clock, use24Hour: !settings.clock.use24Hour }
                  })
                "
              />
            </label>
            <label class="flex items-center justify-between py-1 text-sm">
              <span>显示日期</span>
              <input
                type="checkbox"
                :checked="settings.clock.showDate"
                @change="
                  settingsStore.updateSettings({
                    clock: { ...settings.clock, showDate: !settings.clock.showDate }
                  })
                "
              />
            </label>
          </section>

          <!-- 搜索 -->
          <section>
            <h3 class="mb-2 text-xs uppercase tracking-wider opacity-60">搜索引擎</h3>
            <select
              class="w-full rounded-md border bg-transparent px-2 py-1 text-sm"
              :style="{ borderColor: 'var(--color-border)' }"
              :value="settings.search.engine"
              @change="
                settingsStore.updateSettings({
                  search: {
                    ...settings.search,
                    engine: ($event.target as HTMLSelectElement).value as SearchEngine
                  }
                })
              "
            >
              <option v-for="e in engines" :key="e" :value="e">
                {{ SEARCH_ENGINE_LABELS[e] }}
              </option>
            </select>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.settings-fade-enter-active,
.settings-fade-leave-active {
  transition: opacity 0.2s ease;
}
.settings-fade-enter-from,
.settings-fade-leave-to {
  opacity: 0;
}
</style>
