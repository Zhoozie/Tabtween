<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useShortcutsStore } from '@/newtab/stores/shortcuts'
import {
  SHORTCUT_CATEGORIES,
  SHORTCUT_CATEGORY_ICONS,
  SHORTCUT_CATEGORY_LABELS
} from '@/newtab/constant'
import type { Shortcut, ShortcutCategory } from '@/newtab/types/settings'

const store = useShortcutsStore()
const { shortcuts } = storeToRefs(store)

const newName = ref('')
const newUrl = ref('')
const newGroup = ref<ShortcutCategory>('work')
const adding = ref(false)
const activeGroup = ref<ShortcutCategory | null>(null)

const sortedShortcuts = computed(() => [...shortcuts.value].sort((a, b) => a.order - b.order))

interface ShortcutGroup {
  category: ShortcutCategory
  label: string
  icon: string
  items: Shortcut[]
}

const groups = computed<ShortcutGroup[]>(() =>
  SHORTCUT_CATEGORIES.map((category) => ({
    category,
    label: SHORTCUT_CATEGORY_LABELS[category],
    icon: SHORTCUT_CATEGORY_ICONS[category],
    items: sortedShortcuts.value.filter((s) => s.category === category)
  })).filter((group) => group.items.length > 0)
)

watch(
  groups,
  (list) => {
    if (list.length > 0 && activeGroup.value === null) {
      activeGroup.value = list[0]!.category
    }
  },
  { immediate: true }
)

function isOpen(group: ShortcutGroup): boolean {
  return activeGroup.value === group.category
}

function toggleGroup(category: ShortcutCategory) {
  activeGroup.value = activeGroup.value === category ? null : category
}

function add() {
  if (store.addShortcut(newName.value, newUrl.value, newGroup.value)) {
    newName.value = ''
    newUrl.value = ''
    newGroup.value = 'work'
    adding.value = false
  }
}
</script>

<template>
  <section
    class="rounded-xl border p-3"
    :style="{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }"
  >
    <header class="mb-3 flex items-center justify-between gap-2">
      <h3 class="text-sm font-medium">快捷访问</h3>
      <button
        type="button"
        title="添加快捷访问"
        class="grid h-7 w-7 place-items-center rounded-md text-sm transition-colors hover:bg-[var(--color-hover)]"
        @click="adding = !adding"
      >
        {{ adding ? '✕' : '+' }}
      </button>
    </header>

    <form v-if="adding" class="mb-4 flex flex-col gap-2" @submit.prevent="add">
      <input
        v-model="newName"
        type="text"
        placeholder="名称"
        class="rounded-md border bg-transparent px-2 py-1 text-xs outline-none"
        :style="{ borderColor: 'var(--color-border)' }"
      />
      <input
        v-model="newUrl"
        type="text"
        placeholder="网址"
        class="rounded-md border bg-transparent px-2 py-1 text-xs outline-none"
        :style="{ borderColor: 'var(--color-border)' }"
      />
      <select
        v-model="newGroup"
        class="rounded-md border bg-transparent px-2 py-1 text-xs outline-none"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <option v-for="category in SHORTCUT_CATEGORIES" :key="category" :value="category">
          {{ SHORTCUT_CATEGORY_ICONS[category] }} {{ SHORTCUT_CATEGORY_LABELS[category] }}
        </option>
      </select>
      <button
        type="submit"
        class="rounded-md bg-[var(--color-accent)] px-2 py-1.5 text-xs text-[var(--color-on-accent)]"
      >
        添加
      </button>
    </form>

    <div v-if="groups.length === 0" class="py-4 text-center text-xs opacity-50">暂无快捷访问</div>

    <div v-else class="min-h-0 space-y-3">
      <section v-for="group in groups" :key="group.category">
        <button
          type="button"
          class="group-title"
          :class="{ 'is-open': isOpen(group) }"
          :aria-expanded="isOpen(group)"
          @click="toggleGroup(group.category)"
        >
          <span class="group-title__icon">{{ group.icon }}</span>
          <span class="min-w-0 flex-1 text-left">{{ group.label }}</span>
          <span class="text-[10px] opacity-45">{{ group.items.length }}</span>
          <span class="group-chevron" :class="{ 'is-open': isOpen(group) }">▾</span>
        </button>

        <Transition name="group-fade">
          <ul v-if="isOpen(group)" class="mt-2 grid grid-cols-2 gap-2">
            <li v-for="s in group.items" :key="s.id" class="group relative min-w-0">
              <a
                :href="s.url"
                target="_blank"
                rel="noopener"
                class="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border p-2 transition-colors hover:bg-[var(--color-hover)]"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <span
                  class="grid h-7 w-7 place-items-center rounded-md text-xs font-medium"
                  :style="{
                    background: 'var(--color-accent-soft)',
                    color: 'var(--color-accent)'
                  }"
                >
                  {{ s.icon ?? s.name.slice(0, 1).toUpperCase() }}
                </span>
                <span
                  class="w-full truncate text-center text-[11px] leading-tight"
                  :title="s.name"
                  >{{ s.name }}</span
                >
              </a>
              <button
                class="absolute right-1 top-1 hidden text-xs opacity-50 hover:opacity-100 group-hover:block"
                title="移除"
                @click.prevent="store.removeShortcut(s.id)"
              >
                ✕
              </button>
            </li>
          </ul>
        </Transition>
      </section>
    </div>
  </section>
</template>

<style scoped>
.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--color-text);
  text-align: left;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.group-title:hover {
  background: var(--color-hover);
}

.group-title.is-open {
  color: var(--color-accent);
  background: var(--color-accent-soft);
}

.group-title__icon {
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 6px;
  font-size: 12px;
  color: var(--color-accent);
  background: var(--color-accent-soft);
}

.group-chevron {
  flex-shrink: 0;
  font-size: 10px;
  opacity: 0.5;
  transition: transform 0.2s ease;
}

.group-chevron.is-open {
  transform: rotate(180deg);
}

.group-fade-enter-active,
.group-fade-leave-active {
  transition: opacity 0.2s ease;
}

.group-fade-enter-from,
.group-fade-leave-to {
  opacity: 0;
}
</style>
