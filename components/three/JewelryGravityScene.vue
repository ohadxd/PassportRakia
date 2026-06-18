<template>
  <div ref="host" class="three-host" />
</template>

<script setup lang="ts">
import * as THREE from 'three'

const props = defineProps<{ material: string; mode: 'earth' | 'microgravity'; piece: string; accent: string }>()
const host = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!host.value) return
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x07172f)
  const camera = new THREE.PerspectiveCamera(44, host.value.clientWidth / host.value.clientHeight, 0.1, 100)
  camera.position.z = 4.8
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setSize(host.value.clientWidth, host.value.clientHeight)
  renderer.domElement.dataset.jewelryCanvas = 'true'
  host.value.appendChild(renderer.domElement)
  scene.add(new THREE.AmbientLight(0xffffff, 1.5))
  const light = new THREE.DirectionalLight(0xffffff, 2)
  light.position.set(2, 4, 4)
  scene.add(light)
  const palette: Record<string, number> = { gold: 0xd6aa49, silver: 0xdce1e7, titanium: 0x798694, glass: 0x9fe6ff }
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(props.piece === 'chain' ? .95 : .78, props.piece === 'pendant' ? .05 : .09, 24, 80),
    new THREE.MeshStandardMaterial({ color: palette[props.material] || 0xd6aa49, metalness: props.material === 'glass' ? .05 : .75, roughness: .22, transparent: props.material === 'glass', opacity: props.material === 'glass' ? .55 : 1 })
  )
  scene.add(ring)
  const bead = new THREE.Mesh(new THREE.SphereGeometry(.16, 24, 16), new THREE.MeshStandardMaterial({ color: Number.parseInt(props.accent.replace('#', '0x')), roughness: .18, metalness: .2 }))
  scene.add(bead)
  let frame = 0
  const animate = () => {
    frame = requestAnimationFrame(animate)
    const t = Date.now() * .001
    ring.rotation.y += .008
    if (props.mode === 'earth') {
      bead.position.set(Math.sin(t) * .2, -.85 + Math.cos(t * 1.5) * .03, 0)
    } else {
      bead.position.set(Math.cos(t) * 1.05, Math.sin(t * 1.1) * .58, Math.sin(t) * .25)
    }
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
.three-host { height: 245px; border-radius: 8px; overflow: hidden; background: #07172f; }
</style>
