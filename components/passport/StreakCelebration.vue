<template>
  <div class="streak-scene" :class="{ 'has-orbit': streak >= 2, 'has-satellites': streak >= 3, 'is-celebrating': outcome === 'correct' }" aria-hidden="true">
    <div v-if="streak >= 2 && outcome !== 'wrong'" class="space-scene">
      <div class="earth"><i /><b /><em /></div>
      <div class="rocket"><span class="rocket-window" /><span class="rocket-flame" /></div>
      <div v-if="streak >= 3" class="orbit orbit-one"><span class="satellite"><i /><b /></span></div>
      <div v-if="streak >= 3" class="orbit orbit-two"><span class="satellite"><i /><b /></span></div>
    </div>

    <div v-if="outcome === 'correct'" class="feedback correct-feedback" role="presentation">
      <div class="hands"><span class="hand hand-right" /><span class="hand hand-left" /><i class="spark spark-one" /><i class="spark spark-two" /><i class="spark spark-three" /></div>
      <strong>{{ streak >= 3 ? 'רצף מסלולי!' : streak === 2 ? 'ממריאים קדימה!' : 'כל הכבוד!' }}</strong>
      <small>{{ streak }} תשובות נכונות ברצף</small>
    </div>

    <div v-else-if="outcome === 'wrong'" class="feedback wrong-feedback" role="presentation">
      <div class="sad-face"><i /><i /><b /></div>
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
.streak-scene { position: fixed; inset: 0; z-index: 40; overflow: hidden; pointer-events: none; }
.space-scene { position: absolute; inset: 10% 0 auto; height: 210px; opacity: .22; filter: saturate(1.15); transition: opacity .2s ease; }
.is-celebrating .space-scene { opacity: .86; }
.earth { position: absolute; width: 128px; aspect-ratio: 1; inset: 45px auto auto 7%; border-radius: 50%; overflow: hidden; background: radial-gradient(circle at 34% 28%, #86e9ff 0 5%, #00aeef 22%, #1767c2 60%, #190c4f 100%); box-shadow: 0 0 34px rgba(var(--accent-rgb), .72); animation: earth-float 4.2s ease-in-out infinite; }
.earth::after { content: ''; position: absolute; inset: -10%; border-radius: 50%; background: repeating-radial-gradient(ellipse at 15% 35%, transparent 0 15px, rgba(255,255,255,.23) 16px 20px, transparent 21px 36px); transform: rotate(-20deg); }
.earth i, .earth b, .earth em { position: absolute; display: block; border-radius: 55% 45% 47% 53%; background: #66d69a; z-index: 1; }
.earth i { width: 42px; height: 30px; top: 43px; right: 9px; transform: rotate(22deg); }.earth b { width: 34px; height: 45px; bottom: 15px; left: 17px; transform: rotate(-28deg); }.earth em { width: 24px; height: 20px; top: 18px; left: 22px; }
.rocket { position: absolute; width: 22px; height: 66px; inset: 8px auto auto 45%; border-radius: 50% 50% 35% 35%; background: linear-gradient(90deg, #fff 0 48%, #c4efff 49%); transform: rotate(28deg); animation: rocket-lift 2.8s ease-in-out infinite; }
.rocket::before, .rocket::after { content: ''; position: absolute; bottom: 7px; width: 14px; height: 18px; background: var(--highlight); }.rocket::before { left: -9px; clip-path: polygon(100% 0, 100% 100%, 0 100%); }.rocket::after { right: -9px; clip-path: polygon(0 0, 100% 100%, 0 100%); }.rocket-window { position: absolute; width: 9px; aspect-ratio: 1; border-radius: 50%; top: 13px; left: 6px; background: var(--bg); }.rocket-flame { position: absolute; bottom: -24px; left: 6px; border-inline: 5px solid transparent; border-top: 25px solid #ffcc4d; filter: drop-shadow(0 0 7px #ff7638); }
.orbit { position: absolute; width: 214px; height: 84px; border: 1px solid rgba(var(--accent-rgb), .58); border-radius: 50%; inset: 66px auto auto 0; transform: rotate(-18deg); animation: orbit 7s linear infinite; }.orbit-two { inset: 57px auto auto 4%; transform: rotate(44deg); animation-duration: 9s; animation-direction: reverse; }.satellite { position: absolute; top: -6px; left: 21px; display: flex; align-items: center; width: 23px; height: 11px; border-radius: 3px; background: #edfaff; box-shadow: 0 0 9px rgba(255,255,255,.7); }.satellite::before, .satellite::after { content: ''; width: 16px; height: 9px; background: var(--accent); }.satellite::before { margin-right: -16px; transform: translateX(-16px); }.satellite::after { margin-left: 23px; }.satellite i { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: var(--highlight); }
.feedback { position: absolute; inset: 46% 18px auto; z-index: 42; display: grid; justify-items: center; gap: 5px; padding: 18px; border: 1px solid rgba(var(--accent-rgb), .6); border-radius: 16px; color: var(--text); text-align: center; background: rgba(var(--bg-rgb), .94); box-shadow: 0 15px 48px rgba(var(--bg-rgb), .48), 0 0 36px rgba(var(--accent-rgb), .4); transform: translateY(-50%); backdrop-filter: blur(8px); }.feedback strong { font-family: var(--font-head); font-size: 1.3rem; }.feedback small { color: var(--text-muted); font-weight: 500; }.correct-feedback { animation: feedback-in 1.2s ease both; }.wrong-feedback { border-color: rgba(var(--red-rgb), .8); animation: feedback-in .38s ease both; }
.hands { position: relative; width: 104px; height: 58px; }.hand { position: absolute; bottom: 3px; width: 32px; height: 52px; border-radius: 42% 42% 22% 22%; background: linear-gradient(90deg, #ffd6b7, #f0a879); box-shadow: inset -5px 0 rgba(143,65,49,.16); }.hand::before { content: ''; position: absolute; top: -10px; width: 13px; height: 31px; border-radius: 8px; background: inherit; }.hand-right { left: 22px; transform: rotate(-23deg); animation: clap-right .36s ease-in-out infinite alternate; }.hand-right::before { right: -4px; transform: rotate(-13deg); }.hand-left { right: 22px; transform: rotate(23deg) scaleX(-1); animation: clap-left .36s ease-in-out infinite alternate; }.hand-left::before { right: -4px; transform: rotate(-13deg); }.spark { position: absolute; width: 5px; aspect-ratio: 1; border-radius: 50%; background: var(--accent); }.spark-one { top: 2px; left: 50%; }.spark-two { top: 15px; left: 15px; background: var(--highlight); }.spark-three { top: 15px; right: 15px; background: #ffcc4d; }
.sad-face { position: relative; width: 68px; aspect-ratio: 1; border-radius: 50%; background: #ffd36b; box-shadow: 0 0 21px rgba(255,211,107,.3); }.sad-face i { position: absolute; top: 23px; width: 7px; aspect-ratio: 1; border-radius: 50%; background: var(--bg); }.sad-face i:first-child { left: 19px; }.sad-face i:nth-child(2) { right: 19px; }.sad-face b { position: absolute; width: 26px; height: 13px; inset: auto 21px 13px; border-top: 4px solid var(--bg); border-radius: 50% 50% 0 0; }
@keyframes feedback-in { 0% { opacity: 0; transform: translateY(-44%) scale(.78); } 24% { opacity: 1; transform: translateY(-50%) scale(1.05); } 100% { opacity: 1; transform: translateY(-50%) scale(1); } } @keyframes clap-right { to { transform: rotate(-6deg) translate(7px, -5px); } } @keyframes clap-left { to { transform: rotate(6deg) scaleX(-1) translate(7px, -5px); } } @keyframes earth-float { 50% { transform: translateY(-10px) rotate(6deg); } } @keyframes rocket-lift { 50% { transform: translate(25px, -34px) rotate(28deg); } } @keyframes orbit { to { rotate: 360deg; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; } }
</style>
