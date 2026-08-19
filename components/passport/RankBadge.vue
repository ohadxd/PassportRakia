<template>
  <div class="rank-badge">
    <span>דירוג</span>
    <strong>{{ rank }}</strong>
  </div>
</template>

<script setup lang="ts">
defineProps<{ rank: string }>()
</script>

<style scoped>
.rank-badge {
  display: inline-grid;
  gap: 2px;
  min-width: 132px;
  border: 1px solid var(--highlight);
  border-radius: 8px;
  padding: 7px 10px;
  color: var(--text);
  background: rgba(var(--highlight-rgb), .19);
}

.rank-badge span {
  color: var(--text-muted);
  font-size: .72rem;
}

.rank-badge strong {
  font-size: .92rem;
}
</style>
