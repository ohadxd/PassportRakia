<template>
  <section class="three-wrap">
    <div ref="host" class="three-host" />
    <div class="marker-panel">
      <button
        v-for="marker in markers"
        :key="marker.id"
        type="button"
        :class="{ visited: visited.includes(marker.id) }"
        @click="visit(marker.id)"
      >
        {{ marker.label }}
      </button>
    </div>
    <p class="scene-note">{{ activeInfo }}</p>
  </section>
</template>

<script setup lang="ts">
import * as THREE from 'three'

const emit = defineEmits<{ ready: [] }>()
const host = ref<HTMLElement | null>(null)
const visited = ref<string[]>([])
const markers = [
  { id: 'solar', label: 'פאנלים סולאריים', info: 'הפאנלים מספקים חשמל לתחנה כשהיא מקיפה את כדור הארץ.' },
  { id: 'lab', label: 'מעבדות מחקר', info: 'במעבדות מבצעים ניסויים בתנאי מיקרו-כבידה.' },
  { id: 'living', label: 'אזור מחיה', info: 'כאן אוכלים, עובדים, מתאמנים וישנים.' },
  { id: 'cupola', label: 'קופולה', info: 'חלון תצפית מרהיב אל כדור הארץ.' },
  { id: 'dragon', label: 'חללית עגונה', info: 'חלליות Dragon מביאות צוותים וציוד אל התחנה.' }
]
const activeInfo = ref('בקרו לפחות בשני אזורים בתחנת החלל כדי לפתוח את השאלון.')

function visit(id: string) {
  const marker = markers.find((item) => item.id === id)
  if (!marker) return
  if (!visited.value.includes(id)) visited.value.push(id)
  activeInfo.value = marker.info
  if (visited.value.length >= 2) emit('ready')
}

onMounted(() => {
  if (!host.value) return
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x07172f)
  const camera = new THREE.PerspectiveCamera(45, host.value.clientWidth / host.value.clientHeight, 0.1, 100)
  camera.position.set(0, 2.1, 7)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(host.value.clientWidth, host.value.clientHeight)
  host.value.appendChild(renderer.domElement)
  scene.add(new THREE.AmbientLight(0xffffff, 1.8))
  const light = new THREE.DirectionalLight(0xffe7b0, 2.2)
  light.position.set(4, 5, 6)
  scene.add(light)

  const station = new THREE.Group()
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xd6dbe4, roughness: .45, metalness: .25 })
  const gold = new THREE.MeshStandardMaterial({ color: 0xc29235, roughness: .5, metalness: .15 })
  const blue = new THREE.MeshStandardMaterial({ color: 0x183d77, roughness: .35, metalness: .1 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, .55, .55), bodyMaterial)
  station.add(body)
  for (let i = -2; i <= 2; i++) {
    const module = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .8, 24), bodyMaterial)
    module.rotation.z = Math.PI / 2
    module.position.x = i * .58
    station.add(module)
  }
  for (const x of [-2.05, 2.05]) {
    const boom = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, 2.5), gold)
    boom.position.x = x
    station.add(boom)
    for (const z of [-1.05, 1.05]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.65, .04, .78), blue)
      panel.position.set(x, 0, z)
      station.add(panel)
    }
  }
  const cupola = new THREE.Mesh(new THREE.SphereGeometry(.28, 24, 16), new THREE.MeshStandardMaterial({ color: 0x74b8ff, transparent: true, opacity: .75 }))
  cupola.position.set(.1, -.42, .42)
  station.add(cupola)
  scene.add(station)

  let frame = 0
  const animate = () => {
    frame = requestAnimationFrame(animate)
    station.rotation.y += .006
    station.rotation.x = Math.sin(Date.now() * .001) * .08
    renderer.render(scene, camera)
  }
  animate()

  const resize = () => {
    if (!host.value) return
    camera.aspect = host.value.clientWidth / host.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(host.value.clientWidth, host.value.clientHeight)
  }
  window.addEventListener('resize', resize)
  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', resize)
    renderer.dispose()
  })
})
</script>

<style scoped>
.three-wrap { display: grid; gap: 10px; }
.three-host { height: 230px; border-radius: 8px; overflow: hidden; background: #07172f; }
.marker-panel { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 3px; }
.marker-panel button { flex: 0 0 auto; min-height: 38px; border-radius: 8px; padding: 0 12px; color: #12243b; background: rgba(255,250,232,.78); border: 1px solid rgba(18,36,59,.18); font-weight: 700; }
.marker-panel button.visited { background: rgba(11,125,79,.16); border-color: rgba(11,125,79,.48); }
.scene-note { margin: 0; color: #4a5870; line-height: 1.45; }
</style>
