<template>
  <section class="liquid-demo">
    <div ref="host" class="three-host" />
    <label>
      כמות נוזל / מתח פנים
      <input v-model.number="tension" type="range" min="20" max="90" />
    </label>
    <p>קרני אור מתכנסות דרך עדשה נוזלית חלקה יותר ככל שמתח הפנים עולה.</p>
    <button class="primary-button" type="button" @click="emit('ready')">הפעלתי את הניסוי</button>
  </section>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { THEME } from '~/data/theme'

const emit = defineEmits<{ ready: [] }>()
const host = ref<HTMLElement | null>(null)
const tension = ref(58)

onMounted(() => {
  if (!host.value) return
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(THEME.bgHex)
  const camera = new THREE.PerspectiveCamera(45, host.value.clientWidth / host.value.clientHeight, 0.1, 100)
  camera.position.z = 5
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(host.value.clientWidth, host.value.clientHeight)
  host.value.appendChild(renderer.domElement)
  scene.add(new THREE.AmbientLight(0xffffff, 1))
  const light = new THREE.DirectionalLight(0xffffff, 2)
  light.position.set(2, 3, 4)
  scene.add(light)
  const droplet = new THREE.Mesh(
    new THREE.SphereGeometry(.9, 48, 32),
    new THREE.MeshPhysicalMaterial({ color: 0x9de3ff, transparent: true, opacity: .62, roughness: .05, transmission: .45 })
  )
  scene.add(droplet)
  const rays = new THREE.Group()
  const rayMaterial = new THREE.LineBasicMaterial({ color: 0xffdf82 })
  for (let i = -2; i <= 2; i++) {
    const points = [new THREE.Vector3(-2.2, i * .28, 0), new THREE.Vector3(0, i * .08, 0), new THREE.Vector3(2.1, -i * .18, 0)]
    rays.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), rayMaterial))
  }
  scene.add(rays)
  let frame = 0
  const animate = () => {
    frame = requestAnimationFrame(animate)
    const smooth = tension.value / 100
    droplet.scale.set(1 + smooth * .25, 1 - smooth * .1, .78 + smooth * .36)
    droplet.rotation.y += .005
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
.liquid-demo { display: grid; gap: 10px; }
.three-host { height: 230px; border-radius: 8px; overflow: hidden; background: var(--bg); }
label { display: grid; gap: 6px; font-family: var(--font-body); font-weight: 500; color: var(--text); }
p { margin: 0; color: var(--text-muted); }
</style>
