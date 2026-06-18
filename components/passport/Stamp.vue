<template>
  <div class="stamp" :class="{ animate }" :style="{ '--stamp-rotation': `${rotation}deg` }">
    <img src="~/assets/passport-design/generated_assets/green_completion_stamp.svg" alt="" />
    <span class="stamp-center">הושלם</span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ animate?: boolean; seed?: number }>(), {
  animate: false,
  seed: 1
})
const rotation = computed(() => ((props.seed * 17) % 18) - 9)
</script>

<style scoped>
.stamp {
  position: absolute;
  inset: 50% auto auto 50%;
  width: min(190px, 44vw);
  aspect-ratio: 1;
  transform: translate(-50%, -50%) rotate(var(--stamp-rotation));
  z-index: 8;
  opacity: .9;
  mix-blend-mode: multiply;
  pointer-events: none;
}

.stamp img {
  width: 100%;
  height: 100%;
  display: block;
}

.stamp-center {
  position: absolute;
  inset: 50% 0 auto;
  transform: translateY(-50%);
  text-align: center;
  color: #0b7d4f;
  font-weight: 900;
  font-size: clamp(1.15rem, 5vw, 1.9rem);
  letter-spacing: 0;
}

.stamp.animate {
  animation: stamp-impact .52s cubic-bezier(.2, 1.8, .28, .92);
}

@keyframes stamp-impact {
  0% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--stamp-rotation)) scale(1.65); filter: blur(2px); }
  58% { opacity: .95; transform: translate(-50%, -50%) rotate(var(--stamp-rotation)) scale(.88); filter: blur(0); }
  100% { opacity: .9; transform: translate(-50%, -50%) rotate(var(--stamp-rotation)) scale(1); }
}
</style>
