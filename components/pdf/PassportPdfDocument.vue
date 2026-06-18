<template>
  <section class="pdf-preview passport-security">
    <h1>דרכון משימת רקיע</h1>
    <p>{{ session.name }}</p>
    <p>{{ session.totalScore }} נקודות · {{ session.rank }}</p>
  </section>
</template>

<script setup lang="ts">
import type { PassportSession } from '~/types/mission'
defineProps<{ session: PassportSession }>()
</script>

<style scoped>
.pdf-preview {
  border-radius: 8px;
  padding: 24px;
  border: 1px solid rgba(18,36,59,.14);
}
h1 { margin: 0 0 8px; }
p { margin: 4px 0; }
</style>
