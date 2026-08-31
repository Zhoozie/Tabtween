<script setup lang="ts">
interface Props {
  label: string
  icon?: string
  active?: boolean
}

withDefaults(defineProps<Props>(), {
  icon: '',
  active: false
})
</script>

<template>
  <button
    type="button"
    class="nav-item group flex w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors duration-200"
    :aria-current="active ? 'page' : undefined"
  >
    <span v-if="icon" class="grid h-5 w-5 shrink-0 place-items-center text-sm leading-none">{{
      icon
    }}</span>
    <span class="min-w-0 flex-1 truncate">{{ label }}</span>
    <slot name="trailing" />
  </button>
</template>

<style scoped>
.nav-item {
  height: 40px;
  color: var(--color-text);
  background: transparent;
}

.nav-item[aria-current='page'] {
  color: var(--color-accent);
  background: var(--color-accent-soft);
}

.nav-item:not([aria-current='page']):hover {
  background: var(--color-hover);
}
</style>
