<template>
  <section class="asteroid">
    <button class="starfield" type="button" @click="checkClick">
      <span
        v-for="star in stars"
        :key="star.id"
        class="star"
        :style="{ right: `${star.x}%`, top: `${star.y}%`, opacity: star.o }"
      />
      <span class="moving" :style="{ right: `${movingX}%`, top: `${movingY}%` }" />
    </button>
    <p>{{ message }}</p>
    <button class="primary-button" type="button" :disabled="!found" @click="emit('ready')">מצאתי את הגוף הזז</button>
  </section>
</template>

<script setup lang="ts">
const emit = defineEmits<{ ready: [] }>()
const frame = ref(0)
const found = ref(false)
const message = ref('עקבו אחרי הנקודה שמשנה מקום בין התמונות ולחצו באזור שלה.')
const stars = Array.from({ length: 42 }, (_, id) => ({
  id,
  x: (id * 37) % 96 + 2,
  y: (id * 53) % 86 + 6,
  o: ((id * 19) % 50) / 100 + .35
}))
const movingX = computed(() => 34 + frame.value * 4)
const movingY = computed(() => 46 + frame.value * 2)

let timer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => {
    frame.value = (frame.value + 1) % 4
  }, 520)
})
onBeforeUnmount(() => window.clearInterval(timer))

function checkClick(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = 100 - ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  const distance = Math.hypot(x - movingX.value, y - movingY.value)
  if (distance < 10) {
    found.value = true
    message.value = 'זיהוי מדויק. זו הנקודה שזזה ביחס לכוכבים הקבועים.'
  } else {
    message.value = 'קרוב, נסו שוב אחרי עוד הבהוב.'
  }
}
</script>

<style scoped>
.asteroid { display: grid; gap: 10px; }
.starfield { position: relative; height: 250px; border-radius: 8px; overflow: hidden; background: radial-gradient(circle at center, #14284f, #030915 72%); border: 1px solid rgba(214,184,102,.28); }
.star, .moving { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: white; box-shadow: 0 0 6px white; }
.moving { width: 8px; height: 8px; background: #e8c96d; box-shadow: 0 0 13px #e8c96d; }
p { margin: 0; color: #4b5a73; }
</style>
