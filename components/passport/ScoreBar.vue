<template>
  <section class="score-bar" aria-label="מצב הדרכון">
    <div>
      <span>ניקוד</span>
      <strong>{{ score }}</strong>
    </div>
    <div>
      <span>חותמות</span>
      <strong>{{ completed }}/{{ total }}</strong>
    </div>
    <RankBadge :rank="rank" />
  </section>
</template>

<script setup lang="ts">
defineProps<{ score: number; completed: number; total: number; rank: string }>()
</script>

<style scoped>
.score-bar {
  width: min(760px, 100%);
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  align-items: center;
  margin: 0 auto 12px;
  color: var(--text);
}

.score-bar > div:not(.rank-badge) {
  min-height: 48px;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 7px 10px;
  background: var(--surface);
}

.score-bar span {
  display: block;
  color: var(--text-muted);
  font-size: .72rem;
}

.score-bar strong {
  display: block;
  margin-top: 2px;
  font-size: 1rem;
}

@media (max-width: 520px) {
  .score-bar {
    grid-template-columns: 1fr 1fr;
  }

  .rank-badge {
    grid-column: 1 / -1;
  }
}
</style>
