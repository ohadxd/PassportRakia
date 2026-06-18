<template>
  <button class="passport-button" :class="{ secondary }" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{ secondary?: boolean; disabled?: boolean }>()
</script>

<style scoped>
.passport-button {
  min-height: 48px;
  border-radius: 8px;
  padding: 0 20px;
  color: #061126;
  font-weight: 800;
  background:
    linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0)),
    url('~/assets/passport-design/generated_assets/primary_passport_button_frame.svg'),
    linear-gradient(180deg, #ecd383, #c7a04e);
  background-size: 100% 100%, 100% 100%, 100% 100%;
  box-shadow: 0 10px 18px rgba(4, 12, 26, .22), inset 0 1px rgba(255,255,255,.5);
}

.passport-button.secondary {
  color: #f7e8bf;
  background:
    url('~/assets/passport-design/generated_assets/primary_passport_button_frame.svg'),
    linear-gradient(180deg, #153052, #071a35);
}
</style>
