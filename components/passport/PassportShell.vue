<template>
  <main class="app-screen passport-shell">
    <ScoreBar :score="score" :completed="completed" :total="total" :rank="rank" />
    <PageFlip :can-prev="canPrev" :can-next="canNext" :under-label="underLabel" @prev="$emit('prev')" @next="$emit('next')">
      <slot />
    </PageFlip>
  </main>
</template>

<script setup lang="ts">
defineProps<{
  score: number
  completed: number
  total: number
  rank: string
  canPrev: boolean
  canNext: boolean
  underLabel?: string
}>()
defineEmits<{ next: []; prev: [] }>()
</script>

<style scoped>
.passport-shell {
  display: grid;
  align-content: start;
}
</style>
