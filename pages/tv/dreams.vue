<template>
  <DreamWall :dreams="dreams" :loading="loading" :error="error" />
</template>

<script setup lang="ts">
const { dreams, loading, error, start } = useDreamWall()

useHead({
  title: 'קיר החלומות | דרכון משימת רקיע',
  meta: [
    { name: 'robots', content: 'noindex' }
  ]
})

onMounted(start)
</script>
