<template>
  <div ref="stage" class="flip-stage">
    <!-- העמוד הנחשף מתחת בזמן ההיפוך (נייר קל; התוכן החי נטען אחרי ההיפוך) -->
    <div v-if="direction" class="under-page paper">
      <span class="paper-title">{{ underTitle }}</span>
    </div>

    <!-- הדף המתקפל: פן קדמי = העמוד החי, פן אחורי = נייר; הקימור הרך נוצר ע"י
         שכבת הצללה/הדגשה על פני הדף עצמו (לא שכבה צפה נפרדת). -->
    <div class="leaf" :class="{ dragging: phase === 'dragging', curling: !!direction, back: direction === 'backward' }" :style="leafStyle">
      <div class="leaf-face leaf-front">
        <slot />
        <div class="curl-shade" :style="shadeStyle" />
      </div>
      <div class="leaf-face leaf-back paper" />
    </div>

    <!-- אזורי קצה שקופים לתפיסת הגרירה (לא חוסמים את תוכן העמוד).
         הכיוון נקבע לפי כיוון הגרירה: ימינה = קדימה, שמאלה = אחורה. -->
    <div v-if="canPrev || canNext" class="edge-zone start-edge" @pointerdown.prevent="startDrag($event)" />
    <div v-if="canPrev || canNext" class="edge-zone end-edge" @pointerdown.prevent="startDrag($event)" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  canNext: boolean
  canPrev: boolean
  nextLabel?: string
  prevLabel?: string
}>()
const emit = defineEmits<{ next: []; prev: [] }>()

const FULL_ANGLE = 180
const DURATION = 460
const COMMIT_PROGRESS = 0.5
const FLICK_SPEED = 0.8 // px/ms
const DECIDE_THRESHOLD = 8 // px עד שמחליטים כיוון

const stage = ref<HTMLElement | null>(null)
const phase = ref<'idle' | 'dragging' | 'settling'>('idle')
const direction = ref<'' | 'forward' | 'backward'>('')
const angle = ref(0)
const noAnim = ref(false)

let startX = 0
let currentX = 0
let startT = 0
let stageWidth = 1

const progress = computed(() => Math.min(1, Math.abs(angle.value) / FULL_ANGLE))
const underTitle = computed(() => (direction.value === 'forward' ? props.nextLabel : props.prevLabel) || '')

const leafStyle = computed(() => ({
  transform: `rotateY(${angle.value}deg)`,
  // קדימה מתקפל סביב הכריכה הימנית; אחורה סביב הכריכה השמאלית.
  transformOrigin: direction.value === 'backward' ? '0% 50%' : '100% 50%',
  transition: noAnim.value ? 'none' : undefined
}))

// עוצמת הקימור גדלה עם הזווית (חזקה יותר כדי שייראה ממש מתעגל).
const shadeStyle = computed(() => ({ opacity: String(Math.min(1, progress.value * 1.35)) }))

function startDrag(event: PointerEvent) {
  if (phase.value === 'settling') return
  stageWidth = stage.value?.getBoundingClientRect().width || 1
  phase.value = 'dragging'
  direction.value = '' // יוכרע לפי כיוון הגרירה
  noAnim.value = false
  startX = currentX = event.clientX
  startT = performance.now()
  angle.value = 0
  window.addEventListener('pointermove', moveDrag)
  window.addEventListener('pointerup', endDrag, { once: true })
}

function moveDrag(event: PointerEvent) {
  currentX = event.clientX
  const dx = currentX - startX
  if (!direction.value) {
    if (Math.abs(dx) < DECIDE_THRESHOLD) return
    // ימינה (dx>0) = קדימה (הבא); שמאלה (dx<0) = אחורה (הקודם).
    // זה הופך גם את האנימציה, כי direction קובע ציר, class back והצללות.
    if (dx > 0 && props.canNext) direction.value = 'forward'
    else if (dx < 0 && props.canPrev) direction.value = 'backward'
    else return // אין לאן לדפדף בכיוון הזה
  }
  const dragProgress = Math.min(1, Math.abs(dx) / stageWidth)
  const magnitude = dragProgress * FULL_ANGLE
  // ציר הכריכה בימין: קדימה מרים את הקצה החופשי (שמאל) לכיוון הצופה (חיובי),
  // אחורה מטה אותו אחורה (שלילי).
  angle.value = direction.value === 'forward' ? magnitude : -magnitude
}

function endDrag() {
  window.removeEventListener('pointermove', moveDrag)
  const speed = Math.abs(currentX - startX) / Math.max(1, performance.now() - startT)
  const dir = direction.value
  const committed = !!dir && (progress.value > COMMIT_PROGRESS || (speed > FLICK_SPEED && progress.value > 0.12))
  phase.value = 'settling'

  if (committed && dir) {
    angle.value = dir === 'forward' ? FULL_ANGLE : -FULL_ANGLE
    window.setTimeout(() => finishTurn(dir), DURATION)
  } else {
    angle.value = 0
    window.setTimeout(reset, DURATION)
  }
}

function finishTurn(dir: 'forward' | 'backward') {
  // התוכן מתחלף עכשיו (האב מעדכן את ה-index באופן אופטימי); מצמידים מיד את הדף
  // חזרה ל-0° בלי אנימציה כדי שהפן הקדמי יציג את העמוד החדש.
  if (dir === 'forward') emit('next')
  else emit('prev')
  noAnim.value = true
  angle.value = 0
  direction.value = ''
  phase.value = 'idle' // לא לתלות את שחרור המצב ב-rAF (שמושהה בטאב ברקע)
  nextTick(() => { window.setTimeout(() => { noAnim.value = false }, 50) })
}

function reset() {
  angle.value = 0
  direction.value = ''
  phase.value = 'idle'
}
</script>

<style scoped>
.flip-stage {
  position: relative;
  width: min(760px, 100%);
  margin: 0 auto;
  perspective: 1200px;
}

.leaf {
  position: relative;
  transform-style: preserve-3d;
  /* transform-origin נקבע דינמית לפי כיוון (ימין=קדימה, שמאל=אחורה) */
  transition: transform .46s cubic-bezier(.33, .0, .2, 1);
  will-change: transform;
}

.leaf.dragging {
  transition: none;
}

/* צל עומק לכיוון הקצה החופשי: קדימה=שמאל, אחורה=ימין */
.leaf.curling {
  box-shadow: -34px 30px 64px rgba(3, 10, 22, .42);
}

.leaf.curling.back {
  box-shadow: 34px 30px 64px rgba(3, 10, 22, .42);
}

.leaf-face {
  backface-visibility: hidden;
}

.leaf-front {
  position: relative;
}

.leaf-back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
}

/* נייר דרכון לפן האחורי ולעמוד הנחשף */
.paper {
  border-radius: 10px;
  background:
    radial-gradient(circle at 30% 20%, rgba(214, 184, 102, .12), transparent 60%),
    linear-gradient(160deg, #fbf3df, #f3e7c8);
  box-shadow: inset 0 0 0 1px rgba(15, 48, 83, .12);
}

.under-page {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: grid;
  place-items: center;
}

.paper-title {
  color: rgba(18, 36, 59, .42);
  font-weight: 800;
  font-size: 1.1rem;
}

/* הקימור הרך: צל מתעבה לכיוון הקצה החופשי (שמאל), פס הדגשה בהיר חזק שמדמה את
   קודקוד העיגול שתופס אור, וקצה כהה — שילוב שנותן תחושת התעגלות חזקה. השכבה
   חלק מהדף עצמו (בתוך leaf-front), לא שכבה צפה. */
.curl-shade {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  border-radius: 10px;
  opacity: 0;
  /* קדימה: הקצה החופשי בשמאל — הקימור מתעצם שמאלה */
  background: linear-gradient(
    to left,
    rgba(8, 18, 34, 0) 30%,
    rgba(8, 18, 34, .16) 54%,
    rgba(8, 18, 34, .44) 78%,
    rgba(255, 253, 247, .9) 88%,
    rgba(255, 253, 247, .68) 94%,
    rgba(96, 74, 38, .58) 100%
  );
}

/* אחורה: הקצה החופשי בימין — אותו קימור משוקף אופקית (בלי לשכפל את הגרדיאנט) */
.leaf.back .curl-shade {
  transform: scaleX(-1);
}

/* אזורי קצה שקופים לחלוטין — רק לתפיסת הגרירה */
.edge-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 44px;
  z-index: 12;
  touch-action: none;
  background: transparent;
}

.start-edge {
  left: 0;
}

.end-edge {
  right: 0;
}

@media (max-width: 560px) {
  .edge-zone {
    width: 32px;
  }
}
</style>
