<template>
  <div class="mission-badge" aria-label="תג משימה">
    <div class="badge-shape" aria-hidden="true">
      <span class="badge-title">משימה</span>
      <span class="badge-number">{{ displayOrder }}</span>
      <span class="badge-caption">מספר משימה</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ order: number }>()
const displayOrder = computed(() => String(props.order).padStart(2, '0'))
</script>

<style scoped>
.mission-badge {
  position: relative;
  width: 58px;
  height: 72px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.badge-shape,
.badge-shape::before {
  position: absolute;
  inset: 0;
  clip-path: polygon(32% 0, 68% 0, 68% 29%, 92% 29%, 92% 75%, 78% 75%, 68% 94%, 32% 94%, 22% 75%, 8% 75%, 8% 29%, 32% 29%);
}

.badge-shape {
  display: grid;
  grid-template-rows: 24px 1fr 18px;
  place-items: center;
  padding: 9px 8px 8px;
  color: var(--accent);
  background: var(--bg);
  filter: drop-shadow(0 4px 8px rgba(var(--bg-rgb), .25));
}

.badge-shape::before {
  content: "";
  inset: 3px;
  border: 2px solid var(--accent);
  pointer-events: none;
}

.badge-title {
  align-self: end;
  font-family: var(--font-body);
  font-size: .7rem;
  font-weight: 500;
}

.badge-number {
  width: 74%;
  min-height: 29px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(var(--accent-rgb), .76);
  color: var(--accent);
  font-family: var(--font-head);
  font-size: 1.55rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0;
}

.badge-caption {
  align-self: start;
  font-family: var(--font-body);
  font-size: .46rem;
  font-weight: 500;
}
</style>
