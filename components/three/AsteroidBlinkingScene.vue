<template>
  <section class="asteroid">
    <div class="plate-toolbar" aria-label="בקרת חשיפות">
      <div class="frame-tabs">
        <button
          v-for="(exposure, index) in exposures"
          :key="exposure.code"
          type="button"
          :class="{ active: frame === index }"
          @click="selectFrame(index)"
        >
          {{ exposure.code }}
        </button>
      </div>
      <button class="blink-toggle" type="button" :disabled="found" @click="toggleBlink">
        {{ isBlinking ? 'עצירת הבהוב' : 'הפעלת הבהוב' }}
      </button>
    </div>

    <button class="plate" type="button" aria-label="לוח זיהוי אסטרואיד" @click="checkClick">
      <span class="plate-grain" aria-hidden="true" />
      <span class="hot-column" aria-hidden="true" />

      <span
        v-for="trail in trails"
        :key="trail.id"
        class="survey-trail"
        :style="trailStyle(trail)"
        aria-hidden="true"
      />

      <span
        v-for="smear in smears"
        :key="smear.id"
        class="smear"
        :style="smearStyle(smear)"
        aria-hidden="true"
      />

      <span
        v-for="dot in plateDots"
        :key="dot.id"
        class="plate-dot"
        :style="dotStyle(dot)"
        aria-hidden="true"
      />

      <span class="moving-object" :class="{ found }" :style="movingStyle" aria-hidden="true" />

      <span class="crosshair-layer" :style="crosshairStyle" aria-hidden="true">
        <span class="crosshair-line horizontal" />
        <span class="crosshair-line vertical" />
        <span class="target-box" />
      </span>

      <span class="plate-label">{{ currentExposure.time }}</span>
      <span class="plate-mode">NEGATIVE FITS / BLINK</span>

      <span class="compass" aria-hidden="true">
        <span class="north">N</span>
        <span class="east">E</span>
      </span>

      <span class="zoom-chip" aria-hidden="true">
        <span class="zoom-grain" />
        <span class="zoom-reticle" />
        <span class="zoom-object" :class="{ found }" :style="zoomObjectStyle" />
      </span>
    </button>

    <p>{{ message }}</p>
    <button class="primary-button" type="button" :disabled="!found" @click="emit('ready')">
      אישור זיהוי
    </button>
  </section>
</template>

<script setup lang="ts">
type PlateDot = {
  id: number
  x: number
  y: number
  size: number
  stretch: number
  opacity: number
  angle: number
}

type Trail = {
  id: number
  x: number
  y: number
  width: number
  angle: number
  spacing: number
  dot: number
  opacity: number
}

type Smear = {
  id: number
  x: number
  y: number
  width: number
  height: number
  angle: number
  opacity: number
}

const emit = defineEmits<{ ready: [] }>()

const exposures = [
  { code: 'A', time: 'UTC 21:18:40' },
  { code: 'B', time: 'UTC 21:29:12' },
  { code: 'C', time: 'UTC 21:39:45' }
]

const targetTrack = [
  { x: 48.9, y: 47.1 },
  { x: 50.6, y: 48.7 },
  { x: 52.3, y: 50.2 }
]

const crosshair = { x: 50.6, y: 48.7 }
const frame = ref(0)
const found = ref(false)
const isBlinking = ref(true)
const message = ref('השוו בין החשיפות ולחצו על הנקודה היחידה שזזה ביחס לשדה הקבוע.')

const currentExposure = computed(() => exposures[frame.value])
const movingPosition = computed(() => targetTrack[frame.value])

const plateDots = Array.from({ length: 210 }, (_, id): PlateDot => {
  const size = 1.2 + random(id, 3) * 4.3
  return {
    id,
    x: 2 + random(id, 1) * 96,
    y: 4 + random(id, 2) * 90,
    size,
    stretch: 0.72 + random(id, 4) * 0.92,
    opacity: 0.36 + random(id, 5) * 0.58,
    angle: random(id, 6) * 180
  }
})

const trails: Trail[] = [
  { id: 1, x: -8, y: 26, width: 74, angle: -19, spacing: 17, dot: 4.2, opacity: 0.88 },
  { id: 2, x: 36, y: 31, width: 76, angle: -19, spacing: 18, dot: 4.5, opacity: 0.9 },
  { id: 3, x: -6, y: 62, width: 78, angle: -17, spacing: 17, dot: 4.8, opacity: 0.9 },
  { id: 4, x: 48, y: 58, width: 62, angle: -17, spacing: 18, dot: 4.4, opacity: 0.84 },
  { id: 5, x: 72, y: 10, width: 42, angle: 24, spacing: 15, dot: 4, opacity: 0.74 },
  { id: 6, x: 66, y: 84, width: 48, angle: -18, spacing: 17, dot: 4.3, opacity: 0.82 }
]

const smears: Smear[] = [
  { id: 1, x: 0, y: 70, width: 19, height: 4.8, angle: -18, opacity: 0.92 },
  { id: 2, x: 3, y: 91, width: 22, height: 3.5, angle: -15, opacity: 0.88 },
  { id: 3, x: 87, y: 44, width: 18, height: 3.3, angle: -15, opacity: 0.78 },
  { id: 4, x: 88, y: 68, width: 18, height: 3.9, angle: -16, opacity: 0.82 }
]

const movingStyle = computed(() => ({
  left: `${movingPosition.value.x}%`,
  top: `${movingPosition.value.y}%`
}))

const crosshairStyle = computed(() => ({
  '--cross-x': `${crosshair.x}%`,
  '--cross-y': `${crosshair.y}%`
}))

const zoomObjectStyle = computed(() => ({
  left: `${34 + frame.value * 13}%`,
  top: `${34 + frame.value * 10}%`
}))

let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => {
    if (!isBlinking.value || found.value) return
    frame.value = (frame.value + 1) % exposures.length
  }, 440)
})

onBeforeUnmount(() => window.clearInterval(timer))

function selectFrame(index: number) {
  frame.value = index
  isBlinking.value = false
}

function toggleBlink() {
  isBlinking.value = !isBlinking.value
}

function checkClick(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  const distance = Math.hypot(x - movingPosition.value.x, y - movingPosition.value.y)

  if (distance < 5.4) {
    found.value = true
    isBlinking.value = false
    message.value = 'זיהוי מדויק: זו נקודה חלשה שמשנה מיקום בין החשיפות, כמו אסטרואיד אמיתי.'
    return
  }

  if (Math.hypot(x - crosshair.x, y - crosshair.y) < 10) {
    message.value = 'זה אזור החיפוש הנכון. חכו להבהוב ולחצו על הנקודה שמשנה מקום.'
    return
  }

  message.value = 'זה נראה כמו רעש או כוכב קבוע. חפשו נקודה שזזה רק מעט בין A, B ו-C.'
}

function dotStyle(dot: PlateDot) {
  return {
    left: `${dot.x}%`,
    top: `${dot.y}%`,
    width: `${dot.size}px`,
    height: `${dot.size * dot.stretch}px`,
    opacity: dot.opacity,
    transform: `rotate(${dot.angle}deg)`
  }
}

function trailStyle(trail: Trail) {
  return {
    left: `${trail.x}%`,
    top: `${trail.y}%`,
    width: `${trail.width}%`,
    opacity: trail.opacity,
    transform: `rotate(${trail.angle}deg)`,
    '--trail-spacing': `${trail.spacing}px`,
    '--trail-dot': `${trail.dot}px`
  }
}

function smearStyle(smear: Smear) {
  return {
    left: `${smear.x}%`,
    top: `${smear.y}%`,
    width: `${smear.width}%`,
    height: `${smear.height}%`,
    opacity: smear.opacity,
    transform: `rotate(${smear.angle}deg)`
  }
}

function random(id: number, salt: number) {
  const value = Math.sin(id * 91.7 + salt * 37.11) * 10000
  return value - Math.floor(value)
}
</script>

<style scoped>
.asteroid {
  display: grid;
  gap: 10px;
}

.plate-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.frame-tabs {
  display: inline-grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface);
}

.frame-tabs button,
.blink-toggle {
  min-height: 36px;
  border: 0;
  color: var(--text);
  background: transparent;
  font-family: var(--font-body);
  font-weight: 500;
  cursor: pointer;
}

.frame-tabs button {
  min-width: 42px;
  border-inline-start: 1px solid var(--surface-border);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}

.frame-tabs button:first-child {
  border-inline-start: 0;
}

.frame-tabs button.active {
  color: var(--bg);
  background: var(--accent);
}

.blink-toggle {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 0 13px;
  background: var(--surface);
}

.blink-toggle:disabled {
  opacity: .52;
  cursor: default;
}

.plate {
  position: relative;
  display: block;
  width: 100%;
  height: clamp(285px, 56vw, 430px);
  overflow: hidden;
  border: 1px solid rgba(10, 20, 35, .42);
  border-radius: 6px;
  background:
    radial-gradient(circle at 48% 52%, rgba(255,255,255,.98), rgba(225,228,224,.94) 45%, rgba(188,195,194,.9) 100%),
    #e7ebe8;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.74),
    inset 0 0 28px rgba(0,0,0,.18),
    0 10px 24px rgba(16, 25, 41, .12);
  cursor: crosshair;
  touch-action: manipulation;
}

.plate::before,
.plate::after,
.plate-grain,
.hot-column {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
}

.plate::before {
  z-index: 1;
  background-image:
    radial-gradient(circle, rgba(0,0,0,.42) 0 1px, transparent 1.4px),
    radial-gradient(circle, rgba(0,0,0,.28) 0 .8px, transparent 1.2px),
    radial-gradient(circle, rgba(255,255,255,.72) 0 1px, transparent 1.5px);
  background-position: 0 0, 7px 11px, 4px 5px;
  background-size: 9px 11px, 13px 17px, 19px 23px;
  mix-blend-mode: multiply;
  opacity: .58;
}

.plate::after {
  z-index: 7;
  background:
    linear-gradient(90deg, rgba(255,255,255,.34), transparent 9%, transparent 91%, rgba(0,0,0,.08)),
    repeating-linear-gradient(0deg, rgba(0,0,0,.05) 0 1px, transparent 1px 6px);
  opacity: .42;
}

.plate-grain {
  z-index: 2;
  background:
    radial-gradient(circle at 12% 33%, rgba(0,0,0,.3) 0 .8px, transparent 1.3px),
    radial-gradient(circle at 64% 67%, rgba(0,0,0,.24) 0 .9px, transparent 1.35px),
    radial-gradient(circle at 83% 22%, rgba(0,0,0,.26) 0 .7px, transparent 1.2px);
  background-size: 11px 13px, 17px 19px, 23px 29px;
  opacity: .72;
}

.hot-column {
  z-index: 3;
  left: 58%;
  width: 1px;
  background: rgba(0,0,0,.34);
  box-shadow:
    -126px 0 rgba(0,0,0,.11),
    164px 0 rgba(255,255,255,.4);
  opacity: .42;
}

.plate-dot {
  position: absolute;
  z-index: 4;
  border-radius: 48%;
  background: #050505;
  box-shadow: 0 0 1px rgba(0,0,0,.78);
  pointer-events: none;
}

.survey-trail {
  position: absolute;
  z-index: 4;
  height: 14px;
  border-radius: 999px;
  background-image: radial-gradient(circle, rgba(0,0,0,.95) 0 var(--trail-dot), transparent calc(var(--trail-dot) + 1px));
  background-repeat: repeat-x;
  background-size: var(--trail-spacing) 14px;
  filter: blur(.12px);
  pointer-events: none;
}

.smear {
  position: absolute;
  z-index: 4;
  border-radius: 999px;
  background:
    radial-gradient(ellipse at 72% 50%, rgba(0,0,0,.94), rgba(0,0,0,.86) 48%, transparent 70%);
  filter: blur(.8px);
  pointer-events: none;
}

.moving-object {
  position: absolute;
  z-index: 6;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #020202;
  box-shadow:
    0 0 0 1px rgba(0,0,0,.88),
    0 0 6px rgba(0,0,0,.34);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.moving-object.found {
  background: #070707;
  box-shadow:
    0 0 0 2px #d31111,
    0 0 0 7px rgba(211,17,17,.18);
}

.crosshair-layer {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
}

.crosshair-line {
  position: absolute;
  background: rgba(206, 0, 0, .9);
  box-shadow: 0 0 0 1px rgba(255,255,255,.24);
}

.crosshair-line.horizontal {
  top: var(--cross-y);
  right: 0;
  left: 0;
  height: 1px;
}

.crosshair-line.vertical {
  top: 0;
  bottom: 0;
  left: var(--cross-x);
  width: 1px;
}

.target-box {
  position: absolute;
  top: var(--cross-y);
  left: var(--cross-x);
  width: 22px;
  height: 22px;
  border: 2px solid rgba(206, 0, 0, .92);
  transform: translate(-50%, -50%);
  background: rgba(255,255,255,.08);
}

.plate-label,
.plate-mode {
  position: absolute;
  z-index: 9;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-weight: 900;
  color: rgba(0,0,0,.78);
  text-shadow: 0 1px rgba(255,255,255,.7);
  pointer-events: none;
}

.plate-label {
  top: 10px;
  left: 12px;
  font-size: .78rem;
}

.plate-mode {
  top: 10px;
  right: 12px;
  font-size: .7rem;
  letter-spacing: 0;
}

.compass {
  position: absolute;
  z-index: 9;
  bottom: 12px;
  left: 50%;
  width: 72px;
  height: 72px;
  border: 2px solid rgba(255,255,255,.78);
  background: #050505;
  color: #f2d65d;
  transform: translateX(-50%);
  pointer-events: none;
}

.compass::before,
.compass::after {
  position: absolute;
  content: '';
  background: #f4f4f4;
}

.compass::before {
  right: 18px;
  bottom: 16px;
  width: 2px;
  height: 43px;
}

.compass::after {
  right: 18px;
  bottom: 16px;
  width: 45px;
  height: 2px;
}

.north,
.east {
  position: absolute;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: .9rem;
  font-weight: 900;
}

.north {
  top: 6px;
  right: 12px;
}

.east {
  bottom: 8px;
  left: 8px;
}

.zoom-chip {
  position: absolute;
  z-index: 9;
  right: 14px;
  bottom: 14px;
  width: min(138px, 26%);
  aspect-ratio: 1;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,.88);
  background: #e9ece8;
  box-shadow: 0 0 0 1px rgba(0,0,0,.2);
  pointer-events: none;
}

.zoom-grain,
.zoom-reticle,
.zoom-object {
  position: absolute;
}

.zoom-grain {
  inset: 0;
  background-image:
    radial-gradient(circle, #0b0b0b 0 2.2px, transparent 2.9px),
    radial-gradient(circle, rgba(0,0,0,.6) 0 1.6px, transparent 2.2px);
  background-position: 0 0, 6px 8px;
  background-size: 13px 15px, 17px 19px;
  opacity: .72;
}

.zoom-reticle {
  inset: 50% auto auto 50%;
  width: 22px;
  height: 22px;
  border: 1px solid rgba(208,0,0,.8);
  transform: translate(-50%, -50%);
}

.zoom-reticle::before,
.zoom-reticle::after {
  position: absolute;
  content: '';
  background: rgba(208,0,0,.8);
}

.zoom-reticle::before {
  top: 50%;
  right: -42px;
  left: -42px;
  height: 1px;
}

.zoom-reticle::after {
  top: -42px;
  bottom: -42px;
  left: 50%;
  width: 1px;
}

.zoom-object {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #020202;
  transform: translate(-50%, -50%);
}

.zoom-object.found {
  box-shadow: 0 0 0 3px rgba(211,17,17,.65);
}

p {
  margin: 0;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-weight: 500;
  line-height: 1.45;
}

@media (max-width: 560px) {
  .plate-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .frame-tabs,
  .blink-toggle {
    width: 100%;
  }

  .plate {
    height: 360px;
  }

  .compass {
    width: 58px;
    height: 58px;
  }

  .zoom-chip {
    width: 118px;
  }
}
</style>
