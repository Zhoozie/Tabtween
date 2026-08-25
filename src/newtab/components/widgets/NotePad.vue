<script setup lang="ts">
import { ref } from 'vue'
import { saveLargeData, loadLargeData } from '@/newtab/utils/storage'

const STORAGE_KEY = 'tabtween.note'

const content = ref('')

async function load() {
  const stored = await loadLargeData<string>(STORAGE_KEY)
  if (stored) content.value = stored
}

async function save() {
  await saveLargeData(STORAGE_KEY, content.value)
}

void load()
</script>

<template>
  <section
    class="rounded-xl p-4"
    :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }"
  >
    <header class="mb-2 flex items-center justify-between">
      <h3 class="text-base font-medium">快速笔记</h3>
      <span class="text-xs opacity-50">自动保存</span>
    </header>
    <textarea
      v-model="content"
      rows="6"
      placeholder="随手记录灵感..."
      class="w-full resize-none rounded-md border bg-transparent p-2 text-sm outline-none"
      :style="{ borderColor: 'var(--color-border)' }"
      @blur="save"
    />
  </section>
</template>
