<script setup lang="ts">
interface Props {
  open: boolean
  title: string
  width?: string
  height?: string
}

withDefaults(defineProps<Props>(), {
  width: 'min(760px, 95vw)',
  height: 'min(720px, 86vh)'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function close(): void {
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="panel-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4"
        @click.self="close"
      >
        <div
          class="flex flex-col overflow-hidden"
          :style="{
            width,
            height,
            borderRadius: 'var(--radius-component)',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)'
          }"
        >
          <header
            class="relative flex h-12 shrink-0 items-center justify-center border-b"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <h3 class="text-base font-medium">{{ title }}</h3>
            <button
              type="button"
              class="absolute right-3 rounded-md px-2 py-1 text-sm opacity-60 hover:opacity-100"
              aria-label="关闭"
              @click="close"
            >
              ✕
            </button>
          </header>

          <div class="flex min-h-0 min-w-full flex-1">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.2s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}
</style>
