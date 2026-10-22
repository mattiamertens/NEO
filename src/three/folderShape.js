import * as THREE from 'three'

/**
 * Manila-folder outline: a rectangular body with a raised, slant-sided tab on
 * the top edge. `tabRight` mirrors the tab to the opposite side so a stack of
 * folders reads with alternating tabs.
 *
 * Returns the filled face geometry, the outline geometry, and the tab centre
 * (used to anchor the label). The caller owns the geometries and must dispose them.
 */
export function createFolderShape(tabRight) {
  const w = 0.8 // half width
  const h = 0.34 // half height — folders read shorter/wider, per the design
  const tabH = 0.085 // short tab
  // Tab footprint on the top edge (expressed for a left-side tab).
  const tabL = -0.58
  const tabR = -0.04
  const slant = 0.04

  const s = tabRight ? -1 : 1
  const P = (x, y) => new THREE.Vector2(x * s, y)

  // Corner vertices, walking the outline counter-clockwise.
  const verts = [
    P(-w, -h),
    P(w, -h),
    P(w, h),
    P(tabR, h),
    P(tabR - slant, h + tabH),
    P(tabL + slant, h + tabH),
    P(tabL, h),
    P(-w, h),
  ]

  // Build a closed shape with rounded corners (~2–3px radius). At each
  // corner we cut back along both edges by `r` and arc through the vertex.
  const r = 0.018
  const shape = new THREE.Shape()
  const n = verts.length
  for (let idx = 0; idx < n; idx++) {
    const cur = verts[idx]
    const prev = verts[(idx - 1 + n) % n]
    const next = verts[(idx + 1) % n]
    const toPrev = prev.clone().sub(cur)
    const toNext = next.clone().sub(cur)
    const rp = Math.min(r, toPrev.length() * 0.45)
    const rn = Math.min(r, toNext.length() * 0.45)
    const start = cur.clone().add(toPrev.setLength(rp))
    const end = cur.clone().add(toNext.setLength(rn))
    if (idx === 0) shape.moveTo(start.x, start.y)
    else shape.lineTo(start.x, start.y)
    shape.quadraticCurveTo(cur.x, cur.y, end.x, end.y)
  }
  shape.closePath()

  const pts = shape.getPoints(10)
  const outline = new THREE.BufferGeometry().setFromPoints(
    pts.map((v) => new THREE.Vector3(v.x, v.y, 0)),
  )
  const fill = new THREE.ShapeGeometry(shape)

  // ShapeGeometry sets UVs to raw vertex coordinates; remap them to 0..1
  // across the folder's bounding box so a texture covers the whole face.
  fill.computeBoundingBox()
  const bb = fill.boundingBox
  const sx = bb.max.x - bb.min.x
  const sy = bb.max.y - bb.min.y
  const pos = fill.attributes.position
  const uv = []
  for (let vi = 0; vi < pos.count; vi++) {
    uv.push((pos.getX(vi) - bb.min.x) / sx, (pos.getY(vi) - bb.min.y) / sy)
  }
  fill.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))

  // Tab centre, used to anchor the label inside the tab.
  const tabCx = ((tabL + tabR) / 2) * s
  const tabCy = h + tabH / 2

  return { fill, outline, tabCx, tabCy }
}
