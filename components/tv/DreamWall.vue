<template>
  <section class="dream-wall">
    <header>
      <img src="~/assets/passport-design/generated_assets/rakia_emblem_placeholder.svg" alt="" />
      <div>
        <p>משימת רקיע</p>
        <h1>קיר החלומות</h1>
      </div>
      <span class="live-pill">LIVE</span>
    </header>

    <div v-if="loading" class="empty">טוען חלומות...</div>
    <div v-else-if="error" class="empty error">{{ error }}</div>
    <div v-else-if="!dreams.length" class="empty">חלומות המשתתפים יופיעו כאן בזמן אמת</div>
    <div v-else class="dream-track" :style="{ '--duration': `${Math.max(22, dreams.length * 8)}s` }">
      <DreamCard v-for="item in repeatedDreams" :key="item.key" :dream="item.dream" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DreamEntry } from '~/types/mission'
const props = withDefaults(defineProps<{
  dreams: DreamEntry[]
  loading?: boolean
  error?: string
}>(), {
  loading: false,
  error: ''
})

const repeatedDreams = computed(() => {
  const items = props.dreams.length === 1 ? [...props.dreams, ...props.dreams, ...props.dreams] : [...props.dreams, ...props.dreams]
  return items.map((dream, index) => ({ dream, key: `${dream.id}-${index}` }))
})
</script>

<style scoped>
.dream-wall {
  min-height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  padding: clamp(24px, 3vw, 44px);
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
  margin-bottom: clamp(22px, 3vw, 36px);
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

.live-pill {
  margin-inline-start: auto;
  border: 1px solid rgba(214,184,102,.45);
  border-radius: 999px;
  padding: 8px 14px;
  color: #061126;
  background: #d8bd6a;
  font-weight: 900;
  letter-spacing: 0;
}

.dream-track {
  display: grid;
  grid-template-columns: repeat(2, minmax(360px, 1fr));
  gap: 18px;
  will-change: transform;
  animation: tv-scroll var(--duration) linear infinite;
}

.empty {
  display: grid;
  place-items: center;
  min-height: 62dvh;
  border: 1px solid rgba(214,184,102,.28);
  border-radius: 8px;
  color: rgba(249,233,191,.7);
  font-size: 2rem;
  text-align: center;
  padding: 24px;
}

.empty.error {
  color: #ffd7c9;
  background: rgba(155,47,47,.14);
}

@keyframes tv-scroll {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}

@media (max-width: 900px) {
  .dream-track {
    grid-template-columns: 1fr;
  }

  header img {
    width: 76px;
    height: 76px;
  }
}
</style>
