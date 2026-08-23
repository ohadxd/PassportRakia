<template>
  <section class="earth-window">
    <div
      ref="host"
      class="earth-host"
      @wheel.prevent="handleWheel"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerEnd"
      @pointercancel="handlePointerEnd"
      @pointerleave="handlePointerEnd"
    >
      <div v-if="isLoading || sceneError" class="scene-state" :class="{ error: sceneError }">
        <span>{{ sceneError || loadingText }}</span>
        <button v-if="sceneError" type="button" @click="refreshIssPosition">נסו שוב</button>
      </div>
    </div>

    <div class="live-panel" aria-label="נתוני מיקום תחנת החלל">
      <span>{{ regionText }}</span>
      <span>{{ coordinateText }}</span>
      <span>{{ altitudeText }}</span>
      <span>{{ speedText }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { THEME } from '~/data/theme'
import type { QuizQuestion } from '~/types/mission'

type IssSnapshot = {
  latitude: number
  longitude: number
  altitude: number
  velocity: number
  timestamp: number
}

type CoordinateLookup = {
  country_code?: string
  countryCode?: string
  timezone_id?: string
}

type RegionLookup = {
  label: string
  code: string
  isCountry: boolean
}

const props = defineProps<{ modelUrl?: string }>()

const emit = defineEmits<{
  ready: []
  locationQuestion: [QuizQuestion]
}>()

const ISS_API_URL = 'https://api.wheretheiss.at/v1/satellites/25544'
const EARTH_TEXTURE_URL = '/textures/earth/flat_earth03.jpg'
const EARTH_RADIUS = 1.36
const ISS_RADIUS = EARTH_RADIUS * 1.38
const ISS_DISPLAY_SIZE = 0.78
const ISS_REFRESH_MS = 20_000
const MIN_CAMERA_Z = 2.1
const MAX_CAMERA_Z = 6.5
const NO_COUNTRY_LABEL = 'לא מעל מדינה'
const COUNTRY_DISTRACTORS = [
  'ארצות הברית',
  'ברזיל',
  'אוסטרליה',
  'יפן',
  'הודו',
  'דרום אפריקה',
  'קנדה',
  'מקסיקו',
  'מצרים',
  'אינדונזיה',
  'ארגנטינה',
  'ספרד'
]
const COUNTRY_OVERRIDES: Record<string, string> = {
  US: 'ארצות הברית',
  GB: 'בריטניה',
  RU: 'רוסיה',
  CN: 'סין',
  JP: 'יפן',
  KR: 'קוריאה הדרומית',
  KP: 'קוריאה הצפונית',
  BR: 'ברזיל',
  ZA: 'דרום אפריקה',
  ID: 'אינדונזיה',
  IR: 'איראן',
  EG: 'מצרים',
  MX: 'מקסיקו',
  CA: 'קנדה',
  AU: 'אוסטרליה',
  IN: 'הודו',
  IL: 'ישראל'
}

const host = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const sceneError = ref('')
const snapshot = ref<IssSnapshot | null>(null)
const regionLabel = ref('ממתין למיקום חי מה־API...')
const modelLoaded = ref(false)

const regionText = computed(() => `מיקום נוכחי: ${regionLabel.value}`)
const loadingText = computed(() => snapshot.value
  ? 'טוען את מודל תחנת החלל מ־Firebase...'
  : 'טוען מיקום חי של תחנת החלל מה־API...'
)
const coordinateText = computed(() => {
  if (!snapshot.value) return 'קואורדינטות: ממתין לנתונים'
  return `קו רוחב ${formatCoordinate(snapshot.value.latitude)}°, קו אורך ${formatCoordinate(snapshot.value.longitude)}°`
})
const altitudeText = computed(() => {
  if (!snapshot.value) return 'גובה: ממתין לנתונים'
  return `גובה: ${Math.round(snapshot.value.altitude).toLocaleString('he-IL')} ק״מ`
})
const speedText = computed(() => {
  if (!snapshot.value) return 'מהירות: ממתין לנתונים'
  return `מהירות: ${Math.round(snapshot.value.velocity).toLocaleString('he-IL')} קמ״ש`
})

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let earthGroup: THREE.Group | null = null
let issNode: THREE.Object3D | null = null
let subpointNode: THREE.Object3D | null = null
let linkLine: THREE.Line | null = null
let resizeObserver: ResizeObserver | null = null
let focusQuaternion: THREE.Quaternion | null = null
let animationFrame = 0
let refreshTimer: number | undefined
let readyEmitted = false
let disposed = false
let lastPinchDistance = 0
const activePointers = new Map<number, { x: number; y: number }>()

onMounted(async () => {
  await nextTick()
  initScene()
  await refreshIssPosition(true)
  refreshTimer = window.setInterval(() => {
    void refreshIssPosition(false)
  }, ISS_REFRESH_MS)
})

onBeforeUnmount(() => {
  disposed = true
  if (refreshTimer) window.clearInterval(refreshTimer)
  disposeScene()
})

async function refreshIssPosition(showLoading = true) {
  if (showLoading) isLoading.value = true
  sceneError.value = ''

  try {
    const modelPromise = (modelLoaded.value ? Promise.resolve() : loadIssModel())
      .catch((error) => {
        console.error('[EarthWindowScene] Failed to load the ISS model', error)
      })
    const nextSnapshot = await withTimeout(fetchIssSnapshot(), 7000)
    if (disposed) return
    snapshot.value = nextSnapshot
    regionLabel.value = 'בודק מעל איזו מדינה נמצאת התחנה...'
    updateIssMarker(nextSnapshot)

    const region = await resolveRegion(nextSnapshot.latitude, nextSnapshot.longitude)
    if (disposed) return

    regionLabel.value = region.label
    await withTimeout(modelPromise, 10000).catch((error) => {
      console.error('[EarthWindowScene] ISS model loading timed out', error)
    })
    if (disposed) return
    emit('locationQuestion', buildLocationQuestion(region, nextSnapshot))
    emitReady()
  } catch (error) {
    console.error('[EarthWindowScene] Failed to load live ISS position', error)
    if (showLoading || !snapshot.value) sceneError.value = describeSceneError(error)
  } finally {
    if (showLoading) isLoading.value = false
  }
}

function initScene() {
  if (!host.value || scene || disposed) return
  const width = Math.max(320, host.value.clientWidth)
  const height = Math.max(260, host.value.clientHeight)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(THEME.bgDeepHex)

  camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
  camera.position.set(0, 0.2, 3.65)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  host.value.innerHTML = ''
  host.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.64)
  scene.add(ambient)

  const sun = new THREE.DirectionalLight(0xffffff, 2.2)
  sun.position.set(3.4, 2.2, 4.4)
  scene.add(sun)

  const rim = new THREE.DirectionalLight(0x7cc7ff, 0.7)
  rim.position.set(-4, 1.2, -2)
  scene.add(rim)

  earthGroup = new THREE.Group()
  scene.add(earthGroup)
  buildEarth()
  buildIssMarker()
  animate()

  resizeObserver = new ResizeObserver(resizeScene)
  resizeObserver.observe(host.value)
}

function buildEarth() {
  if (!earthGroup || !renderer) return

  const loader = new THREE.TextureLoader()
  const earthTexture = loader.load(EARTH_TEXTURE_URL)
  earthTexture.colorSpace = THREE.SRGBColorSpace
  earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS, 96, 64),
    new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.82,
      metalness: 0.02
    })
  )
  earthGroup.add(earth)

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.025, 96, 64),
    new THREE.MeshBasicMaterial({
      color: 0x6dc5ff,
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide
    })
  )
  earthGroup.add(atmosphere)
}

function buildIssMarker() {
  if (!earthGroup) return

  subpointNode = new THREE.Mesh(
    new THREE.RingGeometry(0.04, 0.067, 40),
    new THREE.MeshBasicMaterial({ color: 0xbdeaff, transparent: true, opacity: 0.92, side: THREE.DoubleSide })
  )
  earthGroup.add(subpointNode)

  issNode = new THREE.Group()
  earthGroup.add(issNode)

  linkLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineBasicMaterial({ color: 0xbdeaff, transparent: true, opacity: 0.42 })
  )
  earthGroup.add(linkLine)
}

async function loadIssModel() {
  if (!props.modelUrl) throw new Error('ISS_MODEL_URL_MISSING')
  if (!issNode) throw new Error('ISS_MODEL_NODE_MISSING')
  if (modelLoaded.value) return

  const gltf = await new GLTFLoader().loadAsync(props.modelUrl)
  if (disposed || !issNode) return
  issNode.clear()
  const model = gltf.scene
  model.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.castShadow = false
      node.receiveShadow = false
      node.frustumCulled = false
    }
  })

  const bounds = new THREE.Box3().setFromObject(model)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  bounds.getSize(size)
  bounds.getCenter(center)

  model.position.sub(center)
  const maxAxis = Math.max(size.x, size.y, size.z)
  if (!Number.isFinite(maxAxis) || maxAxis <= 0) throw new Error('ISS_MODEL_INVALID_BOUNDS')
  model.scale.setScalar(ISS_DISPLAY_SIZE / maxAxis)
  model.rotation.set(0.25, -0.35, 0.12)
  issNode.add(model)
  modelLoaded.value = true
}

function describeSceneError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('ISS_MODEL')) {
    return 'מודל תחנת החלל מ־Firebase לא נטען. בדקו שהטוקן והקובץ iss.glb זמינים.'
  }
  if (/api|fetch|network|coordinate|timed out|timeout/i.test(message)) {
    return 'מיקום תחנת החלל לא נטען מה־API. בדקו חיבור ונסו שוב.'
  }
  return 'טעינת חלון כדור הארץ נכשלה. פרטי השגיאה נרשמו בקונסול.'
}

function updateIssMarker(position: IssSnapshot) {
  if (!earthGroup || !issNode || !subpointNode || !linkLine) return

  const surface = latLonToVector(position.latitude, position.longitude, EARTH_RADIUS * 1.006)
  const station = latLonToVector(position.latitude, position.longitude, ISS_RADIUS)

  subpointNode.position.copy(surface)
  subpointNode.lookAt(surface.clone().multiplyScalar(1.12))

  issNode.position.copy(station)
  issNode.lookAt(station.clone().multiplyScalar(1.12))

  linkLine.geometry.dispose()
  linkLine.geometry = new THREE.BufferGeometry().setFromPoints([surface, station])

  const stationDirection = latLonToVector(position.latitude, position.longitude, 1).normalize()
  focusQuaternion = new THREE.Quaternion().setFromUnitVectors(stationDirection, new THREE.Vector3(0, 0, 1))
  earthGroup.quaternion.slerp(focusQuaternion, 0.9)
}

function animate() {
  if (!scene || !camera || !renderer || disposed) return
  animationFrame = requestAnimationFrame(animate)

  if (earthGroup) {
    if (focusQuaternion) earthGroup.quaternion.slerp(focusQuaternion, 0.08)
    else earthGroup.rotation.y += 0.0009
  }
  if (issNode) {
    issNode.rotation.y += 0.01
  }

  renderer.render(scene, camera)
}

function resizeScene() {
  if (!host.value || !camera || !renderer) return
  const width = Math.max(320, host.value.clientWidth)
  const height = Math.max(260, host.value.clientHeight)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function disposeScene() {
  window.cancelAnimationFrame(animationFrame)
  resizeObserver?.disconnect()
  if (host.value) host.value.innerHTML = ''

  scene?.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry?.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose()
      })
      material.dispose()
    })
  })
  renderer?.dispose()

  scene = null
  camera = null
  renderer = null
  earthGroup = null
  issNode = null
  subpointNode = null
  linkLine = null
  resizeObserver = null
  focusQuaternion = null
  refreshTimer = undefined
  modelLoaded.value = false
  activePointers.clear()
}

async function fetchIssSnapshot() {
  const response = await fetch(ISS_API_URL)
  if (!response.ok) throw new Error(`ISS API failed: ${response.status}`)
  const data = await response.json()

  const nextSnapshot: IssSnapshot = {
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    altitude: Number(data.altitude),
    velocity: Number(data.velocity),
    timestamp: Number(data.timestamp)
  }

  if (!Number.isFinite(nextSnapshot.latitude) || !Number.isFinite(nextSnapshot.longitude)) {
    throw new Error('ISS API returned invalid coordinates')
  }

  return nextSnapshot
}

async function fetchCoordinateLookup(latitude: number, longitude: number) {
  const response = await fetch(`https://api.wheretheiss.at/v1/coordinates/${latitude},${longitude}`)
  if (!response.ok) throw new Error(`Coordinate API failed: ${response.status}`)
  return await response.json() as CoordinateLookup
}

async function resolveRegion(latitude: number, longitude: number): Promise<RegionLookup> {
  const coordinate = await withTimeout(fetchCoordinateLookup(latitude, longitude), 5200)
  const code = coordinate.country_code || coordinate.countryCode || '??'
  return {
    label: labelForCountryCode(code),
    code,
    isCountry: code !== '??'
  }
}

function latLonToVector(latitude: number, longitude: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - latitude)
  const theta = THREE.MathUtils.degToRad(longitude + 180)

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function labelForCountryCode(code: string) {
  const normalized = code.toUpperCase()
  if (!normalized || normalized === '??') return NO_COUNTRY_LABEL
  if (COUNTRY_OVERRIDES[normalized]) return COUNTRY_OVERRIDES[normalized]

  try {
    const DisplayNames = (Intl as unknown as {
      DisplayNames?: new (locales: string[], options: { type: 'region' }) => { of: (code: string) => string | undefined }
    }).DisplayNames
    return DisplayNames ? (new DisplayNames(['he'], { type: 'region' }).of(normalized) || normalized) : normalized
  } catch {
    return normalized
  }
}

function buildLocationQuestion(region: RegionLookup, position: IssSnapshot): QuizQuestion {
  const questionText = region.isCountry
    ? 'לפי ה־API, מעל איזו מדינה נמצאת תחנת החלל עכשיו?'
    : 'לפי ה־API, האם תחנת החלל נמצאת עכשיו מעל מדינה?'
  const pool = COUNTRY_DISTRACTORS
  const distractors = pool.filter((option) => option !== region.label).slice(0, 2)
  const correctIndex = Math.abs(Math.round(position.latitude * 10) + Math.round(position.longitude * 10)) % 3
  const answers = [...distractors]
  answers.splice(correctIndex, 0, region.label)

  return {
    id: `earth-window-live-${position.timestamp}`,
    text: questionText,
    answers,
    correctIndex
  }
}

function emitReady() {
  if (readyEmitted) return
  readyEmitted = true
  emit('ready')
}

function formatCoordinate(value: number) {
  return value.toFixed(2)
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Timed out')), ms)
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeout))
  })
}

function handleWheel(event: WheelEvent) {
  zoomCamera(event.deltaY > 0 ? 0.28 : -0.28)
}

function handlePointerDown(event: PointerEvent) {
  if (!host.value) return
  host.value.setPointerCapture?.(event.pointerId)
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  if (activePointers.size === 2) lastPinchDistance = pinchDistance()
}

function handlePointerMove(event: PointerEvent) {
  if (!activePointers.has(event.pointerId)) return
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  if (activePointers.size !== 2) return

  const nextDistance = pinchDistance()
  if (!lastPinchDistance) {
    lastPinchDistance = nextDistance
    return
  }

  zoomCamera((lastPinchDistance - nextDistance) * 0.012)
  lastPinchDistance = nextDistance
}

function handlePointerEnd(event: PointerEvent) {
  activePointers.delete(event.pointerId)
  if (host.value?.hasPointerCapture?.(event.pointerId)) host.value.releasePointerCapture(event.pointerId)
  if (activePointers.size < 2) lastPinchDistance = 0
}

function pinchDistance() {
  const points = [...activePointers.values()]
  if (points.length < 2) return 0
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
}

function zoomCamera(delta: number) {
  if (!camera) return
  camera.position.z = THREE.MathUtils.clamp(camera.position.z + delta, MIN_CAMERA_Z, MAX_CAMERA_Z)
}

</script>

<style scoped>
.earth-window {
  display: grid;
  gap: 10px;
}

.earth-host {
  position: relative;
  height: clamp(285px, 56vw, 430px);
  overflow: hidden;
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 46%, rgba(var(--accent-rgb), .18), transparent 32%),
    var(--bg-deep);
  box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb), .18);
  touch-action: none;
}

.earth-host :deep(canvas) {
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

.live-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.live-panel span {
  min-height: 38px;
  display: flex;
  align-items: center;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 8px 10px;
  color: var(--text);
  background: var(--surface);
  font-size: .88rem;
  font-family: var(--font-body);
  font-weight: 500;
  line-height: 1.35;
}

@media (max-width: 560px) {
  .earth-host {
    height: 360px;
  }

  .live-panel {
    grid-template-columns: 1fr;
  }
}
</style>
