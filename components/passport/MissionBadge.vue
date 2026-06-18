<template>
  <div class="mission-badge" aria-label="מספר תחנה">
    <img src="~/assets/passport-design/generated_assets/mission_badge.svg" alt="" />
    <span>{{ order }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ order: number }>()
</script>

<style scoped>
.mission-badge {
  position: relative;
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.mission-badge img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 8px rgba(10, 28, 52, .25));
}

.mission-badge span {
  position: relative;
  color: #10233d;
  font-size: 1.15rem;
  font-weight: 900;
}
</style>
