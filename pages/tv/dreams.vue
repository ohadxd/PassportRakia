<template>
  <DreamWall :dreams="dreams" />
</template>

<script setup lang="ts">
const { dreams, start } = useDreamWall()
onMounted(start)
</script>
