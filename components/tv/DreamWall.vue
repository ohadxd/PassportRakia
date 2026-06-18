<template>
  <section class="dream-wall">
    <header>
      <img src="~/assets/passport-design/generated_assets/rakia_emblem_placeholder.svg" alt="" />
      <div>
        <p>משימת רקיע</p>
        <h1>קיר החלומות</h1>
      </div>
    </header>

    <div v-if="!dreams.length" class="empty">חלומות המשתתפים יופיעו כאן בזמן אמת</div>
    <div v-else class="dream-track" :style="{ '--duration': `${Math.max(22, dreams.length * 8)}s` }">
      <DreamCard v-for="dream in repeatedDreams" :key="`${dream.id}-a`" :dream="dream" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DreamEntry } from '~/types/mission'
const props = defineProps<{ dreams: DreamEntry[] }>()
const repeatedDreams = computed(() => [...props.dreams, ...props.dreams])
</script>

<style scoped>
.dream-wall {
  min-height: 100dvh;
  overflow: hidden;
  padding: 34px;
  color: #f9e9bf;
  background:
    radial-gradient(circle at 20% 20%, rgba(214,184,102,.14), transparent 30vw),
    radial-gradient(circle at 80% 10%, rgba(67,129,190,.18), transparent 32vw),
    linear-gradient(135deg, #030915, #07172f 55%, #041022);
}

header {
  display: flex;
  gap: 18px;
  align-items: center;
  margin-bottom: 28px;
}

header img {
  width: 96px;
  height: 96px;
}

header p {
  margin: 0;
  color: #d8bd6a;
  font-weight: 900;
}

header h1 {
  margin: 2px 0 0;
  font-size: clamp(2.2rem, 5vw, 4.8rem);
}

.dream-track {
  display: grid;
  grid-template-columns: repeat(2, minmax(460px, 1fr));
  gap: 18px;
  animation: tv-scroll var(--duration) ease-in-out infinite alternate;
}

.empty {
  display: grid;
  place-items: center;
  min-height: 55dvh;
  border: 1px solid rgba(214,184,102,.28);
  border-radius: 8px;
  color: rgba(249,233,191,.7);
  font-size: 2rem;
}

@keyframes tv-scroll {
  from { transform: translateY(0); }
  to { transform: translateY(-38%); }
}
</style>
