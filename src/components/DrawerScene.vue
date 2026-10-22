<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js'
import { createFolderShape } from '@/three/folderShape'
import { projects } from '@/data/projects'

const INK = '#1a1a1a'
// Recline angle for the folders. 0 = fully upright (folders stand at 90°).
const LEAN = 0
const FALLBACK_GREY = '#d9d9d9'
// World width of the drawer; the scene is scaled so this spans half the view.
const DRAWER_WORLD_WIDTH = 3.0
// drei's <Html transform> draws 1 CSS px as 1/40 of a world unit, CSS3DObject
// draws it as 1 unit — so the original `scale={0.072}` becomes 0.072 / 40.
const LABEL_SCALE = 0.072 / 40

const router = useRouter()
const container = ref(null)

let destroyScene = () => {}

// The container <div> only exists once the component is mounted.
onMounted(() => {
  destroyScene = createScene(container.value)
})

// Leaving the route unmounts the component: stop the loop and free GPU memory.
onUnmounted(() => destroyScene())

/** Builds the whole scene inside `el` and returns a cleanup function. */
function createScene(el) {
  let disposed = false

  // ---- Renderers: WebGL for the folders, CSS3D on top for the HTML labels ----
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  // Match react-three-fiber's default so colours look the same as the original.
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  el.appendChild(renderer.domElement)

  const labelRenderer = new CSS3DRenderer()
  labelRenderer.domElement.style.pointerEvents = 'none'
  el.appendChild(labelRenderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#ffffff')

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000)
  camera.position.set(0, 5.0, 6.0)
  camera.lookAt(0, -0.2, -0.35)

  // ---- Scene graph: rig (mouse tilt) → fit (sizing + angle) → folders ----
  const rig = new THREE.Group()
  const fit = new THREE.Group()
  fit.position.set(0, 0.4, -0.4)
  fit.rotation.y = -Math.PI / 6
  rig.add(fit)
  scene.add(rig)

  // Only two shapes exist (tab left / tab right), so every folder shares one.
  const shapes = [createFolderShape(false), createFolderShape(true)]
  const lineMaterial = new THREE.LineBasicMaterial({ color: INK })
  const colliderMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  const textureLoader = new THREE.TextureLoader()

  const folders = projects.map((project, i) => {
    const { fill, outline, tabCx, tabCy } = shapes[i % 2]

    // Front folder (i=0) sits low and nearest the camera; each one further
    // back rises and recedes so its tab stays visible.
    const group = new THREE.Group()
    group.position.set(0, -0.3 + i * 0.03, 0.95 - i * 0.26)
    group.rotation.x = LEAN
    group.scale.setScalar(1.65)
    fit.add(group)

    // Static invisible collider — the only raycast target. It never moves, so
    // the hover target can't slide out from under the cursor (no flicker).
    const collider = new THREE.Mesh(fill, colliderMaterial)
    collider.position.z = -0.001
    group.add(collider)

    // Visual group: this is what lifts on hover.
    const lift = new THREE.Group()
    group.add(lift)

    // Face: light grey until the image loads; stays grey if it's missing or fails.
    const faceMaterial = new THREE.MeshBasicMaterial({ color: FALLBACK_GREY })
    lift.add(new THREE.Mesh(fill, faceMaterial))
    if (project.image) {
      // Prefix with the deploy base (e.g. /NEO/) so /public paths work on GitHub Pages.
      const imageUrl = import.meta.env.BASE_URL + project.image.replace(/^\//, '')
      textureLoader.load(imageUrl, (texture) => {
        if (disposed) return texture.dispose()
        texture.colorSpace = THREE.SRGBColorSpace
        faceMaterial.map = texture
        faceMaterial.color.set('#ffffff')
        faceMaterial.toneMapped = false
        faceMaterial.needsUpdate = true
      })
    }

    // Black hairline outline, just in front of the face.
    const line = new THREE.LineLoop(outline, lineMaterial)
    line.position.z = 0.002
    lift.add(line)

    // Tab label, centred inside the tab.
    const labelEl = createLabel(project)
    const label = new CSS3DObject(labelEl)
    labelEl.style.pointerEvents = 'none' // CSS3DObject sets 'auto'; let clicks reach the canvas
    label.position.set(tabCx, tabCy, 0.01)
    label.scale.setScalar(LABEL_SCALE)
    lift.add(label)

    return { project, collider, lift, labelEl, faceMaterial }
  })
  const colliders = folders.map((f) => f.collider)

  // ---- Sizing: fill the container, keep the drawer at half the view width ----
  function resize() {
    const width = el.clientWidth
    const height = el.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height)
    labelRenderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    // Same as R3F's `viewport.width`: visible world width at the camera's
    // distance from the origin.
    const distance = camera.position.length()
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance
    fit.scale.setScalar((viewHeight * camera.aspect * 0.5) / DRAWER_WORLD_WIDTH)
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(el)
  resize()

  // ---- Pointer: hover, click, and the -1..1 position used by the mouse rig ----
  const pointer = new THREE.Vector2()
  const raycaster = new THREE.Raycaster()
  let hovered = null

  function setHovered(folder) {
    if (folder === hovered) return
    if (hovered) hovered.labelEl.style.fontWeight = '400'
    if (folder) folder.labelEl.style.fontWeight = '500'
    el.style.cursor = folder ? 'pointer' : 'auto'
    hovered = folder
  }

  function updatePointer(e) {
    const rect = el.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  // Nearest folder under the pointer, or null.
  function pick() {
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(colliders, false)[0]
    return hit ? folders.find((f) => f.collider === hit.object) : null
  }

  function onPointerMove(e) {
    updatePointer(e)
    setHovered(pick())
  }

  function onPointerLeave() {
    setHovered(null)
  }

  function onClick(e) {
    updatePointer(e)
    const folder = pick()
    if (folder) router.push(`/project/${folder.project.slug}`)
  }

  el.addEventListener('pointermove', onPointerMove)
  el.addEventListener('pointerleave', onPointerLeave)
  el.addEventListener('click', onClick)

  // ---- Render loop (what R3F's useFrame hooks into) ----
  const lerp = THREE.MathUtils.lerp
  let frameId = 0
  function tick() {
    frameId = requestAnimationFrame(tick)

    // Whole scene gently follows the pointer.
    rig.rotation.y = lerp(rig.rotation.y, pointer.x * 0.1, 0.04)
    rig.rotation.x = lerp(rig.rotation.x, -pointer.y * 0.04, 0.04)

    // Hovered folder eases up, the others ease back down.
    for (const f of folders) {
      f.lift.position.y = lerp(f.lift.position.y, f === hovered ? 0.12 : 0, 0.15)
    }

    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
  }
  tick()

  return () => {
    disposed = true
    cancelAnimationFrame(frameId)
    resizeObserver.disconnect()
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerleave', onPointerLeave)
    el.removeEventListener('click', onClick)
    for (const { fill, outline } of shapes) {
      fill.dispose()
      outline.dispose()
    }
    for (const { faceMaterial } of folders) {
      faceMaterial.map?.dispose()
      faceMaterial.dispose()
    }
    lineMaterial.dispose()
    colliderMaterial.dispose()
    renderer.dispose()
    renderer.domElement.remove()
    labelRenderer.domElement.remove()
  }
}

/** The "[ 01 ]  BRAND" label shown inside each folder tab. */
function createLabel(project) {
  const el = document.createElement('div')
  Object.assign(el.style, {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    // KH Teka ships 300/400/500 (see style.css), so hover goes 400 → 500.
    fontFamily: "'KH Teka', sans-serif",
    fontWeight: '400',
    fontSize: '15px',
    lineHeight: '1',
    letterSpacing: '-0.02em',
    textTransform: 'uppercase',
    color: '#ffffff',
    textShadow: '0 0 6px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.6)',
    userSelect: 'none',
  })
  const index = document.createElement('span')
  index.textContent = `[ ${project.index} ]`
  const brand = document.createElement('span')
  brand.textContent = project.brand
  el.append(index, brand)
  return el
}
</script>

<template>
  <div ref="container" class="drawer-scene"></div>
</template>

<style scoped>
.drawer-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* The canvas and label layer are created in JS, so :deep() is needed to reach them. */
.drawer-scene :deep(canvas),
.drawer-scene :deep(> div) {
  position: absolute;
  inset: 0;
  display: block;
}
</style>
