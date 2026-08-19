<template>
  <div class="babylon-shell">
    <div class="babylon-canvas-wrap">
      <div ref="host" class="babylon-host" />
      <div v-if="isLoading || sceneError" class="scene-state" :class="{ error: sceneError }">
        <span>{{ sceneError || 'טוען מנוע תלת-ממד...' }}</span>
      </div>
    </div>
    <div v-if="!sceneError" class="scene-hint">
      <span>{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
type JewelryBase = 'earring' | 'ring' | 'necklace'
type JewelryMaterial = 'gold' | 'silver' | 'titanium'
type JewelryTool = 'hoop' | 'chain' | 'gem' | 'charm'
type GravityMode = 'earth' | 'microgravity'
type InteractionMode = 'build' | 'move'

type Mesh = import('@babylonjs/core').Mesh
type AbstractMesh = import('@babylonjs/core').AbstractMesh
type PhysicsBody = import('@babylonjs/core').PhysicsBody
type Vector3 = import('@babylonjs/core').Vector3
type Quaternion = import('@babylonjs/core').Quaternion

// מיקום החלק על הבסיס — נשמר כדי לאפשר שחזור מלא של התכשיט (איזה גוף בסיס,
// הנקודה המקומית, נקודת העולם והנורמל). Tuples לשמירה קומפקטית.
type Vec3Tuple = [number, number, number]
type AnchorData = {
  hostId: string
  pivot: Vec3Tuple
  worldPosition: Vec3Tuple
  normal: Vec3Tuple
}

type SerializedPart = { id: string; type: JewelryTool; anchor: number; color: string; anchorData: AnchorData }

type JewelryPart = {
  id: string
  type: JewelryTool
  anchor: number
  color: string
  meshes: string[]
  anchorData: AnchorData
}

type JewelryDesign = {
  base: JewelryBase
  material: JewelryMaterial
  mode: GravityMode
  interactionMode: InteractionMode
  gemColor: string
  viewOffset: { x: number; y: number }
  parts: SerializedPart[]
}

type Babylon = typeof import('@babylonjs/core')
type HavokFactory = typeof import('@babylonjs/havok').default
type BodyRole = 'base' | 'part'

type BodyRecord = {
  id: string
  mesh: Mesh
  body: PhysicsBody
  role: BodyRole
  gravityFactor: number
  // Damping המתאים לכדור הארץ. במיקרו-כבידה משתמשים בערך זעיר קבוע
  // (MICROGRAVITY_DAMPING) כדי לשמר תנע קווי וזוויתי — שזו הסיבה האמיתית
  // שגופים בחלל ממשיכים לרחף ולהסתובב.
  earthLinearDamping: number
  earthAngularDamping: number
  resetPosition: Vector3
  resetRotation: Quaternion
}

// כמעט-אפס: שומר על שימור תנע במיקרו-כבידה בלי להגיע לחוסר יציבות נומרי.
const MICROGRAVITY_DAMPING = 0.04

// דמפינג גבוה בזמן מצב "הזזה": גורם לתזוזה איטית, עדינה ומבוקרת בעת גרירת
// התכשיט — במיוחד בחלל, שם הדמפינג הרגיל ≈0 והפיזיקה הייתה יוצאת אגרסיבית.
const MOVE_HANDLING_DAMPING = 2.6

type SupportRecord = {
  mesh: Mesh
  body: PhysicsBody
}

// נקודת עיגון נוצרת דינמית בכל מקום שנוגעים בו על הבסיס — אין יותר כדורי-עיגון
// קבועים ש"בולטים". worldPosition = נקודת המגע, normal = נורמל המשטח (לשיבוץ אבן
// ולהילת ה-hover), host/body/pivot = הגוף שעליו תולים ונקודת החיבור המקומית.
type AnchorPoint = {
  index: number
  host: Mesh
  body: PhysicsBody
  pivot: Vector3
  worldPosition: Vector3
  normal: Vector3
  angle: number
}

const props = defineProps<{
  base: JewelryBase
  material: JewelryMaterial
  tool: JewelryTool
  gemColor: string
  mode: GravityMode
  interactionMode: InteractionMode
  // טיוטה שמורה לשחזור אוטומטי בעת חזרה לעמוד (back-navigation).
  initialDesign?: JewelryDesign | null
}>()

const emit = defineEmits<{ designChange: [JewelryDesign] }>()

defineExpose({ clearAll, undoLast })

const host = ref<HTMLElement | null>(null)
const hint = ref('בחרו חלק וגעו בכל מקום על התכשיט כדי לחבר אותו')
const isLoading = ref(false)
const sceneError = ref('')

let BABYLON: Babylon | null = null
let HavokPhysics: HavokFactory | null = null
let engine: import('@babylonjs/core').Engine | null = null
let scene: import('@babylonjs/core').Scene | null = null
let resizeObserver: ResizeObserver | null = null
let resizeHandler: (() => void) | null = null
let activeCamera: import('@babylonjs/core').ArcRotateCamera | null = null
let hoverMarker: Mesh | null = null
let parts: JewelryPart[] = []
let bodyRecords: BodyRecord[] = []
let pendingResets = new Set<BodyRecord>()
let partCounter = 0
let anchorCounter = 0
// השחזור מהטיוטה מתבצע פעם אחת בלבד (בעלייה הראשונה של הקומפוננטה), לא בכל
// בנייה-מחדש של הסצנה (החלפת חומר/בסיס).
let restored = false
let renderCanvas: HTMLCanvasElement | null = null
let floorAggregate: import('@babylonjs/core').PhysicsAggregate | null = null
let initVersion = 0
let viewOffset = { x: 0, y: 0 }

const havokWasmUrl = new URL('../../node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm', import.meta.url).href

watch(() => props.mode, applyGravity)
watch(() => [props.base, props.material], () => { void resetScene() }, { deep: true })
watch(() => props.tool, () => {
  if (props.interactionMode === 'move') return
  hint.value = `כלי נבחר: ${toolLabel(props.tool)}. געו בכל מקום על התכשיט.`
})
watch(() => props.interactionMode, applyInteractionMode)
// אם הטיוטה מגיעה אחרי האתחול הראשון (האב מגדיר אותה ב-onMounted) ולבסיס הנוכחי
// כבר אין שינוי שיפעיל בנייה-מחדש — משחזרים ישירות לתוך הסצנה הקיימת.
watch(() => props.initialDesign, (design) => {
  if (restored || !design || !scene) return
  if (!bodyRecords.some((b) => b.role === 'base')) return
  if (design.base !== props.base) return
  restored = true
  restoreParts(design)
})

onMounted(() => {
  void bootScene()
})

onBeforeUnmount(() => {
  initVersion += 1
  disposeScene()
})

async function loadModules() {
  if (BABYLON && HavokPhysics) return
  const [babylonModule, havokModule] = await Promise.all([
    import('@babylonjs/core'),
    import('@babylonjs/havok')
  ])
  BABYLON = babylonModule
  HavokPhysics = havokModule.default
}

async function bootScene() {
  if (!host.value) return
  const version = ++initVersion
  isLoading.value = true
  sceneError.value = ''

  try {
    await nextTick()
    await loadModules()
    if (version !== initVersion) return
    await initScene(version)
    applyInteractionMode()
  } catch (error) {
    if (version === initVersion) {
      console.error('[JewelryGravityScene] Failed to initialize Babylon scene', error)
      sceneError.value = describeSceneError(error)
      disposeScene()
    }
  } finally {
    if (version === initVersion) isLoading.value = false
  }
}

function disposeScene() {
  resizeObserver?.disconnect()
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  engine?.stopRenderLoop()
  engine?.dispose()
  if (host.value) host.value.innerHTML = ''
  resizeObserver = null
  resizeHandler = null
  engine = null
  scene = null
  activeCamera = null
  hoverMarker = null
  parts = []
  bodyRecords = []
  pendingResets = new Set<BodyRecord>()
  renderCanvas = null
  floorAggregate = null
  viewOffset = { x: 0, y: 0 }
}

async function initScene(version: number) {
  if (!BABYLON || !HavokPhysics || !host.value) return
  if (!canCreateWebGLContext()) throw new Error('WebGL is not supported on this browser.')
  await waitForHostSize()
  if (version !== initVersion || !host.value) return

  disposeScene()
  host.value.innerHTML = ''
  parts = []
  partCounter = 0

  renderCanvas = document.createElement('canvas')
  renderCanvas.dataset.jewelryCanvas = 'true'
  host.value.appendChild(renderCanvas)

  engine = new BABYLON.Engine(renderCanvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true,
    powerPreference: 'high-performance'
  })
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  engine.setHardwareScalingLevel(1 / dpr)
  engine.onContextLostObservable.add(() => {
    sceneError.value = 'הדפדפן עצר את הקנבס התלת-ממדי. טענו את העמוד מחדש ונסו שוב.'
  })
  engine.onContextRestoredObservable.add(() => {
    if (!scene) void bootScene()
  })

  scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0.03, 0.05, 0.09, 1)

  const havokInstance = await HavokPhysics({
    locateFile(file) {
      return file.endsWith('.wasm') ? havokWasmUrl : file
    }
  })
  const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance)
  scene.enablePhysics(gravityVector(), havokPlugin)
  // צעד-משנה קבוע (~8.3ms) -> שני צעדי פיזיקה לכל פריים ב-60fps.
  // משפר את יציבות ה-joints והקוליזיה במקום לרסן בכוח את המהירויות.
  scene.getPhysicsEngine()?.setSubTimeStep(1000 / 120)

  setupCamera()
  setupLighting()
  setupStage()
  buildBase()
  setupPicking()
  scene.onAfterPhysicsObservable.add(afterPhysicsStep)
  applyGravity()
  // שחזור אוטומטי מהטיוטה — פעם אחת, ורק כשהבסיס שנבנה תואם לבסיס שבטיוטה.
  if (!restored && props.initialDesign && props.initialDesign.base === props.base) {
    restored = true
    restoreParts(props.initialDesign)
  }
  emitDesign()

  engine.runRenderLoop(() => {
    try {
      scene?.render()
    } catch (error) {
      console.error('[JewelryGravityScene] Render loop failed', error)
      sceneError.value = describeSceneError(error)
      engine?.stopRenderLoop()
    }
  })
  attachResizeHandling()
  requestAnimationFrame(() => engine?.resize())
}

async function resetScene() {
  if (!host.value) return
  await bootScene()
}

async function waitForHostSize() {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const rect = host.value?.getBoundingClientRect()
    if (rect && rect.width >= 24 && rect.height >= 24) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  throw new Error('The Babylon canvas container has no visible size.')
}

function canCreateWebGLContext() {
  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  return Boolean(gl)
}

function attachResizeHandling() {
  if (!host.value) return
  const resize = () => engine?.resize()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host.value)
  } else {
    resizeHandler = resize
    window.addEventListener('resize', resizeHandler)
  }
}

function describeSceneError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (/webgl/i.test(message)) return 'הדפדפן לא הצליח לפתוח WebGL עבור זירת התכשיט.'
  if (/wasm|havok/i.test(message)) return 'טעינת מנוע הפיזיקה Havok נכשלה. בדקו שהקובץ HavokPhysics.wasm נגיש מהשרת.'
  if (/visible size|canvas/i.test(message)) return 'הקנבס התלת-ממדי נטען לפני שהעמוד קיבל גודל תקין. רעננו את העמוד ונסו שוב.'
  return 'טעינת זירת התכשיט נכשלה. פרטי השגיאה נרשמו בקונסול הדפדפן.'
}

function setupCamera() {
  if (!BABYLON || !scene || !renderCanvas) return
  activeCamera = new BABYLON.ArcRotateCamera(
    'jewelryCamera',
    Math.PI / 2,
    Math.PI / 2.45,
    5.2,
    new BABYLON.Vector3(0, 1.15, 0),
    scene
  )
  // טווח זום רחב יותר (in/out) ותגובה מהירה יותר לגלגלת. panning כבוי כדי שהמרכז
  // יישאר על התכשיט. pinch מופעל אוטומטית למסכי מגע (תערוכה).
  activeCamera.lowerRadiusLimit = 2.4
  activeCamera.upperRadiusLimit = 14
  activeCamera.panningSensibility = 0
  activeCamera.wheelPrecision = 30
  activeCamera.pinchPrecision = 50
  activeCamera.useNaturalPinchZoom = true
  activeCamera.attachControl(renderCanvas, true)
}

function applyInteractionMode() {
  // עדכון הדמפינג למצב הנוכחי (הזזה => דמפינג-טיפול גבוה => גרירה עדינה).
  applyDamping()
  if (!activeCamera || !renderCanvas) return
  // המצלמה נשארת מחוברת בשני המצבים כדי שזום/סיבוב תמיד זמינים. בזמן גרירת חלק
  // היא מתנתקת זמנית (ב-onDragStart) ומתחברת מחדש (ב-onDragEnd) כדי שהמסך לא
  // יזוז יחד עם התכשיט.
  activeCamera.attachControl(renderCanvas, true)
  hint.value = props.interactionMode === 'move'
    ? 'גררו את התכשיט בעדינות. גלגלת או צביטה לזום, גרירה על רקע ריק לסיבוב.'
    : `כלי נבחר: ${toolLabel(props.tool)}. געו בכל מקום על התכשיט.`
  emitDesign()
}

function setupLighting() {
  if (!BABYLON || !scene) return
  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene)
  hemi.intensity = 0.85
  hemi.groundColor = new BABYLON.Color3(0.02, 0.04, 0.08)

  const key = new BABYLON.DirectionalLight('key', new BABYLON.Vector3(-0.45, -1, 0.55), scene)
  key.position = new BABYLON.Vector3(4, 7, -5)
  key.intensity = 1.55

  const rim = new BABYLON.PointLight('rim', new BABYLON.Vector3(-3.4, 2.2, 2.7), scene)
  rim.diffuse = new BABYLON.Color3(0.4, 0.86, 1)
  rim.intensity = 1.15

  const warm = new BABYLON.PointLight('warm', new BABYLON.Vector3(2.8, 1.8, 3.2), scene)
  warm.diffuse = new BABYLON.Color3(1, 0.72, 0.32)
  warm.intensity = 0.85
}

function setupStage() {
  if (!BABYLON || !scene) return
  const ground = BABYLON.MeshBuilder.CreateBox('earthFloor', { width: 8.4, height: 0.36, depth: 5.2 }, scene)
  ground.position.y = -1.4
  ground.material = material('deepNavy')
  ground.computeWorldMatrix(true)
  floorAggregate = new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, {
    mass: 0,
    friction: 0.8,
    restitution: 0.12
  }, scene)
}

function buildBase() {
  if (!BABYLON || !scene) return
  anchorCounter = 0
  createHoverMarker()
  if (props.base === 'ring') buildRingBase()
  else if (props.base === 'necklace') buildNecklaceBase()
  else buildEarringBase()
}

function buildRingBase() {
  if (!BABYLON) return
  const center = new BABYLON.Vector3(0, 1.38, 0)
  const ring = createTorusBody({
    name: 'base_ring',
    diameter: 2.25,
    thickness: 0.16,
    tessellation: 24,
    position: center,
    rotation: new BABYLON.Vector3(Math.PI / 2, 0, 0),
    mass: 1.2,
    role: 'base',
    gravityFactor: 1,
    linearDamping: 0.6,
    angularDamping: 0.8
  })

  const mount = createStaticBox(
    'ring_mount_pin',
    { width: 1.08, height: 0.08, depth: 0.12 },
    new BABYLON.Vector3(0, 2.78, 0)
  )
  createVisualTube('ring_hanger_line', [
    new BABYLON.Vector3(0, 2.76, 0),
    new BABYLON.Vector3(0, 2.53, 0)
  ], 0.024)
  connectSupportAtWorld(mount, ring, new BABYLON.Vector3(0, 2.74, 0), new BABYLON.Vector3(0, 2.53, 0))

  const topStone = BABYLON.MeshBuilder.CreatePolyhedron('centerStone', { type: 1, size: 0.34 }, scene!)
  topStone.position.set(0, 2.57, 0.08)
  topStone.material = material('gem')
  parentPreservingWorld(topStone, ring.mesh)
}

function buildEarringBase() {
  if (!BABYLON) return
  const center = new BABYLON.Vector3(0, 1.55, 0)
  const body = createTorusBody({
    name: 'base_earring_ring',
    diameter: 2.35,
    thickness: 0.12,
    tessellation: 24,
    position: center,
    rotation: new BABYLON.Vector3(Math.PI / 2, 0, 0),
    mass: 1,
    role: 'base',
    gravityFactor: 1,
    linearDamping: 0.6,
    angularDamping: 0.8
  })

  const hook = BABYLON.MeshBuilder.CreateTube('earring_hook', {
    path: [
      new BABYLON.Vector3(-0.1, 2.67, 0.02),
      new BABYLON.Vector3(-0.18, 2.86, 0.02),
      new BABYLON.Vector3(-0.08, 3.08, 0.01),
      new BABYLON.Vector3(0.18, 3.17, 0),
      new BABYLON.Vector3(0.38, 3.02, 0),
      new BABYLON.Vector3(0.39, 2.78, 0.01),
      new BABYLON.Vector3(0.25, 2.62, 0.02)
    ],
    radius: 0.038,
    tessellation: 24,
    cap: BABYLON.Mesh.CAP_ALL
  }, scene!)
  hook.material = material('metal')
  parentPreservingWorld(hook, body.mesh)

  const mount = createStaticBox(
    'earring_mount_pin',
    { width: 0.78, height: 0.08, depth: 0.12 },
    new BABYLON.Vector3(0.18, 3.24, 0)
  )
  createVisualTube('earring_hanger_line', [
    new BABYLON.Vector3(0.18, 3.21, 0),
    new BABYLON.Vector3(0.18, 3.08, 0)
  ], 0.02)
  connectSupportAtWorld(mount, body, new BABYLON.Vector3(0.18, 3.2, 0), new BABYLON.Vector3(0.18, 3.08, 0))

  const connector = BABYLON.MeshBuilder.CreateTube('earring_connector', {
    path: [
      new BABYLON.Vector3(0, 2.55, 0),
      new BABYLON.Vector3(0, 2.7, 0)
    ],
    radius: 0.034,
    tessellation: 20,
    cap: BABYLON.Mesh.CAP_ALL
  }, scene!)
  connector.material = material('metal')
  parentPreservingWorld(connector, body.mesh)
}

function buildNecklaceBase() {
  if (!BABYLON) return
  const links: BodyRecord[] = []
  for (let i = 0; i < 18; i += 1) {
    const t = i / 17
    const angle = Math.PI * (1.06 + t * 0.88)
    const link = createTorusBody({
      name: `base_necklace_link_${i}`,
      diameter: 0.28,
      thickness: 0.04,
      tessellation: 24,
      position: new BABYLON.Vector3(Math.cos(angle) * 1.62, 2.02 + Math.sin(angle) * 1.25, Math.sin(t * Math.PI) * 0.08),
      rotation: new BABYLON.Vector3(Math.PI / 2, 0, angle + (i % 2 ? Math.PI / 2 : 0)),
      mass: 0.22,
      role: 'base',
      gravityFactor: 1,
      linearDamping: 0.7,
      angularDamping: 0.9
    })
    links.push(link)
    if (i > 0) connectChainLink(links[i - 1], link)
  }

  const leftMount = createStaticBox(
    'necklace_left_mount_pin',
    { width: 0.58, height: 0.08, depth: 0.12 },
    new BABYLON.Vector3(-1.68, 2.12, 0)
  )
  const rightMount = createStaticBox(
    'necklace_right_mount_pin',
    { width: 0.58, height: 0.08, depth: 0.12 },
    new BABYLON.Vector3(1.68, 2.12, 0)
  )
  createVisualTube('necklace_left_hanger_line', [
    new BABYLON.Vector3(-1.68, 2.1, 0),
    links[0].mesh.position.clone()
  ], 0.018)
  createVisualTube('necklace_right_hanger_line', [
    new BABYLON.Vector3(1.68, 2.1, 0),
    links[links.length - 1].mesh.position.clone()
  ], 0.018)
  connectSupportAtWorld(leftMount, links[0], new BABYLON.Vector3(-1.68, 2.08, 0), links[0].mesh.position.clone())
  connectSupportAtWorld(rightMount, links[links.length - 1], new BABYLON.Vector3(1.68, 2.08, 0), links[links.length - 1].mesh.position.clone())
}

// בונה נקודת עיגון "על מקום" מתוך נגיעה על הבסיס: הגוף המארח, נקודת המגע בעולם
// והנורמל של המשטח. אין יותר כדורי-עיגון קבועים — אפשר לתלות בכל מקום.
function anchorFromPick(host: BodyRecord, worldPosition: Vector3, normal: Vector3): AnchorPoint {
  host.mesh.computeWorldMatrix(true)
  const angle = Math.atan2(normal.y, normal.x)
  return {
    index: anchorCounter++,
    host: host.mesh,
    body: host.body,
    pivot: worldToLocal(worldPosition, host.mesh),
    worldPosition: worldPosition.clone(),
    normal: normal.clone(),
    angle
  }
}

// הילה זהובה דקה ושטוחה שמופיעה רק מתחת לסמן (hover) ומיושרת לפי נורמל המשטח —
// מחליפה את הכדורים הבולטים ומנחה היכן יתחבר החלק.
function createHoverMarker() {
  if (!BABYLON || !scene) return
  const marker = BABYLON.MeshBuilder.CreateTorus('hover_marker', {
    diameter: 0.22,
    thickness: 0.022,
    tessellation: 32
  }, scene)
  marker.material = material('anchor')
  marker.isPickable = false
  marker.rotationQuaternion = BABYLON.Quaternion.Identity()
  marker.setEnabled(false)
  hoverMarker = marker
}

function moveHoverMarker(worldPosition: Vector3, normal: Vector3) {
  if (!BABYLON || !hoverMarker) return
  hoverMarker.setEnabled(true)
  // הסטה זעירה לאורך הנורמל כדי שההילה תשב על המשטח ולא תיחתך בתוכו.
  hoverMarker.position.copyFrom(worldPosition).addInPlace(normal.scale(0.012))
  BABYLON.Quaternion.FromUnitVectorsToRef(BABYLON.Vector3.Up(), normal, hoverMarker.rotationQuaternion!)
}

function hideHoverMarker() {
  hoverMarker?.setEnabled(false)
}

// אוריינטציה שמיישרת את ציר ה-Y של גוף אל הנורמל של המשטח (לשיבוץ אבן/צווארון).
function quaternionFromNormal(normal: Vector3) {
  if (!BABYLON) return undefined as never
  const q = BABYLON.Quaternion.Identity()
  BABYLON.Quaternion.FromUnitVectorsToRef(BABYLON.Vector3.Up(), normal, q)
  return q
}

function setupPicking() {
  if (!BABYLON || !scene) return
  scene.onPointerObservable.add((pointerInfo) => {
    if (!BABYLON || !scene) return
    if (props.interactionMode === 'move') { hideHoverMarker(); return }

    // hover: הילה זהובה עוקבת על המשטח כדי להראות היכן יתחבר החלק.
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
      const hit = scene.pick(scene.pointerX, scene.pointerY, isBaseMesh)
      if (hit?.hit && hit.pickedPoint) {
        moveHoverMarker(hit.pickedPoint, hit.getNormal(true, true) || BABYLON.Vector3.Up())
      } else {
        hideHoverMarker()
      }
      return
    }

    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      const hit = scene.pick(scene.pointerX, scene.pointerY, isBaseMesh)
      if (hit?.hit && hit.pickedPoint && hit.pickedMesh) {
        const host = baseRecordForMesh(hit.pickedMesh)
        if (!host) return
        const normal = hit.getNormal(true, true) || BABYLON.Vector3.Up()
        addPart(anchorFromPick(host, hit.pickedPoint, normal), props.tool)
        return
      }
      const any = scene.pick(scene.pointerX, scene.pointerY)
      if (any?.pickedMesh?.metadata?.role === 'part') {
        hint.value = 'כדי להזיז חלק עברו למצב הזזת תכשיט וגררו אותו.'
      }
    }
  })
}

// בודק אם mesh שייך לבסיס (כולל קישוטים שמחוברים אליו) — משמש כפרדיקט ל-pick.
function isBaseMesh(mesh: AbstractMesh) {
  return Boolean(baseRecordForMesh(mesh))
}

function baseRecordForMesh(mesh: AbstractMesh | null) {
  if (!mesh) return null
  return bodyRecords.find((record) =>
    record.role === 'base' && (record.mesh === mesh || mesh.parent === record.mesh)
  ) || null
}

function addPart(anchor: AnchorPoint, type: JewelryTool) {
  if (!BABYLON || !scene) return
  const id = `part_${partCounter++}`
  const created = type === 'chain'
    ? createChain(id, anchor)
    : type === 'hoop'
      ? createHoop(id, anchor)
      : type === 'charm'
        ? createCharm(id, anchor)
        : createGem(id, anchor)

  const anchorData: AnchorData = {
    hostId: anchor.host.name,
    pivot: [anchor.pivot.x, anchor.pivot.y, anchor.pivot.z],
    worldPosition: [anchor.worldPosition.x, anchor.worldPosition.y, anchor.worldPosition.z],
    normal: [anchor.normal.x, anchor.normal.y, anchor.normal.z]
  }
  parts.push({ id, type, anchor: anchor.index, color: props.gemColor, meshes: created, anchorData })
  hint.value = `${toolLabel(type)} נוסף לתכשיט.`
  emitDesign()
}

// שחזור החלקים מהטיוטה: לכל חלק משחזרים את נקודת העיגון מהגוף המארח + הנתונים
// המקומיים, ומפעילים מחדש את אותה פונקציית יצירה (replay) — שימוש חוזר בלוגיקה
// שכבר אומתה.
function restoreParts(design?: JewelryDesign | null) {
  if (!BABYLON || !design || design.base !== props.base) return
  design.parts.forEach((part) => {
    if (!part.anchorData) return
    const anchor = reconstructAnchor(part.anchorData)
    if (anchor) addPart(anchor, part.type)
  })
}

function reconstructAnchor(data: AnchorData): AnchorPoint | null {
  if (!BABYLON) return null
  const hostRecord = bodyRecords.find((r) => r.role === 'base' && r.id === data.hostId)
  if (!hostRecord) return null
  return {
    index: anchorCounter++,
    host: hostRecord.mesh,
    body: hostRecord.body,
    pivot: new BABYLON.Vector3(...data.pivot),
    worldPosition: new BABYLON.Vector3(...data.worldPosition),
    normal: new BABYLON.Vector3(...data.normal),
    angle: Math.atan2(data.normal[1], data.normal[0])
  }
}

// מוחק חלק בודד: כל ה-mesh-ים שלו + גופי הפיזיקה (כולל ה-constraints שלהם).
function disposePart(part: JewelryPart) {
  part.meshes.forEach((name) => {
    const idx = bodyRecords.findIndex((r) => r.id === name)
    if (idx >= 0) {
      const rec = bodyRecords[idx]
      pendingResets.delete(rec)
      rec.body.dispose()
      bodyRecords.splice(idx, 1)
    }
    scene?.getMeshByName(name)?.dispose()
  })
}

function undoLast() {
  const part = parts.pop()
  if (!part) return
  disposePart(part)
  hint.value = 'התוספת האחרונה הוסרה.'
  emitDesign()
}

function clearAll() {
  while (parts.length) disposePart(parts.pop()!)
  hint.value = 'התכשיט נוקה. בחרו חלק וגעו בתכשיט כדי להתחיל מחדש.'
  emitDesign()
}

// חישוק שמושחל בתכשיט: ממוקם כך שהקצה העליון שלו עובר דרך נקודת הנגיעה, ומחובר
// ב-ball-joint אל הבסיס (collision=false) — לכן הוא נשאר תלוי ומושחל ולא נופל.
function createHoop(id: string, anchor: AnchorPoint) {
  if (!BABYLON) return []
  const radius = 0.31
  const center = anchor.worldPosition.add(new BABYLON.Vector3(0, -radius, 0))
  const hoop = createTorusBody({
    name: `${id}_hoop`,
    diameter: radius * 2,
    thickness: 0.05,
    tessellation: 28,
    position: center,
    rotation: new BABYLON.Vector3(Math.PI / 2, 0, 0),
    mass: 0.3,
    role: 'part',
    gravityFactor: 1,
    linearDamping: 0.6,
    angularDamping: 1.3,
    metadata: { partId: id, tool: 'hoop' }
  })
  connectBall(anchor.body, hoop.body, anchor.pivot, worldToLocal(anchor.worldPosition, hoop.mesh), false)
  return [hoop.mesh.name]
}

// שרשרת פנינים: מחרוזת חרוזים כדוריים המחוברים ב-DistanceConstraint (ברוח
// הדוגמה של מחרוזת הפנינים) — נתלית מנקודת הנגיעה ומשתלשלת כמו שרשרת אמיתית.
function createChain(id: string, anchor: AnchorPoint) {
  if (!BABYLON) return []
  const names: string[] = []
  const beads: BodyRecord[] = []
  const top = anchor.worldPosition
  const beadCount = 10
  const pitch = 0.085
  const diameter = 0.07

  for (let i = 0; i < beadCount; i += 1) {
    const position = top.add(new BABYLON.Vector3(0, -0.12 - pitch * i, 0))
    const bead = createSphereBody({
      name: `${id}_pearl_${i}`,
      diameter,
      position,
      mass: 0.05,
      role: 'part',
      gravityFactor: 1,
      linearDamping: 0.6,
      angularDamping: 1.3,
      metadata: { partId: id, tool: 'chain', beadIndex: i }
    })
    beads.push(bead)
    names.push(bead.mesh.name)
    if (i === 0) {
      connectBall(anchor.body, bead.body, anchor.pivot, worldToLocal(top, bead.mesh), false)
    } else {
      connectBeadDistance(beads[i - 1].body, bead.body, pitch)
    }
  }

  return names
}

// אבן משובצת: צווארון מתכת (bezel) שטוח צמוד למשטח לפי הנורמל, ואבן מסותתת
// היושבת בתוכו — במקום פאליהדרון מרחף שבולט מהמשטח.
function createGem(id: string, anchor: AnchorPoint) {
  if (!BABYLON || !scene) return []
  const orient = quaternionFromNormal(anchor.normal)

  const bezel = BABYLON.MeshBuilder.CreateCylinder(`${id}_gem_bezel`, {
    diameterTop: 0.34,
    diameterBottom: 0.3,
    height: 0.08,
    tessellation: 28
  }, scene)
  bezel.material = material('metal')
  bezel.rotationQuaternion = orient.clone()
  bezel.position.copyFrom(anchor.worldPosition).addInPlace(anchor.normal.scale(0.02))
  bezel.metadata = { kind: 'fixedPart', partId: id, tool: 'gem' }
  parentPreservingWorld(bezel, anchor.host)

  const gem = BABYLON.MeshBuilder.CreatePolyhedron(`${id}_gem`, { type: 2, size: 0.15 }, scene)
  gem.material = material('gem')
  gem.rotationQuaternion = orient.clone()
  gem.position.copyFrom(anchor.worldPosition).addInPlace(anchor.normal.scale(0.1))
  gem.metadata = { kind: 'fixedPart', partId: id, tool: 'gem' }
  parentPreservingWorld(gem, anchor.host)

  return [bezel.name, gem.name]
}

// תליון על חוט ארוך: שלוש חוליות-חוט קטנות שיוצרות חוט נופל, והתליון בקצהו.
function createCharm(id: string, anchor: AnchorPoint) {
  if (!BABYLON || !scene) return []
  const names: string[] = []
  const cord: BodyRecord[] = []
  const top = anchor.worldPosition
  const cordCount = 3
  const cordStep = 0.22

  for (let i = 0; i < cordCount; i += 1) {
    const position = top.add(new BABYLON.Vector3(0, -0.14 - cordStep * i, 0))
    const link = createTorusBody({
      name: `${id}_cord_${i}`,
      diameter: 0.15,
      thickness: 0.026,
      tessellation: 18,
      position,
      rotation: new BABYLON.Vector3(Math.PI / 2, i % 2 ? Math.PI / 2 : 0, 0),
      mass: 0.07,
      role: 'part',
      gravityFactor: 1,
      linearDamping: 0.6,
      angularDamping: 1.3,
      scaling: new BABYLON.Vector3(1, 1, 1.4),
      metadata: { partId: id, tool: 'charm', cordIndex: i }
    })
    cord.push(link)
    names.push(link.mesh.name)
    if (i === 0) {
      connectBall(anchor.body, link.body, anchor.pivot, worldToLocal(top, link.mesh), false)
    } else {
      connectChainLink(cord[i - 1], cord[i])
    }
  }

  const charmTop = top.add(new BABYLON.Vector3(0, -0.14 - cordStep * cordCount, 0))
  const charm = BABYLON.MeshBuilder.CreateCylinder(`${id}_charm`, {
    diameterTop: 0,
    diameterBottom: 0.36,
    height: 0.44,
    tessellation: 4
  }, scene)
  charm.position.copyFrom(charmTop).addInPlace(new BABYLON.Vector3(0, -0.24, 0))
  charm.rotation.z = Math.PI / 4
  charm.material = material('gem')
  charm.metadata = { kind: 'physics', role: 'part', partId: id, tool: 'charm' }
  const record = createPhysicsBody(charm, BABYLON.PhysicsShapeType.CONVEX_HULL, {
    id: `${id}_charm`,
    mass: 0.2,
    friction: 0.55,
    restitution: 0.04,
    role: 'part',
    gravityFactor: 1,
    linearDamping: 0.6,
    angularDamping: 1.3
  })
  const lastLink = cord[cordCount - 1]
  connectBall(lastLink.body, record.body, worldToLocal(charmTop, lastLink.mesh), worldToLocal(charmTop, record.mesh), false)
  names.push(charm.name)
  return names
}

function createTorusBody(options: {
  name: string
  diameter: number
  thickness: number
  tessellation: number
  position: Vector3
  rotation: Vector3
  mass: number
  role: BodyRole
  gravityFactor: number
  linearDamping: number
  angularDamping: number
  scaling?: Vector3
  metadata?: Record<string, unknown>
}) {
  if (!BABYLON || !scene) return undefined as never
  const mesh = BABYLON.MeshBuilder.CreateTorus(options.name, {
    diameter: options.diameter,
    thickness: options.thickness,
    tessellation: options.tessellation
  }, scene)
  mesh.position.copyFrom(options.position)
  mesh.rotation.copyFrom(options.rotation)
  // scaling חייב להיקבע לפני יצירת גוף הפיזיקה כדי שה-CONVEX_HULL ייבנה על הצורה
  // המוקטנת/מאורכת (חוליות אליפטיות).
  if (options.scaling) mesh.scaling.copyFrom(options.scaling)
  mesh.material = material('metal')
  mesh.metadata = { kind: 'physics', role: options.role, bodyId: options.name, ...(options.metadata || {}) }

  // CONVEX_HULL ולא MESH: ב-Havok צורת MESH נתמכת רק לגופים סטטיים.
  // לגופים דינמיים היא יוצרת התנגשויות לא אמינות וטנזור אינרציה מעוות.
  return createPhysicsBody(mesh, BABYLON.PhysicsShapeType.CONVEX_HULL, {
    id: options.name,
    mass: options.mass,
    friction: 0.72,
    restitution: 0.02,
    role: options.role,
    gravityFactor: options.gravityFactor,
    linearDamping: options.linearDamping,
    angularDamping: options.angularDamping
  })
}

// חרוז כדורי (פנינה) עם צורת קוליזיה SPHERE מדויקת — אבן הבניין של שרשרת הפנינים.
function createSphereBody(options: {
  name: string
  diameter: number
  position: Vector3
  mass: number
  role: BodyRole
  gravityFactor: number
  linearDamping: number
  angularDamping: number
  metadata?: Record<string, unknown>
}) {
  if (!BABYLON || !scene) return undefined as never
  const mesh = BABYLON.MeshBuilder.CreateSphere(options.name, {
    diameter: options.diameter,
    segments: 16
  }, scene)
  mesh.position.copyFrom(options.position)
  mesh.material = material('pearl')
  mesh.metadata = { kind: 'physics', role: options.role, bodyId: options.name, ...(options.metadata || {}) }

  return createPhysicsBody(mesh, BABYLON.PhysicsShapeType.SPHERE, {
    id: options.name,
    mass: options.mass,
    friction: 0.5,
    restitution: 0.02,
    role: options.role,
    gravityFactor: options.gravityFactor,
    linearDamping: options.linearDamping,
    angularDamping: options.angularDamping
  })
}

function createStaticBox(name: string, size: { width: number; height: number; depth: number }, position: Vector3): SupportRecord {
  if (!BABYLON || !scene) return undefined as never
  const mesh = BABYLON.MeshBuilder.CreateBox(name, size, scene)
  mesh.position.copyFrom(position)
  mesh.material = material('support')
  mesh.metadata = { kind: 'support' }
  mesh.computeWorldMatrix(true)

  const aggregate = new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.BOX, {
    mass: 0,
    friction: 0.85,
    restitution: 0.02
  }, scene)
  aggregate.body.setMotionType(BABYLON.PhysicsMotionType.STATIC)
  return { mesh, body: aggregate.body }
}

function createVisualTube(name: string, path: Vector3[], radius: number) {
  if (!BABYLON || !scene) return
  const tube = BABYLON.MeshBuilder.CreateTube(name, {
    path,
    radius,
    tessellation: 12,
    cap: BABYLON.Mesh.CAP_ALL
  }, scene)
  tube.material = material('support')
  tube.metadata = { kind: 'support' }
}

function connectSupportAtWorld(support: SupportRecord, record: BodyRecord, supportWorld: Vector3, bodyWorld: Vector3) {
  support.mesh.computeWorldMatrix(true)
  record.mesh.computeWorldMatrix(true)
  connectBall(
    support.body,
    record.body,
    worldToLocal(supportWorld, support.mesh),
    worldToLocal(bodyWorld, record.mesh),
    false
  )
}

function createPhysicsBody(
  mesh: Mesh,
  shapeType: import('@babylonjs/core').PhysicsShapeType,
  options: {
    id: string
    mass: number
    friction: number
    restitution: number
    role: BodyRole
    gravityFactor: number
    linearDamping: number
    angularDamping: number
  }
) {
  if (!BABYLON || !scene) return undefined as never
  mesh.computeWorldMatrix(true)
  const aggregate = new BABYLON.PhysicsAggregate(mesh, shapeType, {
    mass: options.mass,
    friction: options.friction,
    restitution: options.restitution
  }, scene)
  aggregate.body.setMotionType(BABYLON.PhysicsMotionType.DYNAMIC)
  aggregate.body.setGravityFactor(options.gravityFactor)
  aggregate.body.disablePreStep = true

  const record: BodyRecord = {
    id: options.id,
    mesh,
    body: aggregate.body,
    role: options.role,
    gravityFactor: options.gravityFactor,
    earthLinearDamping: options.linearDamping,
    earthAngularDamping: options.angularDamping,
    resetPosition: mesh.position.clone(),
    resetRotation: meshRotation(mesh)
  }
  // ה-damping בפועל נקבע לפי מצב הכבידה (גם לחלקים שנוצרים תוך כדי מיקרו-כבידה).
  applyDampingToRecord(record)
  bodyRecords.push(record)
  attachDragBehavior(record)
  return record
}

function attachDragBehavior(record: BodyRecord) {
  if (!BABYLON || !renderCanvas) return
  const drag = new BABYLON.PointerDragBehavior({
    dragPlaneNormal: new BABYLON.Vector3(0, 0, 1)
  })
  drag.moveAttached = false
  let isDragging = false

  drag.onDragStartObservable.add(() => {
    if (props.interactionMode !== 'move') return
    isDragging = true
    // ניתוק המצלמה בתחילת הגרירה כדי שהמסך לא יזוז/יסתובב יחד עם התכשיט.
    activeCamera?.detachControl()
    record.body.disablePreStep = false
    record.body.setMotionType(BABYLON!.PhysicsMotionType.ANIMATED)
    zeroBody(record.body)
  })

  drag.onDragObservable.add((event) => {
    if (!isDragging || !BABYLON) return
    record.mesh.position.addInPlace(event.delta)
    record.mesh.computeWorldMatrix(true)
    record.body.setTargetTransform(record.mesh.position, meshRotation(record.mesh))
  })

  drag.onDragEndObservable.add(() => {
    if (!isDragging || !BABYLON) return
    isDragging = false
    record.mesh.computeWorldMatrix(true)
    record.body.setTargetTransform(record.mesh.position, meshRotation(record.mesh))
    zeroBody(record.body)
    record.body.setMotionType(BABYLON.PhysicsMotionType.DYNAMIC)
    record.body.disablePreStep = true
    // חיבור המצלמה מחדש בסיום הגרירה (זמינה בשני המצבים עבור זום/סיבוב).
    if (activeCamera && renderCanvas) activeCamera.attachControl(renderCanvas, true)
    viewOffset = {
      x: Number((activeCamera?.target.x || 0).toFixed(3)),
      y: Number(((activeCamera?.target.y || 1.15) - 1.15).toFixed(3))
    }
    emitDesign()
  })

  record.mesh.addBehavior(drag)
}

function connectBall(bodyA: PhysicsBody, bodyB: PhysicsBody, pivotA: Vector3, pivotB: Vector3, collision: boolean) {
  if (!BABYLON || !scene) return
  const joint = new BABYLON.PhysicsConstraint(
    BABYLON.PhysicsConstraintType.BALL_AND_SOCKET,
    {
      pivotA,
      pivotB,
      axisA: new BABYLON.Vector3(0, 1, 0),
      axisB: new BABYLON.Vector3(0, 1, 0),
      collision
    },
    scene
  )
  bodyA.addConstraint(bodyB, joint)
  joint.isCollisionsEnabled = collision
}

// חיבור שתי חוליות שרשרת בנקודת המגע ביניהן (אמצע המרחק).
// ball-joint בנקודה משותפת שומר מרחק קבוע ומאפשר סיבוב חופשי — כמו חוליה
// אמיתית. אילוץ DISTANCE עם maxDistance בלבד לא מנע קריסה של חוליות זו לתוך זו.
// חיבור שני חרוזים ב-DistanceConstraint (כמו במחרוזת הפנינים): שומר מרחק קבוע
// ביניהם ומתנהג כמו חוט. collision מבוטל בין חרוזים סמוכים.
function connectBeadDistance(bodyA: PhysicsBody, bodyB: PhysicsBody, distance: number) {
  if (!BABYLON || !scene) return
  const constraint = new BABYLON.DistanceConstraint(distance, scene)
  bodyA.addConstraint(bodyB, constraint)
  constraint.isCollisionsEnabled = false
}

function connectChainLink(upper: BodyRecord, lower: BodyRecord) {
  if (!BABYLON || !scene) return
  upper.mesh.computeWorldMatrix(true)
  lower.mesh.computeWorldMatrix(true)
  const contact = upper.mesh.getAbsolutePosition().add(lower.mesh.getAbsolutePosition()).scale(0.5)
  connectBall(
    upper.body,
    lower.body,
    worldToLocal(contact, upper.mesh),
    worldToLocal(contact, lower.mesh),
    false
  )
}

function afterPhysicsStep() {
  if (!BABYLON) return
  pendingResets.forEach((record) => {
    zeroBody(record.body)
    record.body.disablePreStep = true
    pendingResets.delete(record)
  })

  // רשת ביטחון בלבד: אם גוף ברח מאזור העבודה מחזירים אותו למקומו.
  // חיתוך המהירויות (clampBodyVelocity) הוסר — הוא היה לא פיזיקלי; היציבות
  // מושגת כעת דרך צורות convex, substeps ו-damping מאוזן.
  bodyRecords.forEach((record) => {
    if (isOutsideWorkArea(record)) resetBody(record)
  })
}

function isOutsideWorkArea(record: BodyRecord) {
  const position = record.mesh.getAbsolutePosition()
  if (Math.abs(position.x) > 4.2 || Math.abs(position.z) > 3.2) return true
  if (record.role === 'base') return position.y < -0.65 || position.y > 3.8
  return position.y < -4.2 || position.y > 4.8
}

function resetBody(record: BodyRecord) {
  if (!BABYLON) return
  record.body.disablePreStep = false
  zeroBody(record.body)
  record.mesh.position.copyFrom(record.resetPosition)
  record.mesh.rotationQuaternion = record.resetRotation.clone()
  record.mesh.computeWorldMatrix(true)
  zeroBody(record.body)
  pendingResets.add(record)
}

function zeroBody(body: PhysicsBody) {
  if (!BABYLON) return
  body.setLinearVelocity(BABYLON.Vector3.Zero())
  body.setAngularVelocity(BABYLON.Vector3.Zero())
}

function parentPreservingWorld(child: Mesh, parent: Mesh) {
  child.computeWorldMatrix(true)
  child.setParent(parent)
}

function worldToLocal(worldPosition: Vector3, mesh: Mesh) {
  if (!BABYLON) return undefined as never
  const inverse = mesh.getWorldMatrix().clone().invert()
  return BABYLON.Vector3.TransformCoordinates(worldPosition, inverse)
}

function meshRotation(mesh: Mesh) {
  if (!BABYLON) return undefined as never
  return mesh.rotationQuaternion?.clone() || BABYLON.Quaternion.FromEulerAngles(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z)
}

function applyGravity() {
  if (!BABYLON || !scene) return
  scene.getPhysicsEngine()?.setGravity(gravityVector())
  bodyRecords.forEach((record) => {
    record.body.setGravityFactor(record.gravityFactor)
  })
  applyDamping()
  applyBaseMotion()

  const onEarth = props.mode === 'earth'
  const floor = scene.getMeshByName('earthFloor')
  if (floor) floor.isVisible = onEarth
  // לבטל גם את הקוליידר של הרצפה במיקרו-כבידה — לא רק את הנראות שלה — כדי
  // שלא יישארו חלקים "נחים" על רצפה בלתי-נראית. membershipMask=0 => מתנגש בכלום.
  if (floorAggregate) floorAggregate.shape.filterMembershipMask = onEarth ? 1 : 0

  emitDesign()
}

// במיקרו-כבידה: damping זעיר וקבוע כדי לשמר תנע (ריחוף וסיבוב מתמשכים).
// בכדור הארץ: ה-damping ה"ארצי" שנקבע לכל גוף, לדמות התנגדות אוויר קלה.
function applyDamping() {
  bodyRecords.forEach(applyDampingToRecord)
}

// סעיף 4: בכדור הארץ הבסיס נעשה STATIC — קבוע במקומו, כך שרק המצלמה מקיפה
// אותו והחלקים התלויים מתנדנדים ממנו בעדינות. במיקרו-כבידה הבסיס חוזר להיות
// DYNAMIC כדי לרחף. (החלקים שומרים angularDamping גבוה יותר בכדור הארץ כדי לא
// להסתחרר מהר.)
function applyBaseMotion() {
  if (!BABYLON) return
  const onEarth = props.mode === 'earth'
  bodyRecords.forEach((record) => {
    if (record.role !== 'base') return
    if (onEarth) {
      zeroBody(record.body)
      record.body.setMotionType(BABYLON!.PhysicsMotionType.STATIC)
    } else {
      record.body.setMotionType(BABYLON!.PhysicsMotionType.DYNAMIC)
      record.body.setGravityFactor(record.gravityFactor)
      zeroBody(record.body)
    }
  })
}

function applyDampingToRecord(record: BodyRecord) {
  // במצב הזזה גוברים על מצב הכבידה ומחילים דמפינג-טיפול גבוה -> גרירה עדינה.
  if (props.interactionMode === 'move') {
    record.body.setLinearDamping(MOVE_HANDLING_DAMPING)
    record.body.setAngularDamping(MOVE_HANDLING_DAMPING)
  } else if (props.mode === 'microgravity') {
    record.body.setLinearDamping(MICROGRAVITY_DAMPING)
    record.body.setAngularDamping(MICROGRAVITY_DAMPING)
  } else {
    record.body.setLinearDamping(record.earthLinearDamping)
    record.body.setAngularDamping(record.earthAngularDamping)
  }
}

function gravityVector() {
  if (!BABYLON) return undefined as never
  // מיקרו-כבידה אמיתית ≈ 0g. יחד עם damping כמעט-אפסי זה מה שגורם לתכשיט
  // לרחף ולהמשיך להסתובב במקום לשקוע לאט אל רצפה.
  return props.mode === 'earth'
    ? new BABYLON.Vector3(0, -9.81, 0)
    : BABYLON.Vector3.Zero()
}

function material(kind: 'metal' | 'gem' | 'anchor' | 'deepNavy' | 'support' | 'pearl') {
  if (!BABYLON || !scene) return null as never
  const key = `${kind}_${props.material}_${props.gemColor}`
  const existing = scene.getMaterialByName(key)
  if (existing) return existing

  if (kind === 'pearl') {
    // StandardMaterial ולא PBR: חומרי PBR נטו (בלי environment texture) עלולים
    // להיראות כהים/בלתי-נראים על GPU של מובייל. נתיב התאורה הקלאסי הזה הוא מה
    // שכבר עובד לבסיס המתכת, ולכן הפנינים ייראו גם בפלאפון. emissive בהיר-מעט
    // מבטיח נראות גם בתאורה חלשה / על רקע כהה.
    const pearl = new BABYLON.StandardMaterial(key, scene)
    pearl.diffuseColor = new BABYLON.Color3(0.96, 0.95, 0.92)
    pearl.specularColor = new BABYLON.Color3(0.85, 0.85, 0.9)
    pearl.specularPower = 48
    pearl.emissiveColor = new BABYLON.Color3(0.22, 0.22, 0.25)
    return pearl
  }

  if (kind === 'gem') {
    const color = BABYLON.Color3.FromHexString(props.gemColor)
    const gem = new BABYLON.PBRMaterial(key, scene)
    gem.albedoColor = color
    gem.emissiveColor = color.scale(0.18)
    gem.metallic = 0.08
    gem.roughness = 0.12
    gem.alpha = props.gemColor === '#e9fbff' ? 0.72 : 0.95
    return gem
  }

  if (kind === 'anchor') {
    const anchorMaterial = new BABYLON.StandardMaterial(key, scene)
    anchorMaterial.diffuseColor = new BABYLON.Color3(1, 0.78, 0.28)
    anchorMaterial.emissiveColor = new BABYLON.Color3(0.28, 0.18, 0.04)
    return anchorMaterial
  }

  if (kind === 'deepNavy') {
    const floor = new BABYLON.StandardMaterial(key, scene)
    floor.diffuseColor = new BABYLON.Color3(0.02, 0.08, 0.16)
    floor.specularColor = new BABYLON.Color3(0.08, 0.12, 0.18)
    return floor
  }

  if (kind === 'support') {
    const support = new BABYLON.StandardMaterial(key, scene)
    support.diffuseColor = new BABYLON.Color3(0.58, 0.66, 0.72)
    support.emissiveColor = new BABYLON.Color3(0.08, 0.1, 0.11)
    support.specularColor = new BABYLON.Color3(0.85, 0.92, 0.98)
    support.specularPower = 42
    return support
  }

  const colors: Record<JewelryMaterial, string> = {
    gold: '#d6aa49',
    silver: '#dfe6ee',
    titanium: '#8995a2'
  }
  const metal = new BABYLON.StandardMaterial(key, scene)
  const color = BABYLON.Color3.FromHexString(colors[props.material])
  metal.diffuseColor = color
  metal.emissiveColor = color.scale(0.18)
  metal.specularColor = props.material === 'gold'
    ? new BABYLON.Color3(1, 0.86, 0.46)
    : new BABYLON.Color3(0.75, 0.82, 0.9)
  metal.specularPower = 64
  return metal
}

function emitDesign() {
  emit('designChange', {
    base: props.base,
    material: props.material,
    mode: props.mode,
    interactionMode: props.interactionMode,
    gemColor: props.gemColor,
    viewOffset,
    parts: parts.map((part) => ({
      id: part.id,
      type: part.type,
      anchor: part.anchor,
      color: part.color,
      anchorData: part.anchorData
    }))
  })
}

function toolLabel(tool: JewelryTool) {
  if (tool === 'chain') return 'שרשרת'
  if (tool === 'hoop') return 'חישוק'
  if (tool === 'gem') return 'אבן'
  return 'תליון'
}
</script>

<style scoped>
.babylon-shell {
  position: relative;
  border: 1px solid rgba(16, 44, 78, .18);
  border-radius: 8px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 24%, rgba(123, 220, 255, .15), transparent 34%),
    linear-gradient(145deg, #06142b, #07172f 58%, #020815);
}

.babylon-canvas-wrap {
  position: relative;
}

.babylon-host {
  width: 100%;
  height: clamp(330px, 52vw, 470px);
  touch-action: none;
}

.babylon-host :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
}

.scene-state {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 22px;
  color: rgba(247, 232, 191, .92);
  background: rgba(3, 10, 23, .6);
  text-align: center;
  font-weight: 900;
  line-height: 1.45;
}

.scene-state span {
  max-width: min(420px, 100%);
}

.scene-state.error {
  color: #ffe2d6;
  background: rgba(35, 8, 10, .74);
}

.scene-hint {
  position: absolute;
  inset-inline: 12px;
  bottom: 12px;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.scene-hint span {
  max-width: min(520px, 100%);
  border: 1px solid rgba(214,184,102,.26);
  border-radius: 999px;
  padding: 8px 12px;
  color: rgba(247, 232, 191, .92);
  background: rgba(4, 14, 31, .72);
  font-size: .88rem;
  font-weight: 800;
  text-align: center;
}

@media (max-width: 560px) {
  .babylon-host {
    height: 390px;
  }
}
</style>
