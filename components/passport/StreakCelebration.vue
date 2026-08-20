<template>
  <div v-if="outcome" class="streak-scene" :class="`is-${outcome}`" aria-hidden="true">
    <div v-if="outcome === 'correct'" class="orbital-stage">
      <span class="trajectory trajectory-primary" />
      <span v-if="streak >= 2" class="trajectory trajectory-secondary" />
      <span v-if="streak >= 3" class="orbital-craft craft-primary"><i /></span>
      <span v-if="streak >= 3" class="orbital-craft craft-secondary"><i /></span>
    </div>

    <div v-if="outcome === 'correct'" class="feedback correct-feedback" role="presentation">
      <div class="status-lock status-confirmed">
        <i class="lock-ring lock-ring-outer" />
        <i class="lock-ring lock-ring-inner" />
        <span class="status-glyph" />
      </div>
      <strong>{{ streak >= 3 ? 'רצף מסלולי!' : streak === 2 ? 'ממריאים קדימה!' : 'כל הכבוד!' }}</strong>
      <small>{{ streak }} תשובות נכונות ברצף</small>
    </div>

    <div v-else class="feedback wrong-feedback" role="presentation">
      <div class="status-lock status-retry">
        <i class="lock-ring lock-ring-outer" />
        <span class="status-glyph" />
      </div>
      <strong>לא נורא, נסו שוב</strong>
      <small>הרצף מתחיל מחדש</small>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  streak: number
  outcome?: 'correct' | 'wrong' | ''
}>(), { outcome: '' })
</script>

<style scoped>
.streak-scene {
  position: fixed;
  inset: 0;
  z-index: 40;
  overflow: hidden;
  pointer-events: none;
  isolation: isolate;
}

.orbital-stage {
  position: absolute;
  inset: 0;
  opacity: 0;
  animation: orbital-stage-in 1.15s cubic-bezier(.22, .68, .28, 1) both;
}

.trajectory {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(134vw, 680px);
  aspect-ratio: 2.45 / 1;
  border: 1px solid rgba(var(--accent-rgb), .48);
  border-radius: 50%;
  opacity: 0;
  transform: translate(-50%, -50%) rotate(-15deg) scale(.82);
  animation: trajectory-resolve 1.05s cubic-bezier(.2, .72, .25, 1) both;
}

.trajectory::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 18px rgba(var(--accent-rgb), .82);
  content: '';
  transform: translate(-50%, -50%);
}

.trajectory-secondary {
  width: min(108vw, 560px);
  border-color: rgba(var(--highlight-rgb), .42);
  transform: translate(-50%, -50%) rotate(22deg) scale(.82);
  animation-delay: .08s;
}

.orbital-craft {
  position: absolute;
  z-index: 1;
  display: block;
  width: 58px;
  height: 16px;
  opacity: 0;
  animation: craft-pass-primary 1.05s cubic-bezier(.2, .64, .32, 1) both;
}

.orbital-craft::before,
.orbital-craft::after {
  position: absolute;
  top: 3px;
  width: 19px;
  height: 10px;
  border: 1px solid rgba(var(--accent-rgb), .76);
  background:
    linear-gradient(90deg, transparent 47%, rgba(var(--accent-rgb), .55) 48% 52%, transparent 53%),
    linear-gradient(rgba(var(--accent-rgb), .46) 48%, transparent 49%);
  content: '';
}

.orbital-craft::before { left: 0; }
.orbital-craft::after { right: 0; }

.orbital-craft i {
  position: absolute;
  top: 1px;
  left: 22px;
  width: 14px;
  height: 14px;
  border: 1px solid rgba(var(--text-rgb), .78);
  border-radius: 3px;
  background: var(--bg-2);
  box-shadow: 0 0 14px rgba(var(--accent-rgb), .44);
}

.orbital-craft i::after {
  position: absolute;
  top: -6px;
  left: 5px;
  width: 2px;
  height: 6px;
  background: rgba(var(--text-rgb), .72);
  content: '';
}

.craft-primary {
  top: 28%;
  left: -70px;
}

.craft-secondary {
  right: -70px;
  bottom: 25%;
  transform: rotate(180deg) scale(.82);
  animation-name: craft-pass-secondary;
  animation-delay: .1s;
}

.feedback {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  display: grid;
  width: min(calc(100% - 32px), 360px);
  justify-items: center;
  gap: 7px;
  padding: 20px;
  border: 1px solid rgba(var(--accent-rgb), .6);
  border-radius: 16px;
  color: var(--text);
  text-align: center;
  background: rgba(var(--bg-rgb), .94);
  box-shadow: 0 15px 48px rgba(var(--bg-rgb), .48), 0 0 36px rgba(var(--accent-rgb), .4);
  transform: translate(-50%, -50%);
  backdrop-filter: blur(8px);
}

.feedback strong {
  font-family: var(--font-head);
  font-size: 1.3rem;
}

.feedback small {
  color: var(--text-muted);
  font-weight: 500;
}

.correct-feedback {
  animation: feedback-confirm 1.15s cubic-bezier(.22, .68, .28, 1) both;
}

.wrong-feedback {
  border-color: rgba(var(--red-rgb), .8);
  box-shadow: 0 15px 48px rgba(var(--bg-rgb), .48);
  animation: feedback-retry .34s cubic-bezier(.25, .72, .36, 1) both;
}

.status-lock {
  position: relative;
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
}

.lock-ring {
  position: absolute;
  border: 1px solid rgba(var(--accent-rgb), .68);
  border-radius: 50%;
}

.lock-ring-outer {
  inset: 1px;
  border-style: dashed;
  animation: lock-rotate 1.15s cubic-bezier(.16, .7, .22, 1) both;
}

.lock-ring-inner {
  inset: 11px;
  opacity: .66;
  animation: lock-contract .62s cubic-bezier(.2, .8, .3, 1) both;
}

.status-glyph {
  position: relative;
  width: 42px;
  height: 42px;
  border: 1px solid var(--accent);
  border-radius: 50%;
  background: rgba(var(--accent-rgb), .12);
  box-shadow: inset 0 0 18px rgba(var(--accent-rgb), .12);
}

.status-confirmed .status-glyph::after {
  position: absolute;
  top: 11px;
  left: 10px;
  width: 19px;
  height: 10px;
  border-bottom: 3px solid var(--accent);
  border-left: 3px solid var(--accent);
  content: '';
  transform: rotate(-45deg) scale(0);
  transform-origin: 50% 70%;
  animation: confirm-mark .28s .22s cubic-bezier(.2, .9, .3, 1.35) forwards;
}

.status-retry .lock-ring {
  border-color: rgba(var(--red-rgb), .74);
  animation-duration: .34s;
}

.status-retry .status-glyph {
  border-color: var(--red);
  background: rgba(var(--red-rgb), .14);
}

.status-retry .status-glyph::before,
.status-retry .status-glyph::after {
  position: absolute;
  top: 19px;
  left: 10px;
  width: 20px;
  height: 2px;
  background: var(--error-text);
  content: '';
}

.status-retry .status-glyph::before { transform: rotate(45deg); }
.status-retry .status-glyph::after { transform: rotate(-45deg); }

@keyframes orbital-stage-in {
  0% { opacity: 0; }
  18%, 78% { opacity: .88; }
  100% { opacity: 0; }
}

@keyframes trajectory-resolve {
  0% { opacity: 0; transform: translate(-50%, -50%) rotate(-15deg) scale(.82); }
  34% { opacity: .72; }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(-15deg) scale(1.04); }
}

@keyframes craft-pass-primary {
  0% { opacity: 0; transform: translate3d(0, 68px, 0) rotate(-12deg) scale(.72); }
  20%, 72% { opacity: .82; }
  100% { opacity: 0; transform: translate3d(calc(100vw + 140px), -54px, 0) rotate(-12deg) scale(.94); }
}

@keyframes craft-pass-secondary {
  0% { opacity: 0; transform: translate3d(0, 34px, 0) rotate(180deg) scale(.68); }
  24%, 70% { opacity: .68; }
  100% { opacity: 0; transform: translate3d(calc(-100vw - 140px), -70px, 0) rotate(180deg) scale(.88); }
}

@keyframes feedback-confirm {
  0% { opacity: 0; transform: translate(-50%, calc(-50% + 16px)) scale(.96); }
  28% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  82% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, calc(-50% - 8px)) scale(.99); }
}

@keyframes feedback-retry {
  from { opacity: 0; transform: translate(-50%, calc(-50% + 10px)) scale(.98); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

@keyframes lock-rotate {
  from { opacity: 0; transform: rotate(-42deg) scale(.82); }
  34% { opacity: 1; }
  to { opacity: .68; transform: rotate(20deg) scale(1); }
}

@keyframes lock-contract {
  from { opacity: 0; transform: scale(1.35); }
  to { opacity: .66; transform: scale(1); }
}

@keyframes confirm-mark {
  to { transform: rotate(-45deg) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: .01ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
