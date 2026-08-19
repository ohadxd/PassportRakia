<template>
  <section class="velcro">
    <div ref="host" class="three-host" />
    <p>הצמידו את כל החפצים לאזורי הסקוץ׳.</p>
    <div class="object-grid">
      <button v-for="item in objects" :key="item" :disabled="secured.includes(item)" type="button" @click="secure(item)">
        {{ secured.includes(item) ? 'מקובע' : item }}
      </button>
    </div>
    <button class="primary-button" type="button" :disabled="secured.length < objects.length" @click="emit('ready')">כל החפצים מקובעים</button>
  </section>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { THEME } from '~/data/theme'

const emit = defineEmits<{ ready: [] }>()
const host = ref<HTMLElement | null>(null)
const objects = ['שקית אוכל', 'כפית', 'מברשת שיניים', 'מגבון', 'אריזת קורנפלקס', 'כלי קטן']
const secured = ref<string[]>([])

function secure(item: string) {
  if (!secured.value.includes(item)) secured.value.push(item)
}

onMounted(() => {
  if (!host.value) return
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(THEME.bg2Hex)
  const camera = new THREE.PerspectiveCamera(45, host.value.clientWidth / host.value.clientHeight, 0.1, 100)
  camera.position.z = 5
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(host.value.clientWidth, host.value.clientHeight)
  host.value.appendChild(renderer.domElement)
  scene.add(new THREE.AmbientLight(0xffffff, 1.5))
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.4, .08), new THREE.MeshStandardMaterial({ color: 0x1d385e, roughness: .8 }))
  cabin.position.z = -1
  scene.add(cabin)
  const dots: THREE.Mesh[] = []
  for (let i = 0; i < objects.length; i++) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(.12 + i * .01, 16, 12), new THREE.MeshStandardMaterial({ color: [0xf0d77a, 0xd9e2ef, 0x71b7ff, 0xc7d5c0, 0xe1a65c, 0xf2f2f2][i] }))
    mesh.position.set(-1.8 + i * .72, Math.sin(i) * .55, .1)
    scene.add(mesh)
    dots.push(mesh)
  }
  let frame = 0
  const animate = () => {
    frame = requestAnimationFrame(animate)
    dots.forEach((dot, index) => {
      if (!secured.value.includes(objects[index])) {
        dot.position.y += Math.sin(Date.now() * .001 + index) * .002
        dot.rotation.y += .02
      } else {
        dot.position.y = -.86
      }
    })
    renderer.render(scene, camera)
  }
  animate()
  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    renderer.dispose()
  })
})
</script>

<style scoped>
.velcro { display: grid; gap: 10px; }
.three-host { height: 220px; border-radius: 8px; overflow: hidden; }
.object-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.object-grid button { min-height: 40px; border-radius: 8px; background: var(--surface); border: 1px solid var(--surface-border); font-family: var(--font-body); font-weight: 500; }
p { margin: 0; color: var(--text-muted); }
</style>
