<template>
  <div v-if="outcome" class="streak-scene" :class="`is-${outcome}`">
    <button
      v-if="outcome === 'wrong'"
      class="dismiss-layer"
      type="button"
      aria-label="סגירת ההודעה וניסיון נוסף"
      @click="emit('dismiss')"
    />

    <div v-if="outcome === 'correct'" class="celebration-stage" aria-hidden="true">
      <i
        v-for="(piece, index) in confettiPieces"
        :key="index"
        class="confetti"
        :class="`confetti-${(index % 4) + 1}`"
        :style="piece"
      />

      <div class="applause-crowd">
        <span>👏</span><span>👏</span><span>👏</span><span>👏</span><span>👏</span>
      </div>

      <span v-if="streak >= 2" class="spacecraft craft-primary">
        <svg viewBox="0 0 120 58" role="presentation">
          <path class="rocket-body" d="M9 31 37 20C53 7 74 2 102 4c-5 20-18 35-39 43L31 51Z" />
          <path class="rocket-window" d="M69 15c8-4 16-5 24-5-3 7-7 13-12 18Z" />
          <path class="rocket-fin" d="m43 21-14-16 28 9M38 44 20 57l34-8" />
          <path class="rocket-flame" d="m24 27-22 4 22 7-8-7Z" />
        </svg>
      </span>

      <span v-if="streak >= 3" class="spacecraft craft-secondary">
        <svg viewBox="0 0 120 58" role="presentation">
          <path class="rocket-body" d="M9 31 37 20C53 7 74 2 102 4c-5 20-18 35-39 43L31 51Z" />
          <path class="rocket-window" d="M69 15c8-4 16-5 24-5-3 7-7 13-12 18Z" />
          <path class="rocket-fin" d="m43 21-14-16 28 9M38 44 20 57l34-8" />
          <path class="rocket-flame" d="m24 27-22 4 22 7-8-7Z" />
        </svg>
      </span>
    </div>

    <div
      class="feedback"
      :class="outcome === 'correct' ? 'correct-feedback' : 'wrong-feedback'"
      :role="outcome === 'wrong' ? 'alertdialog' : 'status'"
      aria-live="assertive"
    >
      <div v-if="outcome === 'correct'" class="clap-focus" aria-hidden="true">👏</div>
      <div v-else class="retry-mark" aria-hidden="true">×</div>
      <strong>{{ feedbackTitle }}</strong>
      <small v-if="outcome === 'correct'">{{ streak }} תשובות נכונות ברצף</small>
      <small v-else>נסו שוב בעוד רגע · לחצו כדי להמשיך עכשיו</small>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  streak: number
  outcome?: 'correct' | 'wrong' | ''
}>(), { outcome: '' })

const emit = defineEmits<{ dismiss: [] }>()

const confettiPieces = Array.from({ length: 22 }, (_, index) => ({
  '--x': `${(index * 43) % 100}%`,
  '--delay': `${(index % 7) * 35}ms`,
  '--drift': `${((index % 5) - 2) * 23}px`
}))

const feedbackTitle = computed(() => {
  if (props.outcome === 'wrong') return 'לא נורא, נסו שוב'
  if (props.streak >= 3) return 'רצף חללי!'
  if (props.streak === 2) return 'ממריאים קדימה!'
  return 'כל הכבוד!'
})
</script>

<style scoped>
.streak-scene {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow: hidden;
  pointer-events: none;
  isolation: isolate;
}

.streak-scene::before {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 45%, rgba(var(--accent-rgb), .18), rgba(var(--bg-rgb), .2) 45%, rgba(var(--bg-rgb), .58));
  content: '';
  animation: scene-flash 1.45s ease-out both;
}

.is-wrong { pointer-events: auto; }

.is-wrong::before {
  background: rgba(var(--bg-rgb), .42);
  animation: fade-in .2s ease both;
}

.dismiss-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.celebration-stage {
  position: absolute;
  inset: 0;
}

.applause-crowd {
  position: absolute;
  right: 50%;
  bottom: 6%;
  display: flex;
  align-items: end;
  gap: clamp(3px, 2vw, 16px);
  font-size: clamp(2rem, 10vw, 5rem);
  transform: translateX(50%);
  filter: drop-shadow(0 8px 12px rgba(var(--bg-rgb), .5));
}

.applause-crowd span {
  opacity: 0;
  animation: crowd-clap .34s calc(var(--delay, 0) * 1ms) ease-in-out 4 alternate;
}

.applause-crowd span:nth-child(1) { --delay: 110; transform: scale(.72) rotate(-14deg); }
.applause-crowd span:nth-child(2) { --delay: 20; transform: scale(.9) rotate(8deg); }
.applause-crowd span:nth-child(3) { --delay: 70; transform: scale(1.08); }
.applause-crowd span:nth-child(4) { --delay: 0; transform: scale(.9) rotate(-8deg); }
.applause-crowd span:nth-child(5) { --delay: 130; transform: scale(.72) rotate(14deg); }

.confetti {
  position: absolute;
  top: -24px;
  left: var(--x);
  width: 8px;
  height: 18px;
  border-radius: 2px;
  background: var(--accent);
  opacity: 0;
  animation: confetti-fall 1.45s var(--delay) cubic-bezier(.18, .72, .38, 1) both;
}

.confetti-2 { background: var(--highlight); }
.confetti-3 { background: #ffd45c; }
.confetti-4 { background: #fff; }

.spacecraft {
  position: absolute;
  width: clamp(92px, 27vw, 170px);
  opacity: 0;
  filter: drop-shadow(0 0 12px rgba(var(--accent-rgb), .62));
}

.spacecraft svg { width: 100%; overflow: visible; }
.rocket-body { fill: #eefaff; stroke: var(--accent); stroke-width: 2.2; }
.rocket-window { fill: var(--bg-2); stroke: var(--accent); stroke-width: 2; }
.rocket-fin { fill: var(--highlight); stroke: var(--accent); stroke-linejoin: round; stroke-width: 2; }
.rocket-flame {
  fill: #ffca42;
  stroke: #ff6b35;
  stroke-width: 2;
  animation: flame-pulse .12s ease-in-out infinite alternate;
  transform-origin: 24px 31px;
}

.craft-primary {
  top: 17%;
  left: -180px;
  animation: ship-pass 1.35s .05s cubic-bezier(.18, .58, .3, 1) both;
}

.craft-secondary {
  right: -180px;
  bottom: 24%;
  transform: scaleX(-1) scale(.78);
  animation: ship-pass-reverse 1.25s .18s cubic-bezier(.18, .58, .3, 1) both;
}

.feedback {
  position: absolute;
  top: 48%;
  left: 50%;
  z-index: 2;
  display: grid;
  width: min(calc(100% - 32px), 360px);
  justify-items: center;
  gap: 7px;
  padding: 20px;
  border: 1px solid rgba(var(--accent-rgb), .72);
  border-radius: 18px;
  color: var(--text);
  text-align: center;
  background: rgba(var(--bg-rgb), .94);
  box-shadow: 0 18px 54px rgba(var(--bg-rgb), .58), 0 0 42px rgba(var(--accent-rgb), .42);
  transform: translate(-50%, -50%);
  backdrop-filter: blur(10px);
}

.feedback strong { font-family: var(--font-head); font-size: 1.4rem; }
.feedback small { color: var(--text-muted); font-weight: 500; }

.correct-feedback { animation: success-card 1.45s cubic-bezier(.2, .76, .28, 1) both; }
.wrong-feedback {
  border-color: rgba(var(--red-rgb), .82);
  box-shadow: 0 18px 54px rgba(var(--bg-rgb), .58);
  animation: retry-card .28s cubic-bezier(.2, .82, .32, 1) both;
}

.clap-focus {
  font-size: 4.4rem;
  line-height: 1;
  animation: focus-clap .28s ease-in-out 5 alternate;
  transform-origin: 50% 90%;
}

.retry-mark {
  display: grid;
  width: 68px;
  aspect-ratio: 1;
  place-items: center;
  border: 2px solid var(--red);
  border-radius: 50%;
  color: var(--error-text);
  background: rgba(var(--red-rgb), .14);
  font-size: 3rem;
  line-height: 1;
}

@keyframes scene-flash {
  0% { opacity: 0; }
  14%, 76% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes crowd-clap { from { opacity: .35; translate: 0 18px; } to { opacity: 1; translate: 0 -7px; } }
@keyframes focus-clap { from { transform: scale(.88) rotate(-6deg); } to { transform: scale(1.12) rotate(6deg); } }

@keyframes confetti-fall {
  0% { opacity: 0; transform: translate3d(0, -20px, 0) rotate(0); }
  12% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(var(--drift), 92vh, 0) rotate(640deg); }
}

@keyframes ship-pass {
  0% { opacity: 0; transform: translate3d(0, 48px, 0) rotate(-10deg) scale(.75); }
  14%, 78% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(calc(100vw + 360px), -80px, 0) rotate(-10deg) scale(1); }
}

@keyframes ship-pass-reverse {
  0% { opacity: 0; transform: translate3d(0, 36px, 0) scaleX(-1) scale(.62) rotate(-8deg); }
  18%, 76% { opacity: .92; }
  100% { opacity: 0; transform: translate3d(calc(-100vw - 360px), -62px, 0) scaleX(-1) scale(.84) rotate(-8deg); }
}

@keyframes flame-pulse { to { transform: scaleX(1.3); filter: drop-shadow(-7px 0 5px #ff7b31); } }

@keyframes success-card {
  0% { opacity: 0; transform: translate(-50%, calc(-50% + 20px)) scale(.82); }
  18% { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
  75% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, calc(-50% - 10px)) scale(.98); }
}

@keyframes retry-card {
  from { opacity: 0; transform: translate(-50%, calc(-50% + 12px)) scale(.95); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
