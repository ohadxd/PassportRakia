<template>
  <header class="mission-header">
    <MissionBadge :order="order" />
    <div>
      <p class="eyebrow">דרכון משימת רקיע</p>
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ order: number; title: string; subtitle?: string }>()
</script>

<style scoped>
.mission-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.eyebrow {
  margin: 0 0 4px;
  color: var(--text-muted);
  font-size: .78rem;
  font-weight: 500;
}

h1 {
  margin: 0;
  color: var(--text);
  font-size: clamp(1.25rem, 6vw, 2rem);
  line-height: 1.12;
}

p {
  margin: 5px 0 0;
  color: var(--text-muted);
}
</style>
