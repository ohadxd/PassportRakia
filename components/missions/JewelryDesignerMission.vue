<template>
  <section class="jewelry-lab">
    <div class="lab-toolbar" aria-label="בחירת בסיס וחומר">
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

      <div class="swatches" aria-label="בחירת חומר">
        <button
          v-for="option in materialOptions"
          :key="option.id"
          type="button"
          :class="{ active: material === option.id }"
          :style="{ '--swatch': option.color }"
          :title="option.label"
          @click="material = option.id"
        />
      </div>

      <div class="swatches gems" aria-label="בחירת אבן">
        <button
          v-for="option in gemOptions"
          :key="option.color"
          type="button"
          :class="{ active: gemColor === option.color }"
          :style="{ '--swatch': option.color }"
          :title="option.label"
          @click="gemColor = option.color"
        />
      </div>
    </div>

    <JewelryGravityScene
      :base="base"
      :material="material"
      :tool="tool"
      :gem-color="gemColor"
      :mode="mode"
      @design-change="design = $event"
    />

    <div class="part-tray" aria-label="גרירת חלקים">
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

    <div class="mode-row">
      <button type="button" :class="{ active: mode === 'earth' }" @click="mode = 'earth'">כדור הארץ</button>
      <button type="button" :class="{ active: mode === 'microgravity' }" @click="mode = 'microgravity'">מיקרו-כבידה</button>
    </div>

    <div class="lab-actions">
      <p>{{ statusText }}</p>
      <button class="primary-button" type="button" @click="save">שמור תכשיט</button>
    </div>
  </section>
</template>

<script setup lang="ts">
type JewelryBase = 'earring' | 'ring' | 'necklace'
type JewelryMaterial = 'gold' | 'silver' | 'titanium'
type JewelryTool = 'hoop' | 'chain' | 'gem' | 'charm'
type GravityMode = 'earth' | 'microgravity'

type JewelryDesign = {
  base: JewelryBase
  material: JewelryMaterial
  mode: GravityMode
  gemColor: string
  parts: Array<{ id: string; type: JewelryTool; anchor: number; color: string }>
}

const emit = defineEmits<{ saved: [{ imageDataUrl: string; data: Record<string, unknown> }] }>()

const base = ref<JewelryBase>('earring')
const material = ref<JewelryMaterial>('gold')
const tool = ref<JewelryTool>('chain')
const gemColor = ref('#8f45ff')
const mode = ref<GravityMode>('earth')
const design = ref<JewelryDesign | null>(null)

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
  const count = design.value?.parts.length || 0
  if (!count) return 'בחרו חלק וגעו בנקודות העיגון הזהובות כדי לבנות תכשיט קינטי.'
  return mode.value === 'earth'
    ? `${count} חלקים מחוברים. בכדור הארץ הם נמשכים למטה ומתנדנדים סביב נקודת העיגון.`
    : `${count} חלקים מחוברים. במיקרו-כבידה הם ממשיכים לרחף ולהסתובב כמעט בלי ליפול.`
})

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
      gemColor: gemColor.value,
      parts: []
    }
  })
}
</script>

<style scoped>
.jewelry-lab {
  display: grid;
  gap: 12px;
}

.lab-toolbar {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
}

.segmented,
.mode-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.mode-row {
  grid-template-columns: 1fr 1fr;
}

.segmented button,
.mode-row button,
.part-tray button {
  min-height: 42px;
  border: 1px solid rgba(18, 36, 59, .16);
  border-radius: 8px;
  color: #12243b;
  background: rgba(255, 250, 232, .78);
  font-weight: 900;
}

.segmented button.active,
.mode-row button.active,
.part-tray button.active {
  color: #061126;
  background: #e5c670;
  box-shadow: inset 0 0 0 1px rgba(93, 67, 18, .22);
}

.swatches {
  display: flex;
  gap: 7px;
  justify-content: end;
}

.swatches button {
  width: 34px;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 2px solid rgba(18, 36, 59, .18);
  background: var(--swatch);
  box-shadow: inset 0 1px 5px rgba(255,255,255,.45), 0 4px 12px rgba(12,24,40,.12);
}

.swatches button.active {
  border-color: #061126;
  outline: 2px solid rgba(214, 184, 102, .8);
}

.part-tray {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.part-tray span {
  display: block;
  font-size: 1.35rem;
  line-height: 1;
}

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
}

@media (max-width: 640px) {
  .lab-toolbar {
    grid-template-columns: 1fr;
  }

  .swatches {
    justify-content: center;
  }

  .part-tray {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lab-actions {
    grid-template-columns: 1fr;
  }
}
</style>
