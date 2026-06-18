<template>
  <section class="creation-page">
    <h2>{{ title }}</h2>
    <img v-if="src" :src="src" alt="" />
    <p v-else>התוצר יופיע כאן לאחר שמירה.</p>
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string; src?: string }>()
</script>

<style scoped>
.creation-page { display: grid; gap: 12px; }
img { max-width: 100%; border-radius: 8px; }
</style>
