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
  border: 1px solid rgba(214,184,102,.42);
  border-radius: 8px;
  padding: 7px 10px;
  color: #f7e8bf;
  background: rgba(6, 18, 38, .72);
}

.rank-badge span {
  color: rgba(247,232,191,.68);
  font-size: .72rem;
}

.rank-badge strong {
  font-size: .92rem;
}
</style>
