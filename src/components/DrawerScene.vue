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
// World width of the drawer; the scene is scaled so this spans VIEW_FILL of the view width.
const DRAWER_WORLD_WIDTH = 3.0
// >1 lets the stack bleed off the screen edges.
const VIEW_FILL = 0.55
// Size floor as a fraction of the view height. Wide screens use VIEW_FILL; narrow
// (portrait/mobile) screens hit this floor so folders stay big and overflow sideways.
const MIN_VIEW_FILL_HEIGHT = 0.7
const FOLDER_SCALE = 1.65
// Spacing between neighbouring folders: each one further back recedes and rises.
const STEP_Z = 0.4
const STEP_Y = 0.03
// Scroll speed, in folder slots per pixel of wheel / finger movement.
const WHEEL_SPEED = 0.004
const DRAG_SPEED = 0.008
// Opening a folder: the folders in front of and behind it slide apart by this
// many slots to give it room, then the route changes after OPEN_DURATION ms.
const OPEN_GAP = 1.2
const OPEN_DURATION = 650
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

  // Narrow lens from far away: near-isometric look, folders barely shrink with depth.
  const camera = new THREE.PerspectiveCamera(12, 1, 1, 1000)
  camera.position.set(0, 10.0, 25.0)
  camera.lookAt(0, -0.2, -0.35)

  // ---- Scene graph: rig (static wrapper) → fit (sizing + angle) → folders ----
  const rig = new THREE.Group()
  const fit = new THREE.Group()
  fit.position.set(0, 0.4, -0.4)
  fit.rotation.y = -0.95
  rig.add(fit)
  scene.add(rig)

  // Only two shapes exist (tab left / tab right), so every folder shares one.
  const shapes = [createFolderShape(false), createFolderShape(true)]
  const lineMaterial = new THREE.LineBasicMaterial({ color: INK })
  const colliderMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  const textureLoader = new THREE.TextureLoader()

  // One texture per image, shared by every copy of a project (the ring below may repeat them).
  const textures = new Map() // url → Promise<Texture>
  function loadTexture(url) {
    if (!textures.has(url)) {
      const promise = textureLoader.loadAsync(url).then((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        return texture
      })
      textures.set(url, promise)
    }
    return textures.get(url)
  }

  /** Builds the folder at ring position `k`, showing project `k % projects.length`. */
  function createFolder(k) {
    const project = projects[k % projects.length]
    const { fill, outline, tabCx, tabCy } = shapes[k % 2]

    // Positioned every frame by placeFolders(), following the scroll.
    const group = new THREE.Group()
    group.rotation.x = LEAN
    group.scale.setScalar(FOLDER_SCALE)
    fit.add(group)

    // Static invisible collider — the only raycast target. It never moves, so the hover target can't slide out from under the cursor (no flicker).
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
      loadTexture(imageUrl).then(
        (texture) => {
          if (disposed) return
          faceMaterial.map = texture
          faceMaterial.color.set('#ffffff')
          faceMaterial.toneMapped = false
          faceMaterial.needsUpdate = true
        },
        () => {}, // missing or broken image: stays grey
      )
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

    return { project, k, group, collider, lift, labelEl, faceMaterial }
  }

  function removeFolder(folder) {
    fit.remove(folder.group)
    // CSS3DObject only cleans up its element when it is removed directly, not
    // when an ancestor is — so take the label out of the DOM by hand.
    folder.labelEl.remove()
    folder.faceMaterial.dispose()
    if (folder === hovered) setHovered(null)
  }

  // ---- Infinite scroll ----
  // Folders sit in slots along the stack (0 = front, higher = further back) and
  // `scroll` shifts every slot at once. The slots form a ring of `ringSize`
  // folders starting at slot `ringStart`: a folder pushed out past the front
  // rejoins at the back, and vice versa. updateRing() puts both ends of the ring
  // just off-screen, so folders simply slide out of sight and back in. When the
  // visible stretch needs more folders than there are projects, the list repeats.
  const folders = []
  let ringSize = projects.length
  let ringStart = 0
  let restSlot = 0 // slot of the first project when scroll = 0
  let scroll = 0 // eased position, in slots
  let scrollTarget = 0 // where the input wants it
  let scrollable = false // only when the stack overflows the view (see resize)
  let hovered = null
  let opening = null // folder that was clicked, while its neighbours make room
  let spread = 0 // 0..1, eased: how far the neighbours have moved apart
  let openTimer = 0

  // Position (in `fit` space) of the folder in slot `s`.
  function slotPosition(s, target) {
    return target.set(0, -0.3 + s * STEP_Y, 0.95 - s * STEP_Z)
  }

  function slotOf(f) {
    return THREE.MathUtils.euclideanModulo(f.k - scroll + restSlot - ringStart, ringSize) + ringStart
  }

  function placeFolders() {
    const openSlot = opening ? slotOf(opening) : 0
    for (const f of folders) {
      let s = slotOf(f)
      // Folders in front of the opened one move forward, those behind move back.
      if (opening) s += Math.sign(s - openSlot) * spread * OPEN_GAP
      slotPosition(s, f.group.position)
    }
  }

  function updateRing() {
    ringStart = 0
    ringSize = projects.length
    restSlot = 0
    if (scrollable) {
      // Range of slots where a folder would show at least partly on screen.
      let first = Infinity
      let last = -Infinity
      for (let s = -40; s <= 40 + projects.length; s++) {
        if (!slotOnScreen(s)) continue
        first = Math.min(first, s)
        last = Math.max(last, s)
      }
      // Wrap at the first fully hidden slot on each side: `first - 1` and `last + 1`.
      ringStart = first - 1
      const needed = last + 1 - ringStart
      ringSize = projects.length * Math.ceil(needed / projects.length)
      // Start with the first project at the front of what's visible.
      restSlot = Math.max(0, first)
    }
    while (folders.length < ringSize) folders.push(createFolder(folders.length))
    while (folders.length > ringSize) removeFolder(folders.pop())
  }

  // Settle on the nearest folder once input stops.
  let snapTimer = 0
  function snapSoon(delay) {
    clearTimeout(snapTimer)
    snapTimer = setTimeout(() => (scrollTarget = Math.round(scrollTarget)), delay)
  }

  // ---- Sizing: drawer spans VIEW_FILL of the view width, but never less than
  // MIN_VIEW_FILL_HEIGHT of the view height (keeps it large on mobile) ----
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
    const span = Math.max(viewHeight * camera.aspect * VIEW_FILL, viewHeight * MIN_VIEW_FILL_HEIGHT)
    fit.scale.setScalar(span / DRAWER_WORLD_WIDTH)

    // Scroll only if the stack doesn't fit; otherwise go back to the original order.
    fit.updateMatrixWorld(true)
    camera.updateMatrixWorld()
    scrollable = stackOverflows()
    if (!scrollable) scroll = scrollTarget = 0
    updateRing()
  }

  // Screen-space (-1..1) bounds of a folder in slot `s`, from its projected corners.
  // Both tab variants are mirror images, so they share the same bounds.
  shapes[0].fill.computeBoundingBox()
  const folderBox = shapes[0].fill.boundingBox
  const corner = new THREE.Vector3()
  const slotPos = new THREE.Vector3()
  const screenBox = new THREE.Box2()
  function slotScreenBox(s) {
    slotPosition(s, slotPos)
    screenBox.makeEmpty()
    for (const x of [folderBox.min.x, folderBox.max.x]) {
      for (const y of [folderBox.min.y, folderBox.max.y]) {
        corner.set(x, y, 0).multiplyScalar(FOLDER_SCALE).add(slotPos)
        corner.applyMatrix4(fit.matrixWorld).project(camera)
        screenBox.expandByPoint(corner)
      }
    }
    return screenBox
  }

  function slotOnScreen(s) {
    const box = slotScreenBox(s)
    return box.max.x > -1 && box.min.x < 1 && box.max.y > -1 && box.min.y < 1
  }

  // Does the stack at rest run past the left/right edges of the view? Slots are
  // linear, so the front and back folders bound it. Sideways only: the front
  // folder grazing the top/bottom edge doesn't count.
  function stackOverflows() {
    for (const s of [0, projects.length - 1]) {
      const box = slotScreenBox(s)
      if (box.min.x < -1 || box.max.x > 1) return true
    }
    return false
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(el)
  resize()

  // ---- Pointer: hover, click, wheel / touch-drag scrolling ----
  const pointer = new THREE.Vector2()
  const raycaster = new THREE.Raycaster()
  let mouseInside = false
  let dragX = 0 // last touch position while dragging
  let dragY = 0
  let dragging = false
  let dragDistance = 0 // total finger travel, to tell a tap from a swipe
  let dragVelocity = 0 // last frame's scroll delta, for a little fling on release

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
    const colliders = folders.map((f) => f.collider)
    const hit = raycaster.intersectObjects(colliders, false)[0]
    return hit ? folders.find((f) => f.collider === hit.object) : null
  }

  // Wheel down brings the back folders forward; wheel up sends them back.
  function onWheel(e) {
    if (!scrollable || opening) return
    e.preventDefault()
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY // Firefox reports lines
    scrollTarget += delta * WHEEL_SPEED
    snapSoon(150)
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' || !scrollable || opening) return
    dragging = true
    dragX = e.clientX
    dragY = e.clientY
    dragDistance = 0
    dragVelocity = 0
    clearTimeout(snapTimer)
  }

  function onPointerMove(e) {
    if (dragging) {
      // Same as the wheel: swiping up (scrolling down) or left brings the back
      // folders forward; swiping down or right sends them back.
      const dx = e.clientX - dragX
      const dy = e.clientY - dragY
      dragX = e.clientX
      dragY = e.clientY
      dragDistance += Math.hypot(dx, dy)
      dragVelocity = (-dy - dx) * DRAG_SPEED
      scrollTarget += dragVelocity
      return
    }
    if (e.pointerType !== 'mouse' || opening) return
    mouseInside = true
    updatePointer(e)
    setHovered(pick())
  }

  function onPointerUp() {
    if (!dragging) return
    dragging = false
    scrollTarget = Math.round(scrollTarget + dragVelocity * 6)
  }

  function onPointerLeave() {
    mouseInside = false
    if (!opening) setHovered(null)
  }

  function onClick(e) {
    if (opening) return
    // A swipe ends with a click on some browsers — only a tap should open a folder.
    if (dragDistance > 10) return (dragDistance = 0)
    updatePointer(e)
    const folder = pick()
    if (folder) open(folder)
  }

  // Lock the stack, let the neighbours slide apart (see tick), then navigate.
  function open(folder) {
    opening = folder
    setHovered(folder) // keeps it lifted and bold, also on touch
    clearTimeout(snapTimer)
    scrollTarget = scroll
    openTimer = setTimeout(() => router.push(`/project/${folder.project.slug}`), OPEN_DURATION)
  }

  el.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointermove', onPointerMove)
  el.addEventListener('pointerup', onPointerUp)
  el.addEventListener('pointercancel', onPointerUp)
  el.addEventListener('pointerleave', onPointerLeave)
  el.addEventListener('click', onClick)

  // ---- Render loop (what R3F's useFrame hooks into) ----
  const lerp = THREE.MathUtils.lerp
  let frameId = 0
  function tick() {
    frameId = requestAnimationFrame(tick)

    // Ease towards the scroll target, then lay the folders out.
    const moving = Math.abs(scrollTarget - scroll) > 0.0005
    scroll = moving ? lerp(scroll, scrollTarget, dragging ? 0.35 : 0.12) : scrollTarget
    // Fast ease (~200ms to settle) so the opened folder holds still for the rest of OPEN_DURATION.
    if (opening) spread = lerp(spread, 1, 0.22)
    placeFolders()
    // The stack slides under a still mouse while scrolling, so re-check the hover.
    if (moving && mouseInside && !opening) setHovered(pick())

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
    clearTimeout(snapTimer)
    clearTimeout(openTimer)
    resizeObserver.disconnect()
    el.removeEventListener('wheel', onWheel)
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('pointercancel', onPointerUp)
    el.removeEventListener('pointerleave', onPointerLeave)
    el.removeEventListener('click', onClick)
    for (const { fill, outline } of shapes) {
      fill.dispose()
      outline.dispose()
    }
    for (const { faceMaterial } of folders) faceMaterial.dispose()
    for (const promise of textures.values()) promise.then((t) => t.dispose(), () => {})
    lineMaterial.dispose()
    colliderMaterial.dispose()
    renderer.dispose()
    renderer.domElement.remove()
    labelRenderer.domElement.remove()
  }
}

// The "[ 01 ]  BRAND" label shown inside each folder tab.
function createLabel(project) {
  const labelText = document.createElement('div')
  Object.assign(labelText.style, {
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
  labelText.append(index, brand)
  return labelText
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
  /* Touch drags scroll the stack, not the page (also blocks pull-to-refresh). */
  touch-action: none;
}

/* The canvas and label layer are created in JS, so :deep() is needed to reach them. */
.drawer-scene :deep(canvas),
.drawer-scene :deep(> div) {
  position: absolute;
  inset: 0;
  display: block;
}
</style>
