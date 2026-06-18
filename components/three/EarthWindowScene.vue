<template>
  <section class="three-wrap">
    <div ref="host" class="three-host" />
    <div class="orbit-data">
      <span>מהירות משוערת: 27,600 קמ"ש</span>
      <span>הקפה: כ-90 דקות</span>
      <span>{{ locationText }}</span>
    </div>
    <button class="primary-button" type="button" @click="emit('ready')">בדקתי את החלון</button>
  </section>
</template>

<script setup lang="ts">
import * as THREE from 'three'

const emit = defineEmits<{ ready: [] }>()
const host = ref<HTMLElement | null>(null)
const locationText = ref('מיקום מדומה: חולף מעל אזור אוקיינוס/יבשה')

onMounted(() => {
  fetch('https://api.wheretheiss.at/v1/satellites/25544')
    .then((res) => res.ok ? res.json() : null)
    .then((data) => {
      if (data?.latitude && data?.longitude) locationText.value = `מיקום חי: ${Number(data.latitude).toFixed(1)}°, ${Number(data.longitude).toFixed(1)}°`
    })
    .catch(() => undefined)

  if (!host.value) return
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x061126)
  const camera = new THREE.PerspectiveCamera(45, host.value.clientWidth / host.value.clientHeight, 0.1, 100)
  camera.position.z = 4.2
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(host.value.clientWidth, host.value.clientHeight)
  host.value.appendChild(renderer.domElement)
  scene.add(new THREE.AmbientLight(0xffffff, .8))
  const light = new THREE.DirectionalLight(0xffffff, 2)
  light.position.set(3, 2, 4)
  scene.add(light)
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0x2b6db6, roughness: .7, metalness: .05 })
  )
  scene.add(earth)
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.32, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x76ccff, transparent: true, opacity: .18 })
  )
  scene.add(atmosphere)
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.75, .008, 8, 96), new THREE.MeshBasicMaterial({ color: 0xd8bd6a }))
  orbit.rotation.x = Math.PI / 2.6
  scene.add(orbit)
  const iss = new THREE.Mesh(new THREE.BoxGeometry(.18, .08, .08), new THREE.MeshBasicMaterial({ color: 0xffffff }))
  scene.add(iss)
  let frame = 0
  const animate = () => {
    frame = requestAnimationFrame(animate)
    const t = Date.now() * .00045
    earth.rotation.y += .002
    iss.position.set(Math.cos(t) * 1.75, Math.sin(t * .7) * .65, Math.sin(t) * .45)
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
.three-wrap { display: grid; gap: 10px; }
.three-host { height: 240px; border-radius: 8px; overflow: hidden; background: #061126; }
.orbit-data { display: grid; gap: 6px; color: #40506b; font-size: .9rem; }
</style>
