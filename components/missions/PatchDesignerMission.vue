<template>
  <section class="designer">
    <!-- תצוגת הפאץ' -->
    <div class="stage">
      <canvas
        ref="canvas"
        width="560"
        height="560"
        class="patch-canvas"
        @pointerdown="startDrag"
        @pointermove="drag"
        @pointerup="stopDrag"
      />
      <p class="stage-hint">גררו את הסמל או את הטקסט למיקום הרצוי</p>
    </div>

    <!-- לוח בקרה מעוצב -->
    <div class="panel">
      <div class="field">
        <span class="field-label">צורה</span>
        <div class="chip-row">
          <button
            v-for="opt in shapeOptions"
            :key="opt.id"
            type="button"
            :class="{ active: shape === opt.id }"
            @click="shape = opt.id; draw()"
          >{{ opt.label }}</button>
        </div>
      </div>

      <div class="field">
        <span class="field-label">סמל</span>
        <div class="icon-grid">
          <button
            v-for="opt in iconOptions"
            :key="opt.id"
            type="button"
            :class="{ active: icon === opt.id }"
            :title="opt.label"
            @click="icon = opt.id; draw()"
          ><span>{{ opt.glyph }}</span></button>
        </div>
      </div>

      <div class="field">
        <span class="field-label">רקע</span>
        <div class="swatch-row">
          <button
            v-for="c in bgPresets"
            :key="c"
            type="button"
            class="swatch"
            :class="{ active: bg === c }"
            :style="{ '--swatch': c }"
            @click="bg = c; draw()"
          />
          <label class="custom-swatch" title="צבע מותאם">
            <input type="color" v-model="bg" @input="draw" />
            <span>＋</span>
          </label>
        </div>
      </div>

      <div class="field">
        <span class="field-label">טקסט משימה</span>
        <input v-model="missionText" class="text-field" maxlength="20" placeholder="RAKIA" @input="draw" />
      </div>

      <div class="actions">
        <div class="size-stack">
          <div class="size-row" aria-label="גודל סמל">
            <button type="button" @click="resizeIcon(-6)">−</button>
            <span>גודל סמל</span>
            <button type="button" @click="resizeIcon(6)">＋</button>
          </div>
          <div class="size-row" aria-label="גודל טקסט">
            <button type="button" @click="resizeText(-0.1)">−</button>
            <span>גודל טקסט</span>
            <button type="button" @click="resizeText(0.1)">＋</button>
          </div>
        </div>
        <button class="primary-button" type="button" @click="save">שמור פאץ׳</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ userName: string }>()
const emit = defineEmits<{ saved: [{ imageDataUrl: string; data: Record<string, unknown> }] }>()

const canvas = ref<HTMLCanvasElement | null>(null)
const shape = ref('circle')
const bg = ref('#12355f')
const icon = ref('rocket')
const missionText = ref('RAKIA')
const iconPosition = reactive({ x: 280, y: 232, size: 96 })
// מיקום וגודל הטקסט (סרט המשימה + השם) — ניתן לגרירה ולשינוי גודל, כדי שייכנס
// יפה בכל צורה. y = מרכז הסרט, scale = מכפיל גודל הגופנים.
const text = reactive({ x: 280, y: 378, scale: 1 })
const dragging = ref(false)
const dragTarget = ref<'icon' | 'text'>('icon')

const shapeOptions = [
  { id: 'circle', label: 'עיגול' },
  { id: 'shield', label: 'מגן' },
  { id: 'badge', label: 'תג' },
  { id: 'hexagon', label: 'משושה' }
]
const iconOptions = [
  { id: 'rocket', label: 'רקטה', glyph: '🚀' },
  { id: 'iss', label: 'תחנה', glyph: '🛰️' },
  { id: 'earth', label: 'כדור הארץ', glyph: '🌍' },
  { id: 'star', label: 'כוכב', glyph: '⭐' },
  { id: 'helmet', label: 'קסדה', glyph: '🪖' },
  { id: 'orbit', label: 'מסלול', glyph: '🌀' }
]
const bgPresets = ['#12355f', '#0b1f3a', '#1f2f6f', '#0f3b3a', '#3a1f4f', '#4a1f2e']

// כוכבים דטרמיניסטיים (לא מהבהבים בכל ציור/גרירה)
const stars: Array<{ x: number; y: number; r: number; a: number }> = []
function seedStars() {
  let s = 1337
  const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }
  stars.length = 0
  for (let i = 0; i < 80; i += 1) {
    stars.push({ x: rnd() * 560, y: rnd() * 560, r: rnd() * 1.6 + 0.5, a: rnd() * 0.6 + 0.25 })
  }
}

function shade(hex: string, amt: number) {
  const c = parseInt(hex.slice(1), 16)
  let r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255
  const target = amt < 0 ? 0 : 255
  const t = Math.abs(amt)
  r = Math.round(r + (target - r) * t)
  g = Math.round(g + (target - g) * t)
  b = Math.round(b + (target - b) * t)
  return `rgb(${r},${g},${b})`
}

function pathShape(ctx: CanvasRenderingContext2D, scale = 1) {
  ctx.beginPath()
  const cx = 280, cy = 280
  const p = (x: number, y: number) => [cx + (x - cx) * scale, cy + (y - cy) * scale] as const
  if (shape.value === 'circle') {
    ctx.arc(cx, cy, 218 * scale, 0, Math.PI * 2)
  } else if (shape.value === 'shield') {
    let [x, y] = p(160, 92); ctx.moveTo(x, y)
    ;[x, y] = p(400, 92); ctx.lineTo(x, y)
    ;[x, y] = p(430, 294); ctx.lineTo(x, y)
    const [qx, qy] = p(280, 468); const [ex, ey] = p(130, 294)
    ctx.quadraticCurveTo(qx, qy, ex, ey)
    ctx.closePath()
  } else if (shape.value === 'badge') {
    for (let i = 0; i < 10; i++) {
      const r = (i % 2 ? 190 : 224) * scale
      const a = -Math.PI / 2 + i * Math.PI / 5
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.closePath()
  } else if (shape.value === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 3
      const x = cx + Math.cos(a) * 214 * scale, y = cy + Math.sin(a) * 214 * scale
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.closePath()
  }
}

function drawIcon(ctx: CanvasRenderingContext2D) {
  const { x, y, size } = iconPosition
  ctx.save()
  ctx.translate(x, y)
  ctx.shadowColor = 'rgba(249, 220, 120, .75)'
  ctx.shadowBlur = 22
  const grad = ctx.createLinearGradient(0, -size * .6, 0, size * .6)
  grad.addColorStop(0, '#fff4cf')
  grad.addColorStop(1, '#e9c45f')
  ctx.strokeStyle = '#fff1c4'
  ctx.fillStyle = grad
  ctx.lineWidth = 9
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (icon.value === 'rocket') {
    ctx.beginPath(); ctx.moveTo(0, -size * .65); ctx.quadraticCurveTo(size * .42, -size * .12, size * .18, size * .48); ctx.lineTo(0, size * .28); ctx.lineTo(-size * .18, size * .48); ctx.quadraticCurveTo(-size * .42, -size * .12, 0, -size * .65); ctx.fill(); ctx.stroke()
    ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(0, -size * .14, size * .16, 0, Math.PI * 2); ctx.strokeStyle = '#12355f'; ctx.stroke()
  } else if (icon.value === 'iss') {
    ctx.strokeRect(-size * .42, -size * .12, size * .84, size * .24)
    ctx.fillRect(-size * .8, -size * .5, size * .28, size)
    ctx.fillRect(size * .52, -size * .5, size * .28, size)
  } else if (icon.value === 'earth') {
    ctx.beginPath(); ctx.arc(0, 0, size * .42, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(-size * .12, -size * .08, size * .18, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(size * .15, size * .12, size * .13, 0, Math.PI * 2); ctx.fill()
  } else if (icon.value === 'star') {
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? size * .22 : size * .52
      const a = -Math.PI / 2 + i * Math.PI / 5
      const px = Math.cos(a) * r, py = Math.sin(a) * r
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    }
    ctx.closePath(); ctx.fill(); ctx.stroke()
  } else if (icon.value === 'helmet') {
    ctx.beginPath(); ctx.arc(0, 0, size * .44, Math.PI, 0); ctx.lineTo(size * .44, size * .28); ctx.lineTo(-size * .44, size * .28); ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(18,53,95,.55)'; ctx.fillRect(-size * .25, -size * .12, size * .5, size * .22)
  } else if (icon.value === 'orbit') {
    ctx.beginPath(); ctx.ellipse(0, 0, size * .68, size * .24, -.5, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(size * .38, -size * .08, size * .1, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = 'rgba(255,245,205,.9)'
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 ? r * .38 : r
    const a = -Math.PI / 2 + i * Math.PI / 4
    const px = Math.cos(a) * rr, py = Math.sin(a) * rr
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath(); ctx.fill()
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function draw() {
  const c = canvas.value
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, c.width, c.height)

  // --- תוכן פנימי (חתוך לצורה) ---
  ctx.save()
  pathShape(ctx)
  ctx.clip()

  // רקע גרדיאנט (שמיים)
  const sky = ctx.createRadialGradient(280, 235, 40, 280, 300, 320)
  sky.addColorStop(0, shade(bg.value, 0.28))
  sky.addColorStop(0.6, bg.value)
  sky.addColorStop(1, shade(bg.value, -0.5))
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, 560, 560)

  // שדה כוכבים
  for (const st of stars) {
    ctx.globalAlpha = st.a
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1

  // ניצוצות אקסנט
  drawSparkle(ctx, 150, 150, 9)
  drawSparkle(ctx, 420, 175, 7)
  drawSparkle(ctx, 410, 300, 5)

  // אייקון זוהר
  drawIcon(ctx)

  // מסמרות (studs) לאורך הרים
  ctx.fillStyle = 'rgba(245, 215, 120, .9)'
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12
    const rx = 280 + Math.cos(a) * 198, ry = 280 + Math.sin(a) * 198
    ctx.beginPath(); ctx.arc(rx, ry, 3.4, 0, Math.PI * 2); ctx.fill()
  }

  // ויניטה
  const vig = ctx.createRadialGradient(280, 280, 150, 280, 280, 300)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,.4)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, 560, 560)

  ctx.restore()

  // --- טבעת זהב כפולה (עם זוהר) ---
  const ring = ctx.createLinearGradient(80, 80, 480, 480)
  ring.addColorStop(0, '#f6df96')
  ring.addColorStop(0.5, '#caa64e')
  ring.addColorStop(1, '#f0d488')
  ctx.save()
  ctx.shadowColor = 'rgba(214, 184, 102, .6)'
  ctx.shadowBlur = 16
  ctx.strokeStyle = ring
  ctx.lineWidth = 14
  ctx.lineJoin = 'round'
  pathShape(ctx)
  ctx.stroke()
  ctx.restore()
  // טבעת פנימית דקה
  ctx.strokeStyle = 'rgba(255, 246, 214, .7)'
  ctx.lineWidth = 3
  pathShape(ctx, 0.9)
  ctx.stroke()

  // --- סרט (ribbon) לטקסט המשימה — ממוקם ומוקטן/מוגדל לפי text ---
  const s = text.scale
  const cx = text.x, cy = text.y
  const mt = (missionText.value || '').toUpperCase()
  ctx.font = `900 ${Math.round(34 * s)}px Segoe UI, Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const tw = Math.max(120 * s, ctx.measureText(mt).width + 60 * s)
  const rh = 52 * s
  const rx = cx - tw / 2, ry = cy - rh / 2
  const rib = ctx.createLinearGradient(0, ry, 0, ry + rh)
  rib.addColorStop(0, 'rgba(10, 26, 52, .92)')
  rib.addColorStop(1, 'rgba(6, 18, 38, .92)')
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,.4)'
  ctx.shadowBlur = 10
  roundRect(ctx, rx, ry, tw, rh, 12 * s)
  ctx.fillStyle = rib
  ctx.fill()
  ctx.restore()
  roundRect(ctx, rx, ry, tw, rh, 12 * s)
  ctx.strokeStyle = 'rgba(214, 184, 102, .85)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#f6df96'
  ctx.fillText(mt, cx, cy + 1)

  // --- שם המעצב (מתחת לסרט) ---
  ctx.font = `800 ${Math.round(26 * s)}px Segoe UI, Arial`
  ctx.fillStyle = 'rgba(247, 232, 191, .95)'
  ctx.fillText(props.userName, cx, cy + rh / 2 + 26 * s)
}

function canvasPoint(event: PointerEvent) {
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return null
  return {
    x: ((event.clientX - rect.left) / rect.width) * 560,
    y: ((event.clientY - rect.top) / rect.height) * 560
  }
}

function startDrag(event: PointerEvent) {
  const p = canvasPoint(event)
  if (!p) return
  // גוררים את האלמנט הקרוב יותר לנקודת הנגיעה — סמל או טקסט.
  const di = Math.hypot(p.x - iconPosition.x, p.y - iconPosition.y)
  const dt = Math.hypot(p.x - text.x, p.y - text.y)
  dragTarget.value = dt < di ? 'text' : 'icon'
  dragging.value = true
  applyDrag(p)
}

function drag(event: PointerEvent) {
  if (!dragging.value) return
  const p = canvasPoint(event)
  if (p) applyDrag(p)
}

function applyDrag(p: { x: number; y: number }) {
  const x = Math.max(40, Math.min(520, p.x))
  const y = Math.max(40, Math.min(520, p.y))
  if (dragTarget.value === 'text') { text.x = x; text.y = y }
  else { iconPosition.x = x; iconPosition.y = y }
  draw()
}

function stopDrag() { dragging.value = false }

function resizeIcon(delta: number) {
  iconPosition.size = Math.max(46, Math.min(150, iconPosition.size + delta))
  draw()
}

function resizeText(delta: number) {
  text.scale = Math.max(0.6, Math.min(1.7, +(text.scale + delta).toFixed(2)))
  draw()
}

function save() {
  const imageDataUrl = canvas.value?.toDataURL('image/png')
  if (!imageDataUrl) return
  emit('saved', { imageDataUrl, data: { shape: shape.value, bg: bg.value, icon: icon.value, missionText: missionText.value, iconPosition: { ...iconPosition }, textPosition: { ...text } } })
}

onMounted(() => { seedStars(); draw() })
</script>

<style scoped>
.designer { display: grid; gap: 14px; }

.stage { display: grid; gap: 6px; justify-items: center; }

.patch-canvas {
  width: min(360px, 100%);
  aspect-ratio: 1;
  touch-action: none;
  filter: drop-shadow(0 14px 28px rgba(4, 14, 31, .4));
}

.stage-hint {
  margin: 0;
  font-size: .82rem;
  font-weight: 700;
  color: #6b7a92;
}

/* לוח בקרה — שפת הדרכון */
.panel {
  display: grid;
  gap: 13px;
  padding: 14px;
  border: 1px solid rgba(122, 99, 34, .22);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 252, 242, .92), rgba(250, 243, 224, .88));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .6);
}

.field { display: grid; gap: 6px; }

.field-label {
  font-size: .74rem;
  font-weight: 900;
  letter-spacing: .04em;
  color: #7a6322;
  text-transform: uppercase;
}

.chip-row {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 6px;
}

.chip-row button {
  min-height: 42px;
  border: 1px solid rgba(18, 36, 59, .16);
  border-radius: 10px;
  color: #12243b;
  background: rgba(255, 250, 232, .78);
  font-weight: 800;
  cursor: pointer;
}

.chip-row button.active {
  color: #061126;
  background: #e5c670;
  box-shadow: inset 0 0 0 1px rgba(93, 67, 18, .28);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;
}

.icon-grid button {
  aspect-ratio: 1;
  border: 1px solid rgba(18, 36, 59, .16);
  border-radius: 10px;
  background: rgba(255, 250, 232, .78);
  font-size: 1.3rem;
  cursor: pointer;
}

.icon-grid button.active {
  background: #e5c670;
  box-shadow: inset 0 0 0 1px rgba(93, 67, 18, .28);
}

.swatch-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

.swatch {
  width: 34px;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 2px solid rgba(18, 36, 59, .2);
  background: var(--swatch);
  cursor: pointer;
  box-shadow: inset 0 1px 5px rgba(255,255,255,.3), 0 3px 9px rgba(12,24,40,.18);
}

.swatch.active { border-color: #061126; outline: 2px solid rgba(214, 184, 102, .9); outline-offset: 1px; }

.custom-swatch {
  position: relative;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 2px dashed rgba(122, 99, 34, .5);
  color: #7a6322;
  font-weight: 900;
  cursor: pointer;
  overflow: hidden;
}

.custom-swatch input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

.text-field {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid rgba(18, 36, 59, .18);
  border-radius: 10px;
  background: rgba(255, 255, 255, .8);
  color: #12243b;
  font-weight: 800;
  text-align: center;
  letter-spacing: .08em;
}

.actions { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; }

.size-stack { display: grid; gap: 6px; }

.size-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: .82rem;
  font-weight: 800;
  color: #50617b;
}

.size-row button {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  border: 1px solid rgba(18, 36, 59, .18);
  background: rgba(255, 250, 232, .85);
  font-size: 1.1rem;
  font-weight: 900;
  color: #12243b;
  cursor: pointer;
}

@media (max-width: 560px) {
  .actions { grid-template-columns: 1fr; }
}
</style>
