<template>
  <main class="app-screen passport-shell">
    <PageFlip :can-prev="canPrev" :can-next="canNext" :next-label="nextLabel" :prev-label="prevLabel" @prev="$emit('prev')" @next="$emit('next')">
      <slot />
    </PageFlip>
  </main>
</template>

<script setup lang="ts">
defineProps<{
  canPrev: boolean
  canNext: boolean
  nextLabel?: string
  prevLabel?: string
}>()
defineEmits<{ next: []; prev: [] }>()
</script>

<style scoped>
.passport-shell {
  display: grid;
  align-content: start;
}
</style>
