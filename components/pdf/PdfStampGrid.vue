<template>
  <div class="pdf-stamp-grid">
    <span v-for="mission in missions" :key="mission.id" :class="{ done: progress[mission.id]?.status === 'completed' }">{{ mission.order }}</span>
  </div>
</template>

<script setup lang="ts">
import type { MissionProgress } from '~/types/mission'
import { missions as allMissions } from '~/data/missions'
defineProps<{ progress: Record<string, MissionProgress> }>()
const missions = allMissions.filter((mission) => mission.baseScore > 0)
</script>

<style scoped>
.pdf-stamp-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
span { display: grid; place-items: center; min-height: 42px; border-radius: 50%; border: 1px dashed var(--surface-border); color: var(--text-muted); }
.done { color: var(--accent); border: 2px solid var(--accent); }
</style>
