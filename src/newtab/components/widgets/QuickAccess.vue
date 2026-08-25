<script setup lang="ts">
import { ref } from 'vue'
import { saveLargeData, loadLargeData } from '@/newtab/utils/storage'

interface Shortcut {
  id: string
  title: string
  url: string
}

const STORAGE_KEY = 'tabtween.shortcuts'

const shortcuts = ref<Shortcut[]>([])
const newTitle = ref('')
const newUrl = ref('')

const DEFAULTS: Shortcut[] = [
  { id: 'default-1', title: 'GitHub', url: 'https://github.com' },
  { id: 'default-2', title: 'Google', url: 'https://google.com' },
  { id: 'default-3', title: '知乎', url: 'https://zhihu.com' }
]

async function load() {
  const stored = await loadLargeData<Shortcut[]>(STORAGE_KEY)
  shortcuts.value = stored && stored.length > 0 ? stored : DEFAULTS
}

async function save() {
  await saveLargeData(STORAGE_KEY, shortcuts.value)
}

function add() {
  const title = newTitle.value.trim()
  let url = newUrl.value.trim()
  if (!title || !url) return
  if (!/^https?:\/\//.test(url)) url = `https://${url}`
  shortcuts.value.push({ id: `${Date.now()}`, title, url })
  newTitle.value = ''
  newUrl.value = ''
  void save()
}

function remove(id: string) {
  shortcuts.value = shortcuts.value.filter((s) => s.id !== id)
  void save()
}

void load()
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
        <span class="text-2xl opacity-60">🌐</span>
        <span class="truncate" :title="s.title">{{ s.title }}</span>
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
        v-model="newTitle"
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
