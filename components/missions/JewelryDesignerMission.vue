<template>
  <section class="jewelry">
    <div class="tool-grid">
      <label>סוג תכשיט
        <select v-model="piece" class="field">
          <option value="ring">טבעת</option>
          <option value="pendant">תליון</option>
          <option value="chain">שרשרת</option>
        </select>
      </label>
      <label>חומר
        <select v-model="material" class="field">
          <option value="gold">זהב</option>
          <option value="silver">כסף</option>
          <option value="titanium">טיטניום</option>
          <option value="glass">זכוכית שקופה</option>
        </select>
      </label>
      <label>אלמנט נע
        <select v-model="element" class="field">
          <option value="bead">כדורית</option>
          <option value="spinner">ספינר</option>
          <option value="chainlet">שרשרת קטנה</option>
          <option value="orbit">אלמנט מקיף</option>
        </select>
      </label>
      <label>צבע הדגשה
        <input v-model="accent" class="field" type="color" />
      </label>
    </div>
    <div class="mode-row">
      <button type="button" :class="{ active: mode === 'earth' }" @click="mode = 'earth'">כדור הארץ</button>
      <button type="button" :class="{ active: mode === 'microgravity' }" @click="mode = 'microgravity'">מיקרו-כבידה</button>
    </div>
    <JewelryGravityScene :key="`${piece}-${material}-${mode}-${accent}`" :piece="piece" :material="material" :mode="mode" :accent="accent" />
    <p>{{ explanation }}</p>
    <button class="primary-button" type="button" @click="save">שמור תכשיט</button>
  </section>
</template>

<script setup lang="ts">
const emit = defineEmits<{ saved: [{ imageDataUrl: string; data: Record<string, unknown> }] }>()
const piece = ref('ring')
const material = ref('gold')
const element = ref('bead')
const accent = ref('#7bdcff')
const mode = ref<'earth' | 'microgravity'>('earth')
const explanation = computed(() => mode.value === 'earth'
  ? 'בכדור הארץ האלמנט הנע נמשך כלפי מטה ומתנדנד סביב נקודת אחיזה.'
  : 'במיקרו-כבידה האלמנט יכול לרחף, להקיף ולהסתובב סביב התכשיט באופן חופשי יותר.')

function save() {
  const canvas = document.querySelector('canvas[data-jewelry-canvas="true"]') as HTMLCanvasElement | null
  const imageDataUrl = canvas?.toDataURL('image/png')
  if (!imageDataUrl) return
  emit('saved', { imageDataUrl, data: { piece: piece.value, material: material.value, element: element.value, accent: accent.value, mode: mode.value } })
}
</script>

<style scoped>
.jewelry { display: grid; gap: 12px; }
.tool-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
label { display: grid; gap: 5px; color: #263a5a; font-weight: 800; }
.mode-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.mode-row button { min-height: 42px; border-radius: 8px; background: rgba(255,250,232,.78); border: 1px solid rgba(18,36,59,.16); font-weight: 800; }
.mode-row button.active { color: #061126; background: #e5c670; }
p { margin: 0; color: #50617b; }
@media (max-width: 560px) { .tool-grid { grid-template-columns: 1fr; } }
</style>
