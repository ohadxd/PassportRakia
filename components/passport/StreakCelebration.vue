<template>
  <div v-if="outcome" class="streak-scene" :class="`is-${outcome}`" aria-hidden="true">
    <div v-if="outcome === 'correct' && streak >= 3" class="orbital-stage">
      <span class="trajectory trajectory-primary" />
      <span class="trajectory trajectory-secondary" />
      <span class="orbital-craft craft-primary"><i /></span>
      <span class="orbital-craft craft-secondary"><i /></span>
    </div>

    <div v-if="outcome === 'correct' && streak < 3" class="applause-stage">
      <span
        v-for="piece in 24"
        :key="piece"
        class="confetti-piece"
        :style="confettiStyle(piece)"
      />
      <div class="clapping-hands">
        <span class="hand hand-left">👏</span>
        <span class="hand hand-right">👏</span>
      </div>
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

function confettiStyle(piece: number) {
  const colors = ['#00AEEF', '#D6047F', '#f7d154', '#ffffff', '#6ee7b7']
  return {
    left: `${(piece * 37) % 100}%`,
    backgroundColor: colors[piece % colors.length],
    '--confetti-delay': `${(piece % 6) * 0.07}s`,
    '--confetti-drift': `${((piece % 7) - 3) * 18}px`,
    '--confetti-turn': `${180 + (piece % 5) * 90}deg`
  }
}
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
  animation: orbital-stage-in 4s ease-in-out both;
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
  animation: trajectory-resolve 3.8s ease-in-out both;
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
  width: 112px;
  height: 34px;
  opacity: 0;
  filter: drop-shadow(0 8px 14px rgba(var(--bg-deep-rgb), .46));
  animation: craft-pass-primary 4s cubic-bezier(.22, .58, .3, 1) both;
}

.orbital-craft::before,
.orbital-craft::after {
  position: absolute;
  top: 7px;
  width: 40px;
  height: 20px;
  border: 1px solid rgba(var(--text-rgb), .68);
  border-radius: 2px;
  background:
    repeating-linear-gradient(90deg, transparent 0 8px, rgba(var(--text-rgb), .32) 8px 9px),
    repeating-linear-gradient(0deg, transparent 0 6px, rgba(var(--text-rgb), .28) 6px 7px),
    linear-gradient(135deg, #164f84, #082948);
  content: '';
}

.orbital-craft::before { left: 0; }
.orbital-craft::after { right: 0; }

.orbital-craft i {
  position: absolute;
  top: 7px;
  left: 44px;
  width: 24px;
  height: 20px;
  border: 1px solid rgba(var(--text-rgb), .78);
  border-radius: 4px;
  background: linear-gradient(135deg, #dce5eb, #667987 55%, #263844);
  box-shadow: 0 0 14px rgba(var(--accent-rgb), .44);
}

.orbital-craft i::before {
  position: absolute;
  top: -14px;
  left: 4px;
  width: 14px;
  height: 9px;
  border: 2px solid rgba(var(--text-rgb), .82);
  border-bottom: 0;
  border-radius: 50% 50% 0 0;
  content: '';
}

.orbital-craft i::after {
  position: absolute;
  top: -7px;
  left: 11px;
  width: 2px;
  height: 8px;
  background: rgba(var(--text-rgb), .78);
  content: '';
}

.craft-primary {
  top: 25%;
  left: -130px;
}

.craft-secondary {
  right: -130px;
  bottom: 23%;
  transform: rotate(180deg) scale(.82);
  animation-name: craft-pass-secondary;
  animation-delay: .18s;
}

.applause-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -20px;
  width: 9px;
  height: 16px;
  border-radius: 2px;
  opacity: 0;
  animation: confetti-fall 1.85s var(--confetti-delay) cubic-bezier(.18, .68, .36, 1) both;
}

.clapping-hands {
  position: absolute;
  left: 50%;
  bottom: 12%;
  display: flex;
  gap: 8px;
  font-size: clamp(3.5rem, 18vw, 6.5rem);
  filter: drop-shadow(0 12px 24px rgba(var(--bg-deep-rgb), .48));
  transform: translateX(-50%);
  animation: hands-enter 2s ease both;
}

.hand {
  display: block;
  transform-origin: 50% 85%;
}

.hand-left { animation: clap-left .38s ease-in-out 4 alternate; }
.hand-right { animation: clap-right .38s ease-in-out 4 alternate; }

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
  animation: feedback-confirm 2s cubic-bezier(.22, .68, .28, 1) both;
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
  8%, 90% { opacity: .92; }
  100% { opacity: 0; }
}

@keyframes trajectory-resolve {
  0% { opacity: 0; transform: translate(-50%, -50%) rotate(-15deg) scale(.82); }
  18%, 82% { opacity: .72; }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(-15deg) scale(1.04); }
}

@keyframes craft-pass-primary {
  0% { opacity: 0; transform: translate3d(0, 74px, 0) rotate(-8deg) scale(.78); }
  10%, 88% { opacity: .96; }
  48% { transform: translate3d(calc(50vw + 70px), -10px, 0) rotate(-3deg) scale(.9); }
  100% { opacity: 0; transform: translate3d(calc(100vw + 260px), -72px, 0) rotate(3deg) scale(1); }
}

@keyframes craft-pass-secondary {
  0% { opacity: 0; transform: translate3d(0, 38px, 0) rotate(184deg) scale(.72); }
  12%, 86% { opacity: .82; }
  52% { transform: translate3d(calc(-50vw - 70px), -18px, 0) rotate(180deg) scale(.84); }
  100% { opacity: 0; transform: translate3d(calc(-100vw - 260px), -82px, 0) rotate(176deg) scale(.94); }
}

@keyframes confetti-fall {
  0% { opacity: 0; transform: translate3d(0, -12px, 0) rotate(0); }
  12% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(var(--confetti-drift), 105vh, 0) rotate(var(--confetti-turn)); }
}

@keyframes hands-enter {
  0% { opacity: 0; transform: translate(-50%, 36px) scale(.8); }
  18%, 78% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -12px) scale(.96); }
}

@keyframes clap-left {
  from { transform: rotate(-18deg) translateX(-5px); }
  to { transform: rotate(8deg) translateX(7px); }
}

@keyframes clap-right {
  from { transform: scaleX(-1) rotate(-18deg) translateX(-5px); }
  to { transform: scaleX(-1) rotate(8deg) translateX(7px); }
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
