<template>
  <section class="designer">
    <div class="tool-grid">
      <label>צורה
        <select v-model="shape" class="field" @change="draw">
          <option value="circle">עיגול</option>
          <option value="shield">מגן</option>
          <option value="badge">תג משימה</option>
          <option value="hexagon">משושה</option>
        </select>
      </label>
      <label>צבע רקע
        <input v-model="bg" class="field" type="color" @input="draw" />
      </label>
      <label>סמל
        <select v-model="icon" class="field" @change="draw">
          <option value="rocket">רקטה</option>
          <option value="iss">תחנה</option>
          <option value="earth">כדור הארץ</option>
          <option value="star">כוכב</option>
          <option value="helmet">קסדה</option>
          <option value="orbit">מסלול</option>
        </select>
      </label>
      <label>טקסט משימה
        <input v-model="missionText" class="field" maxlength="20" @input="draw" />
      </label>
    </div>
    <canvas ref="canvas" width="560" height="560" class="canvas-panel" @pointerdown="startDrag" @pointermove="drag" @pointerup="stopDrag" />
    <div class="control-row">
      <button class="secondary-button" type="button" @click="resizeIcon(-4)">הקטן סמל</button>
      <button class="secondary-button" type="button" @click="resizeIcon(4)">הגדל סמל</button>
      <button class="primary-button" type="button" @click="save">שמור פאץ׳</button>
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
const iconPosition = reactive({ x: 280, y: 250, size: 92 })
const dragging = ref(false)

function pathShape(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  if (shape.value === 'circle') ctx.arc(280, 280, 218, 0, Math.PI * 2)
  if (shape.value === 'shield') {
    ctx.moveTo(160, 92); ctx.lineTo(400, 92); ctx.lineTo(430, 294); ctx.quadraticCurveTo(280, 468, 130, 294); ctx.closePath()
  }
  if (shape.value === 'badge') {
    ctx.moveTo(280, 62)
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 190 : 224
      const a = -Math.PI / 2 + i * Math.PI / 5
      ctx.lineTo(280 + Math.cos(a) * r, 280 + Math.sin(a) * r)
    }
    ctx.closePath()
  }
  if (shape.value === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 3
      const x = 280 + Math.cos(a) * 214
      const y = 280 + Math.sin(a) * 214
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.closePath()
  }
}

function drawIcon(ctx: CanvasRenderingContext2D) {
  const { x, y, size } = iconPosition
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = '#f2d57a'
  ctx.fillStyle = '#f9e7a8'
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  if (icon.value === 'rocket') {
    ctx.beginPath(); ctx.moveTo(0, -size * .65); ctx.quadraticCurveTo(size * .42, -size * .12, size * .18, size * .48); ctx.lineTo(0, size * .28); ctx.lineTo(-size * .18, size * .48); ctx.quadraticCurveTo(-size * .42, -size * .12, 0, -size * .65); ctx.fill(); ctx.stroke()
    ctx.beginPath(); ctx.arc(0, -size * .14, size * .16, 0, Math.PI * 2); ctx.stroke()
  }
  if (icon.value === 'iss') {
    ctx.strokeRect(-size * .42, -size * .12, size * .84, size * .24)
    ctx.fillRect(-size * .8, -size * .5, size * .28, size)
    ctx.fillRect(size * .52, -size * .5, size * .28, size)
  }
  if (icon.value === 'earth') {
    ctx.beginPath(); ctx.arc(0, 0, size * .42, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(-size * .12, -size * .08, size * .18, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(size * .15, size * .12, size * .13, 0, Math.PI * 2); ctx.fill()
  }
  if (icon.value === 'star') {
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? size * .22 : size * .52
      const a = -Math.PI / 2 + i * Math.PI / 5
      const px = Math.cos(a) * r
      const py = Math.sin(a) * r
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    }
    ctx.closePath(); ctx.fill(); ctx.stroke()
  }
  if (icon.value === 'helmet') {
    ctx.beginPath(); ctx.arc(0, 0, size * .44, Math.PI, 0); ctx.lineTo(size * .44, size * .28); ctx.lineTo(-size * .44, size * .28); ctx.closePath(); ctx.stroke()
    ctx.fillRect(-size * .25, -size * .05, size * .5, size * .2)
  }
  if (icon.value === 'orbit') {
    ctx.beginPath(); ctx.ellipse(0, 0, size * .68, size * .24, -.5, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(size * .38, -size * .08, size * .08, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

function draw() {
  const c = canvas.value
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, c.width, c.height)
  ctx.save()
  pathShape(ctx)
  ctx.clip()
  ctx.fillStyle = bg.value
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.strokeStyle = 'rgba(255,255,255,.18)'
  for (let i = -200; i < 760; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 240, 560); ctx.stroke()
  }
  drawIcon(ctx)
  ctx.fillStyle = '#f6df96'
  ctx.textAlign = 'center'
  ctx.font = 'bold 36px Segoe UI, Arial'
  ctx.fillText(missionText.value, 280, 390)
  ctx.font = 'bold 30px Segoe UI, Arial'
  ctx.fillText(props.userName, 280, 435)
  ctx.restore()
  ctx.lineWidth = 12
  ctx.strokeStyle = '#d8bd6a'
  pathShape(ctx)
  ctx.stroke()
}

function startDrag(event: PointerEvent) {
  dragging.value = true
  moveIcon(event)
}

function drag(event: PointerEvent) {
  if (dragging.value) moveIcon(event)
}

function stopDrag() {
  dragging.value = false
}

function moveIcon(event: PointerEvent) {
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return
  iconPosition.x = ((event.clientX - rect.left) / rect.width) * 560
  iconPosition.y = ((event.clientY - rect.top) / rect.height) * 560
  draw()
}

function resizeIcon(delta: number) {
  iconPosition.size = Math.max(46, Math.min(150, iconPosition.size + delta))
  draw()
}

function save() {
  const imageDataUrl = canvas.value?.toDataURL('image/png')
  if (!imageDataUrl) return
  emit('saved', { imageDataUrl, data: { shape: shape.value, bg: bg.value, icon: icon.value, missionText: missionText.value, iconPosition: { ...iconPosition } } })
}

onMounted(draw)
</script>

<style scoped>
.designer { display: grid; gap: 12px; }
.tool-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
label { display: grid; gap: 5px; color: #263a5a; font-weight: 800; }
canvas { max-width: 100%; aspect-ratio: 1; touch-action: none; }
@media (max-width: 560px) { .tool-grid { grid-template-columns: 1fr; } }
</style>
