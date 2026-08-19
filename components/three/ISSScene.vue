<template>
  <section class="three-wrap">
    <div ref="host" class="three-host">
      <div v-if="isLoading || modelError" class="scene-state" :class="{ error: modelError }">
        <span>{{ sceneNote }}</span>
        <button v-if="modelError" type="button" @click="retryLoad">נסו שוב</button>
      </div>
    </div>
    <p class="scene-note" :class="{ error: modelError }">{{ sceneNote }}</p>
  </section>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import localIssModelUrl from '~/assets/iss.glb?url'
import { THEME } from '~/data/theme'

const props = defineProps<{ modelUrl?: string }>()
const emit = defineEmits<{ ready: [] }>()

const host = ref<HTMLElement | null>(null)
const sceneNote = ref('טוען את מודל תחנת החלל...')
const modelError = ref(false)
const isLoading = ref(true)

let frame = 0
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let resizeObserver: ResizeObserver | null = null
let station: THREE.Group | null = null
let readyEmitted = false
let disposed = false

onMounted(() => {
  void initScene()
})

onBeforeUnmount(() => {
  disposed = true
  disposeScene()
})

async function retryLoad() {
  disposeScene()
  disposed = false
  readyEmitted = false
  await nextTick()
  void initScene()
}

async function initScene() {
  if (!host.value) return
  isLoading.value = true
  modelError.value = false
  sceneNote.value = 'טוען את מודל תחנת החלל...'

  try {
    await waitForHostSize()
    if (!host.value || disposed) return

    setupScene()
    animate()
    await loadStationModel()
    if (disposed) return

    isLoading.value = false
    modelError.value = false
    sceneNote.value = 'מודל תחנת החלל נטען. ענו על השאלות לפי הטקסט שעל קיר התערוכה.'
    emitReady()
  } catch (error) {
    console.error('[ISSScene] Failed to initialize ISS model', error)
    isLoading.value = false
    modelError.value = true
    sceneNote.value = describeModelError(error)
  }
}

function setupScene() {
  if (!host.value) return
  host.value.innerHTML = ''

  const width = Math.max(320, host.value.clientWidth)
  const height = Math.max(230, host.value.clientHeight)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(THEME.bgHex)

  camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
  camera.position.set(0, 0.35, 5.2)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(width, height)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  host.value.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 1.55))

  const key = new THREE.DirectionalLight(0xffe7b0, 2.7)
  key.position.set(4, 5, 6)
  scene.add(key)

  const fill = new THREE.DirectionalLight(0xffffff, 1.1)
  fill.position.set(-2, -1, 3)
  scene.add(fill)

  const rim = new THREE.DirectionalLight(0x9ed8ff, 1.35)
  rim.position.set(-4, 2, -3)
  scene.add(rim)

  station = new THREE.Group()
  scene.add(station)

  resizeObserver = new ResizeObserver(resizeScene)
  resizeObserver.observe(host.value)
}

async function loadStationModel() {
  if (!station) throw new Error('ISS_SCENE_NOT_READY')

  const urls = [props.modelUrl, localIssModelUrl].filter((url, index, list): url is string => Boolean(url) && list.indexOf(url) === index)
  let gltf: Awaited<ReturnType<GLTFLoader['loadAsync']>> | null = null
  let lastError: unknown

  for (const url of urls) {
    try {
      gltf = await new GLTFLoader().loadAsync(url)
      break
    } catch (error) {
      lastError = error
      console.warn('[ISSScene] Failed to load ISS model candidate', url, error)
    }
  }

  if (!gltf) throw lastError || new Error('ISS_MODEL_URL_MISSING')
  if (disposed || !station) return

  const model = gltf.scene
  model.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    node.frustumCulled = false
    const materials = Array.isArray(node.material) ? node.material : [node.material]
    materials.filter(Boolean).forEach((material) => {
      material.side = THREE.DoubleSide
      material.needsUpdate = true
    })
  })

  const bounds = new THREE.Box3().setFromObject(model)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  bounds.getSize(size)
  bounds.getCenter(center)

  const maxAxis = Math.max(size.x, size.y, size.z)
  if (!Number.isFinite(maxAxis) || maxAxis <= 0) throw new Error('ISS_MODEL_INVALID_BOUNDS')

  model.position.sub(center)
  model.scale.setScalar(3.75 / maxAxis)
  station.add(model)
}

function animate() {
  if (!scene || !camera || !renderer || disposed) return
  frame = requestAnimationFrame(animate)

  if (station) {
    station.rotation.y += 0.006
    station.rotation.x = Math.sin(Date.now() * 0.001) * 0.055
  }

  renderer.render(scene, camera)
}

function resizeScene() {
  if (!host.value || !camera || !renderer) return
  const width = Math.max(320, host.value.clientWidth)
  const height = Math.max(230, host.value.clientHeight)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function disposeScene() {
  if (frame) cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
  if (host.value) host.value.innerHTML = ''

  scene?.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry?.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.filter(Boolean).forEach(disposeMaterial)
  })
  renderer?.dispose()

  frame = 0
  renderer = null
  scene = null
  camera = null
  resizeObserver = null
  station = null
}

function disposeMaterial(material: THREE.Material) {
  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) value.dispose()
  })
  material.dispose()
}

function emitReady() {
  if (readyEmitted) return
  readyEmitted = true
  emit('ready')
}

async function waitForHostSize() {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const rect = host.value?.getBoundingClientRect()
    if (rect && rect.width >= 24 && rect.height >= 24) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  throw new Error('ISS_HOST_HAS_NO_SIZE')
}

function describeModelError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('ISS_MODEL_URL_MISSING')) return 'לא הוגדר קובץ מודל לתחנת החלל.'
  if (message.includes('ISS_HOST_HAS_NO_SIZE')) return 'אזור התלת־ממד לא קיבל גודל תקין. נסו לרענן את העמוד.'
  return 'מודל תחנת החלל מ־Firebase לא נטען. בדקו חיבור ונסו שוב.'
}
</script>

<style scoped>
.three-wrap {
  display: grid;
  gap: 10px;
}

.three-host {
  position: relative;
  height: clamp(260px, 52vw, 390px);
  overflow: hidden;
  border-radius: 8px;
  background: var(--bg);
}

.three-host :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
}

.scene-state {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 22px;
  color: var(--text);
  background: rgba(var(--bg-deep-rgb), .64);
  text-align: center;
  font-family: var(--font-body);
  font-weight: 500;
}

.scene-state.error {
  color: var(--error-text);
  background: rgba(var(--red-rgb), .28);
}

.scene-state button {
  min-height: 38px;
  border: 1px solid rgba(255,255,255,.36);
  border-radius: 8px;
  padding: 0 14px;
  color: var(--bg);
  background: var(--accent);
  font-family: var(--font-body);
  font-weight: 500;
}

.scene-note {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.45;
}

.scene-note.error {
  color: var(--error-text);
}
</style>
