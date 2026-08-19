<template>
  <article class="dream-card">
    <img v-if="dream.photoUrl" :src="dream.photoUrl" alt="" />
    <div v-else class="avatar">רקיע</div>
    <div>
      <h2>{{ dream.name }}</h2>
      <p>{{ dream.dream }}</p>
      <span>{{ dream.scoreAtSubmit }} נקודות</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { DreamEntry } from '~/types/mission'
defineProps<{ dream: DreamEntry }>()
</script>

<style scoped>
.dream-card {
  min-height: clamp(190px, 19vh, 250px);
  display: grid;
  grid-template-columns: clamp(92px, 8vw, 128px) 1fr;
  gap: 18px;
  align-items: center;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 18px;
  color: var(--text);
  background:
    linear-gradient(135deg, rgba(var(--bg-2-rgb), .88), rgba(var(--bg-deep-rgb), .92)),
    url('~/assets/passport-design/generated_assets/orbit_constellation_decor.svg');
  background-size: cover;
  box-shadow: 0 18px 34px rgba(0,0,0,.25);
}

img,
.avatar {
  width: clamp(92px, 8vw, 128px);
  height: clamp(116px, 10vw, 160px);
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid var(--surface-border);
}

.avatar {
  display: grid;
  place-items: center;
  color: var(--text-muted);
  background: var(--surface);
  font-weight: 900;
}

h2 {
  margin: 0 0 10px;
  font-size: clamp(1.5rem, 3vw, 2.7rem);
}

p {
  margin: 0 0 12px;
  font-size: clamp(1.1rem, 2vw, 1.8rem);
  line-height: 1.35;
  overflow-wrap: anywhere;
}

span {
  color: var(--accent);
  font-weight: 900;
}
</style>
