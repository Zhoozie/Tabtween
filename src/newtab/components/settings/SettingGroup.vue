<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <section class="setting-group">
    <h3 class="setting-group__title">{{ title }}</h3>
    <slot />
  </section>
</template>

<style scoped>
.setting-group {
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: var(--radius-component);
  border: 1px solid var(--color-border);
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-group__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
}

.setting-group__title::before {
  content: '';
  display: block;
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--color-accent);
}
</style>
