<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useShortcutsStore } from '@/newtab/stores/shortcuts'

const store = useShortcutsStore()
const { shortcuts } = storeToRefs(store)

const newName = ref('')
const newUrl = ref('')

function add() {
  if (store.addShortcut(newName.value, newUrl.value)) {
    newName.value = ''
    newUrl.value = ''
  }
}

function remove(id: string) {
  store.removeShortcut(id)
}
</script>

<template>
  <section
    class="rounded-xl p-4"
    :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }"
  >
    <header class="mb-3">
      <h3 class="text-base font-medium">快捷访问</h3>
    </header>
    <div class="grid grid-cols-4 gap-2">
      <a
        v-for="s in shortcuts"
        :key="s.id"
        :href="s.url"
        target="_blank"
        rel="noopener"
        class="group relative flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <span class="text-2xl opacity-60">{{ s.icon ?? '🌐' }}</span>
        <span class="truncate" :title="s.name">{{ s.name }}</span>
        <button
          class="absolute right-1 top-1 hidden text-xs opacity-50 hover:opacity-100 group-hover:block"
          title="移除"
          @click.prevent="remove(s.id)"
        >
          ✕
        </button>
      </a>
    </div>

    <form class="mt-3 flex gap-2" @submit.prevent="add">
      <input
        v-model="newName"
        type="text"
        placeholder="名称"
        class="w-24 rounded-md border bg-transparent px-2 py-1 text-xs outline-none"
        :style="{ borderColor: 'var(--color-border)' }"
      />
      <input
        v-model="newUrl"
        type="text"
        placeholder="网址"
        class="flex-1 rounded-md border bg-transparent px-2 py-1 text-xs outline-none"
        :style="{ borderColor: 'var(--color-border)' }"
      />
      <button
        type="submit"
        class="rounded-md bg-[var(--color-accent)] px-2 py-1 text-xs text-white"
      >
        +
      </button>
    </form>
  </section>
</template>
