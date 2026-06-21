<template>
  <div class="babylon-shell">
    <div ref="host" class="babylon-host" />
    <div class="scene-hint">
      <span>{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
type JewelryBase = 'earring' | 'ring' | 'necklace'
type JewelryMaterial = 'gold' | 'silver' | 'titanium'
type JewelryTool = 'hoop' | 'chain' | 'gem' | 'charm'
type GravityMode = 'earth' | 'microgravity'

type JewelryPart = {
  id: string
  type: JewelryTool
  anchor: number
  color: string
  meshes: string[]
}

type JewelryDesign = {
  base: JewelryBase
  material: JewelryMaterial
  mode: GravityMode
  gemColor: string
  parts: Array<{ id: string; type: JewelryTool; anchor: number; color: string }>
}

type Babylon = typeof import('@babylonjs/core')
type HavokFactory = typeof import('@babylonjs/havok').default
type ThreadedPart = {
  id: string
  anchor: number
  root: import('@babylonjs/core').TransformNode
  visual: import('@babylonjs/core').Mesh
  center: import('@babylonjs/core').Vector3
  radius: number
  angle: number
  velocity: number
  spin: number
}

const props = defineProps<{
  base: JewelryBase
  material: JewelryMaterial
  tool: JewelryTool
  gemColor: string
  mode: GravityMode
}>()

const emit = defineEmits<{ designChange: [JewelryDesign] }>()

const host = ref<HTMLElement | null>(null)
const hint = ref('בחרו חלק וגעו בנקודת עיגון זהובה')

let BABYLON: Babylon | null = null
let HavokPhysics: HavokFactory | null = null
let engine: import('@babylonjs/core').Engine | null = null
let scene: import('@babylonjs/core').Scene | null = null
let resizeObserver: ResizeObserver | null = null
let anchors: Array<{ index: number; mesh: import('@babylonjs/core').Mesh; body: import('@babylonjs/core').PhysicsBody }> = []
let parts: JewelryPart[] = []
let threadedParts: ThreadedPart[] = []
let partCounter = 0
let renderCanvas: HTMLCanvasElement | null = null

watch(() => props.mode, applyGravity)
watch(() => [props.base, props.material], () => resetScene(), { deep: true })
watch(() => props.tool, () => {
  hint.value = `כלי נבחר: ${toolLabel(props.tool)}. געו בנקודת עיגון זהובה.`
})

onMounted(async () => {
  if (!host.value) return
  const [babylonModule, havokModule] = await Promise.all([
    import('@babylonjs/core'),
    import('@babylonjs/havok')
  ])
  BABYLON = babylonModule
  HavokPhysics = havokModule.default
  await initScene()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  engine?.dispose()
  resizeObserver = null
  engine = null
  scene = null
  anchors = []
  parts = []
  threadedParts = []
  renderCanvas = null
})

async function initScene() {
  if (!BABYLON || !HavokPhysics || !host.value) return
  engine?.dispose()
  host.value.innerHTML = ''
  parts = []
  threadedParts = []
  partCounter = 0

  renderCanvas = document.createElement('canvas')
  renderCanvas.dataset.jewelryCanvas = 'true'
  host.value.appendChild(renderCanvas)

  engine = new BABYLON.Engine(renderCanvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true
  })
  engine.setHardwareScalingLevel(Math.max(1, Math.min(window.devicePixelRatio || 1, 1.75)))

  scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0.03, 0.05, 0.09, 1)

  const havokInstance = await HavokPhysics()
  const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance)
  scene.enablePhysics(gravityVector(), havokPlugin)

  setupCamera()
  setupLighting()
  setupStage()
  buildBase()
  setupPicking()
  scene.onBeforeRenderObservable.add(updateThreadedParts)
  applyGravity()
  emitDesign()

  engine.runRenderLoop(() => scene?.render())
  resizeObserver = new ResizeObserver(() => engine?.resize())
  resizeObserver.observe(host.value)
}

async function resetScene() {
  if (!host.value || !BABYLON || !HavokPhysics) return
  await initScene()
}

function setupCamera() {
  if (!BABYLON || !scene || !renderCanvas) return
  const camera = new BABYLON.ArcRotateCamera(
    'jewelryCamera',
    Math.PI / 2,
    Math.PI / 2.45,
    6.8,
    new BABYLON.Vector3(0, 1.15, 0),
    scene
  )
  camera.lowerRadiusLimit = 4.4
  camera.upperRadiusLimit = 8.4
  camera.panningSensibility = 0
  camera.wheelPrecision = 80
  camera.attachControl(renderCanvas, true)
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
  const ground = BABYLON.MeshBuilder.CreateGround('earthFloor', { width: 8.4, height: 5.2 }, scene)
  ground.position.y = -1.22
  ground.material = material('deepNavy')
  new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, {
    mass: 0,
    friction: 0.8,
    restitution: 0.12
  }, scene)

  const halo = BABYLON.MeshBuilder.CreateTorus('orbitHalo', {
    diameter: 3.7,
    thickness: 0.01,
    tessellation: 128
  }, scene)
  halo.position.y = 1.1
  halo.rotation.x = Math.PI / 2
  halo.material = material('halo')
}

function buildBase() {
  if (!BABYLON || !scene) return
  anchors = []
  if (props.base === 'ring') buildRingBase()
  else if (props.base === 'necklace') buildNecklaceBase()
  else buildEarringBase()
}

function buildEarringBase() {
  if (!BABYLON || !scene) return
  const ring = BABYLON.MeshBuilder.CreateTorus('base_earring', {
    diameter: 2.35,
    thickness: 0.12,
    tessellation: 128
  }, scene)
  ring.position.y = 1.55
  ring.rotation.x = Math.PI / 2
  ring.material = material('metal')

  const hook = BABYLON.MeshBuilder.CreateTorus('earring_hook', { diameter: 0.54, thickness: 0.045, tessellation: 64 }, scene)
  hook.position.y = 2.85
  hook.scaling.y = 1.45
  hook.material = material('metal')

  const angles = [0.66, 0.82, 0.98, 1.14, 1.3].map((value) => Math.PI * value)
  angles.forEach((angle, index) => {
    addAnchor(index, new BABYLON.Vector3(Math.cos(angle) * 1.18, 1.55 + Math.sin(angle) * 1.18, 0))
  })
}

function buildRingBase() {
  if (!BABYLON || !scene) return
  const ring = BABYLON.MeshBuilder.CreateTorus('base_ring', {
    diameter: 2.25,
    thickness: 0.16,
    tessellation: 128
  }, scene)
  ring.position.y = 1.38
  ring.rotation.x = Math.PI / 2
  ring.material = material('metal')

  const topStone = BABYLON.MeshBuilder.CreatePolyhedron('centerStone', { type: 1, size: 0.34 }, scene)
  topStone.position.set(0, 2.57, 0.06)
  topStone.material = material('gem')

  const angles = [0.72, 0.88, 1.04, 1.2, 1.36].map((value) => Math.PI * value)
  angles.forEach((angle, index) => {
    addAnchor(index, new BABYLON.Vector3(Math.cos(angle) * 1.15, 1.38 + Math.sin(angle) * 1.15, 0))
  })
}

function buildNecklaceBase() {
  if (!BABYLON || !scene) return
  for (let i = 0; i < 18; i += 1) {
    const t = i / 17
    const angle = Math.PI * (1.03 + t * 0.94)
    const link = BABYLON.MeshBuilder.CreateTorus(`necklace_link_${i}`, { diameter: 0.28, thickness: 0.04, tessellation: 32 }, scene)
    link.position.set(Math.cos(angle) * 1.8, 2.05 + Math.sin(angle) * 1.02, Math.sin(t * Math.PI) * 0.08)
    link.rotation.set(Math.PI / 2, 0, angle + (i % 2 ? Math.PI / 2 : 0))
    link.material = material('metal')
  }

  const anchorsPos = [
    new BABYLON.Vector3(-0.78, 0.94, 0),
    new BABYLON.Vector3(-0.34, 0.73, 0),
    new BABYLON.Vector3(0, 0.66, 0),
    new BABYLON.Vector3(0.34, 0.73, 0),
    new BABYLON.Vector3(0.78, 0.94, 0)
  ]
  anchorsPos.forEach((position, index) => addAnchor(index, position))
}

function addAnchor(index: number, position: import('@babylonjs/core').Vector3) {
  if (!BABYLON || !scene) return
  const anchor = BABYLON.MeshBuilder.CreateSphere(`anchor_${index}`, { diameter: 0.13, segments: 24 }, scene)
  anchor.position.copyFrom(position)
  anchor.material = material('anchor')
  anchor.metadata = { anchorIndex: index, kind: 'anchor' }
  const aggregate = new BABYLON.PhysicsAggregate(anchor, BABYLON.PhysicsShapeType.SPHERE, {
    mass: 0,
    friction: 0.5,
    restitution: 0.05
  }, scene)
  anchors.push({ index, mesh: anchor, body: aggregate.body })
}

function setupPicking() {
  if (!BABYLON || !scene) return
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type !== BABYLON!.PointerEventTypes.POINTERDOWN) return
    const picked = pointerInfo.pickInfo?.pickedMesh
    if (!picked) return
    if (picked.metadata?.kind === 'anchor') {
      addPart(Number(picked.metadata.anchorIndex), props.tool)
      return
    }
    if (picked.metadata?.kind === 'dynamic') {
      const body = picked.physicsBody
      if (!body || !BABYLON) return
      body.applyImpulse(
        new BABYLON.Vector3((Math.random() - 0.5) * 0.55, props.mode === 'earth' ? 0.08 : 0.22, (Math.random() - 0.5) * 0.55),
        picked.getAbsolutePosition()
      )
    }
    if (picked.metadata?.kind === 'threaded') {
      const threaded = threadedParts.find((part) => part.id === picked.metadata.threadedId)
      if (!threaded) return
      threaded.velocity += props.mode === 'earth'
        ? (Math.random() > 0.5 ? 1 : -1) * 1.35
        : (Math.random() > 0.5 ? 1 : -1) * 0.55
      threaded.spin += (Math.random() - 0.5) * 0.08
      hint.value = 'החישוק מחליק על מסילת ההשחלה סביב הבסיס.'
    }
  })
}

function addPart(anchorIndex: number, type: JewelryTool) {
  if (!BABYLON || !scene) return
  const anchor = anchors.find((item) => item.index === anchorIndex)
  if (!anchor) return

  const id = `part_${partCounter++}`
  const created = type === 'chain'
    ? createChain(id, anchor)
    : type === 'hoop'
      ? createHoop(id, anchor)
      : type === 'charm'
        ? createCharm(id, anchor)
        : createGem(id, anchor)

  parts.push({ id, type, anchor: anchorIndex, color: props.gemColor, meshes: created })
  hint.value = type === 'hoop'
    ? 'חישוק הושחל על הבסיס. אפשר להקיש עליו כדי להחליק אותו לאורך המסילה.'
    : `${toolLabel(type)} נוסף. אפשר להקיש על חלק נע כדי לתת לו דחיפה.`
  emitDesign()
}

function createHoop(id: string, anchor: { mesh: import('@babylonjs/core').Mesh; body: import('@babylonjs/core').PhysicsBody }) {
  if (!BABYLON || !scene) return []
  const anchorIndex = Number(anchor.mesh.metadata?.anchorIndex ?? 0)
  const track = trackForAnchor(anchor.mesh.position)
  const root = new BABYLON.TransformNode(`${id}_threaded_root`, scene)
  const visual = BABYLON.MeshBuilder.CreateTorus(`${id}_threaded_hoop`, {
    diameter: 0.42,
    thickness: 0.052,
    tessellation: 56
  }, scene)

  root.position.copyFrom(pointOnTrack(track.center, track.radius, track.angle))
  root.rotation.z = track.angle + Math.PI / 2
  visual.parent = root
  visual.rotation.y = Math.PI / 2
  visual.material = material('metal')
  visual.metadata = { kind: 'threaded', threadedId: id }

  threadedParts.push({
    id,
    anchor: anchorIndex,
    root,
    visual,
    center: track.center,
    radius: track.radius,
    angle: track.angle,
    velocity: props.mode === 'earth' ? 0.55 : 0.22,
    spin: 0.025
  })
  return [root.name, visual.name]
}

function createGem(id: string, anchor: { mesh: import('@babylonjs/core').Mesh; body: import('@babylonjs/core').PhysicsBody }) {
  if (!BABYLON || !scene) return []
  const gem = BABYLON.MeshBuilder.CreatePolyhedron(`${id}_gem`, { type: 1, size: 0.28 }, scene)
  gem.position.copyFrom(anchor.mesh.position).addInPlace(new BABYLON.Vector3(0, -0.34, 0))
  gem.material = material('gem')
  gem.metadata = { kind: 'dynamic' }
  const aggregate = new BABYLON.PhysicsAggregate(gem, BABYLON.PhysicsShapeType.SPHERE, {
    mass: 0.18,
    friction: 0.42,
    restitution: 0.18
  }, scene)
  connect(anchor.body, aggregate.body, new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0.2, 0))
  impulse(aggregate.body, gem, 0.12)
  return [gem.name]
}

function createCharm(id: string, anchor: { mesh: import('@babylonjs/core').Mesh; body: import('@babylonjs/core').PhysicsBody }) {
  if (!BABYLON || !scene) return []
  const charm = BABYLON.MeshBuilder.CreateCylinder(`${id}_charm`, { diameterTop: 0, diameterBottom: 0.36, height: 0.44, tessellation: 4 }, scene)
  charm.position.copyFrom(anchor.mesh.position).addInPlace(new BABYLON.Vector3(0, -0.45, 0))
  charm.rotation.z = Math.PI / 4
  charm.material = material('gem')
  charm.metadata = { kind: 'dynamic' }
  const aggregate = new BABYLON.PhysicsAggregate(charm, BABYLON.PhysicsShapeType.BOX, {
    mass: 0.24,
    friction: 0.5,
    restitution: 0.08
  }, scene)
  connect(anchor.body, aggregate.body, new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0.24, 0))
  impulse(aggregate.body, charm, 0.1)
  return [charm.name]
}

function createChain(id: string, anchor: { mesh: import('@babylonjs/core').Mesh; body: import('@babylonjs/core').PhysicsBody }) {
  if (!BABYLON || !scene) return []
  const names: string[] = []
  let previousBody = anchor.body
  let previousPivot = new BABYLON.Vector3(0, 0, 0)
  const count = 5
  const step = 0.28

  for (let i = 0; i < count; i += 1) {
    const link = BABYLON.MeshBuilder.CreateBox(`${id}_chain_body_${i}`, { width: 0.15, height: 0.3, depth: 0.12 }, scene)
    link.position.copyFrom(anchor.mesh.position).addInPlace(new BABYLON.Vector3(0, -step * (i + 1), 0))
    link.visibility = 0
    link.metadata = { kind: 'dynamic' }
    const visual = BABYLON.MeshBuilder.CreateTorus(`${id}_chain_link_${i}`, { diameter: 0.26, thickness: 0.036, tessellation: 26 }, scene)
    visual.parent = link
    visual.rotation.set(Math.PI / 2, i % 2 ? Math.PI / 2 : 0, 0)
    visual.material = material(i === count - 1 ? 'gem' : 'metal')
    visual.metadata = { kind: 'dynamic' }

    const aggregate = new BABYLON.PhysicsAggregate(link, BABYLON.PhysicsShapeType.BOX, {
      mass: 0.13,
      friction: 0.46,
      restitution: 0.04
    }, scene)
    connect(previousBody, aggregate.body, previousPivot, new BABYLON.Vector3(0, step / 2, 0))
    previousBody = aggregate.body
    previousPivot = new BABYLON.Vector3(0, -step / 2, 0)
    impulse(aggregate.body, link, 0.035 + i * 0.01)
    names.push(link.name, visual.name)
  }
  return names
}

function trackForAnchor(position: import('@babylonjs/core').Vector3) {
  if (!BABYLON) return undefined as never
  const centerY = props.base === 'ring'
    ? 1.38
    : props.base === 'necklace'
      ? 2.02
      : 1.55
  const center = new BABYLON.Vector3(0, centerY, 0)
  const radius = props.base === 'ring'
    ? 1.15
    : props.base === 'necklace'
      ? 1.36
      : 1.18
  return {
    center,
    radius,
    angle: Math.atan2(position.y - center.y, position.x - center.x)
  }
}

function pointOnTrack(center: import('@babylonjs/core').Vector3, radius: number, angle: number) {
  if (!BABYLON) return undefined as never
  return new BABYLON.Vector3(
    center.x + Math.cos(angle) * radius,
    center.y + Math.sin(angle) * radius,
    0.08 * Math.sin(angle * 2)
  )
}

function updateThreadedParts() {
  if (!scene || !threadedParts.length) return
  const dt = Math.min((scene.getEngine().getDeltaTime() || 16) / 1000, 0.033)
  threadedParts.forEach((part) => {
    if (props.mode === 'earth') {
      part.velocity += -Math.cos(part.angle) * 3.2 * dt
      part.velocity *= 0.982
    } else {
      part.velocity += Math.sin(performance.now() * 0.0004 + part.anchor) * 0.035 * dt
      part.velocity *= 0.997
    }

    const limit = props.mode === 'earth' ? 2.8 : 0.78
    part.velocity = Math.max(-limit, Math.min(limit, part.velocity))
    part.angle += part.velocity * dt

    part.root.position.copyFrom(pointOnTrack(part.center, part.radius, part.angle))
    part.root.rotation.z = part.angle + Math.PI / 2
    part.visual.rotation.x += (part.spin + part.velocity * 0.012) * (props.mode === 'earth' ? 1 : 0.45)
  })
}

function connect(
  bodyA: import('@babylonjs/core').PhysicsBody,
  bodyB: import('@babylonjs/core').PhysicsBody,
  pivotA: import('@babylonjs/core').Vector3,
  pivotB: import('@babylonjs/core').Vector3
) {
  if (!BABYLON || !scene) return
  const joint = new BABYLON.BallAndSocketConstraint(
    pivotA,
    pivotB,
    new BABYLON.Vector3(0, 1, 0),
    new BABYLON.Vector3(0, 1, 0),
    scene
  )
  bodyA.addConstraint(bodyB, joint)
}

function impulse(body: import('@babylonjs/core').PhysicsBody, mesh: import('@babylonjs/core').AbstractMesh, strength: number) {
  if (!BABYLON) return
  body.applyImpulse(
    new BABYLON.Vector3((Math.random() - 0.5) * strength, props.mode === 'earth' ? 0 : strength, (Math.random() - 0.5) * strength),
    mesh.getAbsolutePosition()
  )
}

function applyGravity() {
  if (!BABYLON || !scene) return
  scene.getPhysicsEngine()?.setGravity(gravityVector())
  const floor = scene.getMeshByName('earthFloor')
  if (floor) floor.isVisible = props.mode === 'earth'
  emitDesign()
}

function gravityVector() {
  if (!BABYLON) return undefined as never
  return props.mode === 'earth'
    ? new BABYLON.Vector3(0, -9.81, 0)
    : new BABYLON.Vector3(0, -0.08, 0)
}

function material(kind: 'metal' | 'gem' | 'anchor' | 'deepNavy' | 'halo') {
  if (!BABYLON || !scene) return null as never
  const key = `${kind}_${props.material}_${props.gemColor}`
  const existing = scene.getMaterialByName(key)
  if (existing) return existing

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

  if (kind === 'halo') {
    const halo = new BABYLON.StandardMaterial(key, scene)
    halo.diffuseColor = new BABYLON.Color3(0.18, 0.6, 0.86)
    halo.emissiveColor = new BABYLON.Color3(0.08, 0.28, 0.46)
    halo.alpha = 0.38
    return halo
  }

  if (kind === 'deepNavy') {
    const floor = new BABYLON.StandardMaterial(key, scene)
    floor.diffuseColor = new BABYLON.Color3(0.02, 0.08, 0.16)
    floor.specularColor = new BABYLON.Color3(0.08, 0.12, 0.18)
    return floor
  }

  const colors: Record<JewelryMaterial, string> = {
    gold: '#d6aa49',
    silver: '#dfe6ee',
    titanium: '#8995a2'
  }
  const metal = new BABYLON.PBRMaterial(key, scene)
  metal.albedoColor = BABYLON.Color3.FromHexString(colors[props.material])
  metal.metallic = 1
  metal.roughness = props.material === 'titanium' ? 0.24 : 0.16
  return metal
}

function emitDesign() {
  emit('designChange', {
    base: props.base,
    material: props.material,
    mode: props.mode,
    gemColor: props.gemColor,
    parts: parts.map((part) => ({
      id: part.id,
      type: part.type,
      anchor: part.anchor,
      color: part.color
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
