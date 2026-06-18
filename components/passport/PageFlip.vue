<template>
  <div
    class="flip-stage"
    :class="{ dragging: drag.active, forward: drag.direction === 'forward', backward: drag.direction === 'backward' }"
    :style="{ '--drag-progress': dragProgress }"
  >
    <div class="under-page passport-security">
      <span>{{ underLabel }}</span>
    </div>
    <div class="flip-card" :style="cardStyle">
      <slot />
      <div v-if="drag.active" class="curl" :style="{ width: `${curlWidth}px` }" />
    </div>
    <button
      v-if="canNext"
      class="edge-hint left-edge"
      type="button"
      aria-label="דפדוף קדימה"
      @pointerdown.prevent="startDrag('forward', $event)"
    />
    <button
      v-if="canPrev"
      class="edge-hint right-edge"
      type="button"
      aria-label="דפדוף אחורה"
      @pointerdown.prevent="startDrag('backward', $event)"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ canNext: boolean; canPrev: boolean; underLabel?: string }>()
const emit = defineEmits<{ next: []; prev: [] }>()

const drag = reactive({
  active: false,
  direction: '' as '' | 'forward' | 'backward',
  startX: 0,
  currentX: 0,
  moved: false
})

const distance = computed(() => drag.currentX - drag.startX)
const normalizedDistance = computed(() => {
  if (!drag.active) return 0
  if (drag.direction === 'forward') return Math.max(0, distance.value)
  return Math.max(0, -distance.value)
})
const dragProgress = computed(() => String(Math.min(1, normalizedDistance.value / 220)))
const curlWidth = computed(() => Math.max(24, Math.min(110, normalizedDistance.value * .55)))
const cardStyle = computed(() => {
  if (!drag.active) return {}
  const p = Number(dragProgress.value)
  const sign = drag.direction === 'forward' ? 1 : -1
  return {
    transform: `translateX(${sign * normalizedDistance.value * .24}px) rotateY(${sign * -42 * p}deg)`,
    boxShadow: `${sign * -18 * p}px 18px 38px rgba(2, 9, 20, ${0.12 + p * .22})`
  }
})
const underLabel = computed(() => props.underLabel || 'העמוד הבא')

function startDrag(direction: 'forward' | 'backward', event: PointerEvent) {
  drag.active = true
  drag.direction = direction
  drag.startX = event.clientX
  drag.currentX = event.clientX
  window.addEventListener('pointermove', moveDrag)
  window.addEventListener('pointerup', endDrag, { once: true })
}

function moveDrag(event: PointerEvent) {
  drag.currentX = event.clientX
  if (Math.abs(drag.currentX - drag.startX) > 6) drag.moved = true
}

function endDrag() {
  const shouldTurn = normalizedDistance.value > 118 || !drag.moved
  const direction = drag.direction
  window.removeEventListener('pointermove', moveDrag)
  drag.active = false
  drag.direction = ''
  drag.startX = 0
  drag.currentX = 0
  drag.moved = false
  if (shouldTurn) {
    if (direction === 'forward') emit('next')
    if (direction === 'backward') emit('prev')
  }
}
</script>

<style scoped>
.flip-stage {
  position: relative;
  perspective: 1200px;
  width: min(760px, 100%);
  margin: 0 auto;
  touch-action: pan-y;
}

.flip-card {
  position: relative;
  transform-origin: center;
  transition: transform .28s ease, box-shadow .28s ease;
  will-change: transform;
}

.dragging .flip-card {
  transition: none;
}

.under-page {
  position: absolute;
  inset: 8px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: rgba(18, 36, 59, .38);
  font-weight: 800;
  box-shadow: inset 0 0 0 1px rgba(19, 47, 82, .12);
}

.edge-hint {
  position: absolute;
  top: 8%;
  bottom: 8%;
  width: 46px;
  z-index: 12;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(214,184,102,.3), rgba(255,255,255,0));
  opacity: .8;
  touch-action: none;
}

.left-edge {
  left: -4px;
}

.right-edge {
  right: -4px;
  transform: scaleX(-1);
}

@media (max-width: 560px) {
  .edge-hint {
    top: 0;
    bottom: 0;
    width: 58px;
    opacity: .55;
  }

  .left-edge {
    left: -12px;
  }

  .right-edge {
    right: -12px;
  }
}

.curl {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 20;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(255,255,255,.02), rgba(255,255,255,.7), rgba(57, 36, 12, .18));
  filter: blur(.1px);
}

.forward .curl {
  left: 0;
  border-radius: 10px 0 0 10px;
}

.backward .curl {
  right: 0;
  transform: scaleX(-1);
  border-radius: 0 10px 10px 0;
}
</style>
