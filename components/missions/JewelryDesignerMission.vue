<template>
  <section class="jewelry-lab">
    <!-- אזור 1: בחירת בסיס + מתג כבידה -->
    <header class="lab-top">
      <div class="field">
        <span class="field-label">בסיס</span>
        <div class="segmented">
          <button
            v-for="option in baseOptions"
            :key="option.id"
            type="button"
            :class="{ active: base === option.id }"
            @click="base = option.id"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="field">
        <span class="field-label">כבידה</span>
        <div class="segmented gravity">
          <button type="button" :class="{ active: mode === 'earth' }" @click="mode = 'earth'">🌍 כדור הארץ</button>
          <button type="button" :class="{ active: mode === 'microgravity' }" @click="mode = 'microgravity'">🛰️ מיקרו-כבידה</button>
        </div>
      </div>
    </header>

    <!-- אזור 2: הזירה התלת-ממדית -->
    <JewelryGravityScene
      ref="sceneRef"
      :base="base"
      :material="material"
      :tool="tool"
      :gem-color="gemColor"
      :mode="mode"
      :interaction-mode="interactionMode"
      :initial-design="initialDesign"
      @design-change="onDesignChange"
    />

    <!-- אזור 3: לוח עבודה מאוחד -->
    <div class="work-panel">
      <div class="segmented work-mode" aria-label="מצב עבודה">
        <button type="button" :class="{ active: interactionMode === 'build' }" @click="interactionMode = 'build'">✛ בנייה</button>
        <button type="button" :class="{ active: interactionMode === 'move' }" @click="interactionMode = 'move'">✋ הזזה</button>
      </div>

      <div class="edit-actions" aria-label="עריכת תוספות">
        <button type="button" :disabled="!partCount" @click="undoLast">↩︎ בטל אחרון</button>
        <button type="button" :disabled="!partCount" @click="clearAll">🗑 נקה הכל</button>
      </div>

      <div v-if="interactionMode === 'build'" class="part-tray" aria-label="בחירת חלק">
        <button
          v-for="part in partOptions"
          :key="part.id"
          type="button"
          :class="{ active: tool === part.id }"
          @click="tool = part.id"
        >
          <span>{{ part.icon }}</span>
          {{ part.label }}
        </button>
      </div>

      <div class="palette">
        <div class="field">
          <span class="field-label">חומר</span>
          <div class="swatches">
            <button
              v-for="option in materialOptions"
              :key="option.id"
              type="button"
              :class="{ active: material === option.id }"
              :style="{ '--swatch': option.color }"
              :title="option.label"
              :aria-label="option.label"
              @click="material = option.id"
            />
          </div>
        </div>

        <div class="field">
          <span class="field-label">אבן</span>
          <div class="swatches">
            <button
              v-for="option in gemOptions"
              :key="option.color"
              type="button"
              :class="{ active: gemColor === option.color }"
              :style="{ '--swatch': option.color }"
              :title="option.label"
              :aria-label="option.label"
              @click="gemColor = option.color"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- כותרת תחתונה: סטטוס + שמירה -->
    <footer class="lab-actions">
      <p>{{ statusText }}</p>
      <button class="primary-button" type="button" @click="save">שמור תכשיט</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
type JewelryBase = 'earring' | 'ring' | 'necklace'
type JewelryMaterial = 'gold' | 'silver' | 'titanium'
type JewelryTool = 'hoop' | 'chain' | 'gem' | 'charm'
type GravityMode = 'earth' | 'microgravity'
type InteractionMode = 'build' | 'move'

type Vec3Tuple = [number, number, number]
type AnchorData = { hostId: string; pivot: Vec3Tuple; worldPosition: Vec3Tuple; normal: Vec3Tuple }

type JewelryDesign = {
  base: JewelryBase
  material: JewelryMaterial
  mode: GravityMode
  interactionMode: InteractionMode
  gemColor: string
  viewOffset: { x: number; y: number }
  parts: Array<{ id: string; type: JewelryTool; anchor: number; color: string; anchorData: AnchorData }>
}

const DRAFT_KEY = 'rakia-jewelry-draft'

const emit = defineEmits<{ saved: [{ imageDataUrl: string; data: Record<string, unknown> }] }>()

const sceneRef = ref<{ clearAll: () => void; undoLast: () => void } | null>(null)

const base = ref<JewelryBase>('earring')
const material = ref<JewelryMaterial>('gold')
const tool = ref<JewelryTool>('chain')
const gemColor = ref('#8f45ff')
const mode = ref<GravityMode>('earth')
const interactionMode = ref<InteractionMode>('build')
const design = ref<JewelryDesign | null>(null)
// טיוטה לשחזור אוטומטי בחזרה לעמוד — נטענת ב-onMounted ומועברת לסצנה כ-prop.
const initialDesign = ref<JewelryDesign | null>(null)

const partCount = computed(() => design.value?.parts.length || 0)

const baseOptions: Array<{ id: JewelryBase; label: string }> = [
  { id: 'earring', label: 'עגיל' },
  { id: 'ring', label: 'טבעת' },
  { id: 'necklace', label: 'שרשרת' }
]

const materialOptions: Array<{ id: JewelryMaterial; label: string; color: string }> = [
  { id: 'gold', label: 'זהב', color: '#d6aa49' },
  { id: 'silver', label: 'כסף', color: '#dfe6ee' },
  { id: 'titanium', label: 'טיטניום', color: '#8995a2' }
]

const gemOptions = [
  { label: 'ספיר', color: '#2878ff' },
  { label: 'אמטיסט', color: '#8f45ff' },
  { label: 'אמרלד', color: '#16a36a' },
  { label: 'רובי', color: '#d93652' },
  { label: 'יהלום', color: '#e9fbff' }
]

const partOptions: Array<{ id: JewelryTool; label: string; icon: string }> = [
  { id: 'chain', label: 'שרשרת', icon: '⌁' },
  { id: 'hoop', label: 'חישוק', icon: '○' },
  { id: 'gem', label: 'אבן', icon: '◆' },
  { id: 'charm', label: 'תליון', icon: '✦' }
]

const statusText = computed(() => {
  if (interactionMode.value === 'move') return 'גררו חלק כדי למקם אותו, ולסובב את התצוגה הזיזו את המצלמה.'
  const count = design.value?.parts.length || 0
  if (!count) return 'בחרו חלק וגעו בכל מקום על התכשיט כדי לחבר אותו.'
  return mode.value === 'earth'
    ? `${count} חלקים מחוברים. בכדור הארץ התכשיט יציב והחלקים התלויים מתנדנדים בעדינות.`
    : `${count} חלקים מחוברים. במיקרו-כבידה הכל מרחף וממשיך להסתובב לאט כמעט בלי ליפול.`
})

// כל עוד true: ממתינים שהסצנה תסיים לשחזר את הטיוטה. בחלון הזה הסצנה פולטת
// עיצוב ריק זמני (אתחול הבסיס לפני השחזור) — ואסור שהוא ידרוס את הטיוטה השמורה.
let pendingRestore = false

// טוען טיוטה שמורה בעת עליית הקומפוננטה (כולל אחרי back-navigation) ומכוון את
// הבקרות לפי הטיוטה כך שהבסיס יתאים והסצנה תשחזר את החלקים.
onMounted(() => {
  const draft = loadDraft()
  if (!draft) return
  pendingRestore = true
  base.value = draft.base
  material.value = draft.material
  gemColor.value = draft.gemColor
  mode.value = draft.mode
  initialDesign.value = draft
})

function onDesignChange(next: JewelryDesign) {
  design.value = next
  if (pendingRestore) {
    // מתעלמים מפליטות ריקות עד שהשחזור הושלם; ברגע שיש חלקים — השחזור הסתיים.
    if (next.parts.length > 0) {
      pendingRestore = false
      saveDraft(next)
    }
    return
  }
  if (next.parts.length > 0) saveDraft(next)
  else clearDraft()
}

function loadDraft(): JewelryDesign | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    const parsed = raw ? (JSON.parse(raw) as JewelryDesign) : null
    return parsed && parsed.parts?.length ? parsed : null
  } catch {
    return null
  }
}

function saveDraft(next: JewelryDesign) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next))
  } catch {
    // אחסון מלא/חסום — מתעלמים; השחזור הוא נוחות ולא קריטי.
  }
}

function clearDraft() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // מתעלמים
  }
}

function clearAll() {
  sceneRef.value?.clearAll()
  clearDraft()
}

function undoLast() {
  sceneRef.value?.undoLast()
}

function save() {
  const canvas = document.querySelector('canvas[data-jewelry-canvas="true"]') as HTMLCanvasElement | null
  const imageDataUrl = canvas?.toDataURL('image/png')
  if (!imageDataUrl) return
  emit('saved', {
    imageDataUrl,
    data: design.value || {
      base: base.value,
      material: material.value,
      mode: mode.value,
      interactionMode: interactionMode.value,
      gemColor: gemColor.value,
      viewOffset: { x: 0, y: 0 },
      parts: []
    }
  })
  // אחרי שמירה לדרכון אין צורך בטיוטה — מנקים כדי שמשתתף הבא יתחיל נקי.
  clearDraft()
}
</script>

<style scoped>
.jewelry-lab {
  display: grid;
  gap: 14px;
}

/* אזור 1 — בסיס + כבידה */
.lab-top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
}

.field-label {
  font-size: .74rem;
  font-weight: 900;
  letter-spacing: .04em;
  color: #7a6322;
  text-transform: uppercase;
}

/* כפתורים מקובצים בסגנון הדרכון */
.segmented {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 0;
  padding: 4px;
  border: 1px solid rgba(122, 99, 34, .28);
  border-radius: 12px;
  background: rgba(255, 250, 232, .6);
}

.segmented button {
  min-height: 44px;
  border: 0;
  border-radius: 9px;
  color: #12243b;
  background: transparent;
  font-weight: 900;
  cursor: pointer;
  transition: background .15s, color .15s, box-shadow .15s;
}

.segmented button.active {
  color: #061126;
  background: #e5c670;
  box-shadow: 0 2px 8px rgba(93, 67, 18, .26);
}

/* אזור 3 — לוח עבודה מאוחד */
.work-panel {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(122, 99, 34, .22);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 252, 242, .92), rgba(250, 243, 224, .88));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .6);
}

.part-tray {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.part-tray button {
  display: grid;
  justify-items: center;
  gap: 2px;
  min-height: 60px;
  border: 1px solid rgba(18, 36, 59, .16);
  border-radius: 12px;
  color: #12243b;
  background: rgba(255, 250, 232, .78);
  font-weight: 800;
  font-size: .82rem;
  cursor: pointer;
  transition: background .15s, box-shadow .15s;
}

.part-tray button.active {
  color: #061126;
  background: #e5c670;
  box-shadow: inset 0 0 0 1px rgba(93, 67, 18, .3);
}

.part-tray span {
  font-size: 1.45rem;
  line-height: 1;
}

/* כפתורי עריכה: ביטול אחרון + ניקוי הכל */
.edit-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.edit-actions button {
  min-height: 40px;
  border: 1px solid rgba(122, 99, 34, .28);
  border-radius: 10px;
  color: #5d4312;
  background: rgba(255, 250, 232, .85);
  font-weight: 800;
  cursor: pointer;
  transition: background .15s, opacity .15s;
}

.edit-actions button:hover:not(:disabled) {
  background: #f0e2bb;
}

.edit-actions button:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.palette {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.swatches {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.swatches button {
  width: 32px;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 2px solid rgba(18, 36, 59, .18);
  background: var(--swatch);
  cursor: pointer;
  box-shadow: inset 0 1px 5px rgba(255,255,255,.45), 0 4px 12px rgba(12,24,40,.12);
}

.swatches button.active {
  border-color: #061126;
  outline: 2px solid rgba(214, 184, 102, .9);
  outline-offset: 1px;
}

/* כותרת תחתונה */
.lab-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.lab-actions p {
  margin: 0;
  color: #50617b;
  line-height: 1.45;
  font-size: .9rem;
}

@media (max-width: 640px) {
  .lab-top {
    grid-template-columns: 1fr;
  }

  .palette {
    grid-template-columns: 1fr;
  }

  .swatches {
    justify-content: center;
  }

  .lab-actions {
    grid-template-columns: 1fr;
  }
}
</style>
