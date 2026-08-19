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
  color: var(--bg);
  font-family: var(--font-body);
  font-weight: 500;
  background-image:
    linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0)),
    url('~/assets/passport-design/generated_assets/primary_passport_button_frame.svg');
  background-color: var(--accent);
  background-size: 100% 100%, 100% 100%;
  box-shadow: 0 10px 18px rgba(var(--bg-rgb), .3), inset 0 1px rgba(255,255,255,.4);
}

.passport-button.secondary {
  color: var(--text);
  font-family: var(--font-body);
  font-weight: 500;
  background-image: url('~/assets/passport-design/generated_assets/primary_passport_button_frame.svg');
  background-color: var(--surface);
  background-size: 100% 100%;
}
</style>
