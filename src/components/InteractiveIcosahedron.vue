<template>
  <div class="icosa-shell" ref="shellRef">
    <canvas
      ref="canvasRef"
      class="icosa-canvas"
      :class="{ 'is-dragging': isDragging }"
      role="img"
      tabindex="0"
      aria-label="Interactive abstract icosahedron. Drag or touch to rotate, scroll to zoom, or roll it."
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerUp"
      @dblclick="rollIcosahedron"
      @wheel.prevent="onWheel"
      @keydown.space.prevent="rollIcosahedron"
      @keydown.enter.prevent="rollIcosahedron"
    />

    <div class="icosa-hud" aria-live="polite">
      <button type="button" class="roll-btn" :disabled="isRolling" @click="rollIcosahedron">
        <q-icon name="casino" size="16px" />
        <span>{{ isRolling ? 'Rolling' : 'Roll' }}</span>
      </button>
      <p class="roll-result">{{ currentResult ? `Face ${currentResult}` : 'Drag to rotate' }}</p>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const shellRef = ref(null)
const canvasRef = ref(null)
const isDragging = ref(false)
const isRolling = ref(false)
const currentResult = ref(null)
const highlightedFace = ref(null)

const goldenRatio = (1 + Math.sqrt(5)) / 2
const baseVertices = [
  [-1, goldenRatio, 0],
  [1, goldenRatio, 0],
  [-1, -goldenRatio, 0],
  [1, -goldenRatio, 0],
  [0, -1, goldenRatio],
  [0, 1, goldenRatio],
  [0, -1, -goldenRatio],
  [0, 1, -goldenRatio],
  [goldenRatio, 0, -1],
  [goldenRatio, 0, 1],
  [-goldenRatio, 0, -1],
  [-goldenRatio, 0, 1],
].map((vertex) => {
  const [x, y, z] = vertex
  const magnitude = Math.sqrt(x * x + y * y + z * z)
  return [x / magnitude, y / magnitude, z / magnitude]
})

const faces = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
]

const faceValues = Array.from({ length: faces.length }, (_, index) => index + 1)

const edges = (() => {
  const unique = new Set()
  faces.forEach((face) => {
    const segments = [
      [face[0], face[1]],
      [face[1], face[2]],
      [face[2], face[0]],
    ]

    segments.forEach(([a, b]) => {
      const from = Math.min(a, b)
      const to = Math.max(a, b)
      unique.add(`${from}-${to}`)
    })
  })

  return [...unique].map((edge) => edge.split('-').map((value) => Number(value)))
})()

const state = {
  width: 0,
  height: 0,
  centerX: 0,
  centerY: 0,
  scale: 1,
}

const motion = {
  rotationX: -0.55,
  rotationY: 0.62,
  rotationZ: 0.15,
  velocityX: 0,
  velocityY: 0,
  velocityZ: 0,
  zoom: 1,
}

const dragState = {
  activePointerId: null,
  lastX: 0,
  lastY: 0,
}

let ctx = null
let rafId = 0
let resizeObserver = null
let prefersReducedMotion = false

const cameraDistance = 3.2
const rollState = {
  active: false,
  startTime: 0,
  duration: 0,
}

function rotateVertex([x, y, z], ax, ay, az) {
  const cosX = Math.cos(ax)
  const sinX = Math.sin(ax)
  const cosY = Math.cos(ay)
  const sinY = Math.sin(ay)
  const cosZ = Math.cos(az)
  const sinZ = Math.sin(az)

  const y1 = y * cosX - z * sinX
  const z1 = y * sinX + z * cosX

  const x2 = x * cosY + z1 * sinY
  const z2 = -x * sinY + z1 * cosY

  const x3 = x2 * cosZ - y1 * sinZ
  const y3 = x2 * sinZ + y1 * cosZ

  return { x: x3, y: y3, z: z2 }
}

function projectPoint(point) {
  const perspective = cameraDistance / (cameraDistance - point.z)
  const scalar = state.scale * motion.zoom * perspective

  return {
    x: state.centerX + point.x * scalar,
    y: state.centerY + point.y * scalar,
    z: point.z,
  }
}

function subtractVectors(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  }
}

function crossProduct(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

function dotProduct(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function scaleVector(vector, factor) {
  return {
    x: vector.x * factor,
    y: vector.y * factor,
    z: vector.z * factor,
  }
}

function getFaceRenderData(rotatedVertices, projectedVertices) {
  return faces.map((face, index) => {
    const vertexA = rotatedVertices[face[0]]
    const vertexB = rotatedVertices[face[1]]
    const vertexC = rotatedVertices[face[2]]

    const centroid3d = {
      x: (vertexA.x + vertexB.x + vertexC.x) / 3,
      y: (vertexA.y + vertexB.y + vertexC.y) / 3,
      z: (vertexA.z + vertexB.z + vertexC.z) / 3,
    }
    const centroid2d = projectPoint(centroid3d)

    const edgeAB = subtractVectors(vertexB, vertexA)
    const edgeAC = subtractVectors(vertexC, vertexA)
    let normal = crossProduct(edgeAB, edgeAC)

    // Ensure normal points outward from the polyhedron center.
    if (dotProduct(normal, centroid3d) < 0) {
      normal = scaleVector(normal, -1)
    }

    const toCamera = {
      x: -centroid3d.x,
      y: -centroid3d.y,
      z: cameraDistance - centroid3d.z,
    }

    return {
      index,
      face,
      value: faceValues[index],
      depth: centroid3d.z,
      centroid2d,
      visible: dotProduct(normal, toCamera) > 0,
      projectedA: projectedVertices[face[0]],
      projectedB: projectedVertices[face[1]],
      projectedC: projectedVertices[face[2]],
    }
  })
}

function drawScene() {
  if (!ctx) {
    return
  }

  ctx.clearRect(0, 0, state.width, state.height)

  const rotatedVertices = baseVertices.map((vertex) =>
    rotateVertex(vertex, motion.rotationX, motion.rotationY, motion.rotationZ),
  )
  const projectedVertices = rotatedVertices.map((vertex) => projectPoint(vertex))
  const faceRenderData = getFaceRenderData(rotatedVertices, projectedVertices)

  const aura = ctx.createRadialGradient(
    state.centerX,
    state.centerY,
    state.scale * 0.1,
    state.centerX,
    state.centerY,
    state.scale * 1.2,
  )
  aura.addColorStop(0, 'rgba(59, 130, 246, 0.22)')
  aura.addColorStop(0.45, 'rgba(56, 189, 248, 0.12)')
  aura.addColorStop(1, 'rgba(37, 99, 235, 0)')
  ctx.fillStyle = aura
  ctx.fillRect(0, 0, state.width, state.height)

  faceRenderData
    .slice()
    .sort((a, b) => a.depth - b.depth)
    .forEach((faceData) => {
      const { projectedA, projectedB, projectedC, depth } = faceData
      const depthNormalized = (depth + 1) / 2
      const isHighlighted = highlightedFace.value === faceData.index
      const alpha = isHighlighted ? 0.24 : 0.035 + depthNormalized * 0.11

      ctx.beginPath()
      ctx.moveTo(projectedA.x, projectedA.y)
      ctx.lineTo(projectedB.x, projectedB.y)
      ctx.lineTo(projectedC.x, projectedC.y)
      ctx.closePath()
      ctx.fillStyle = isHighlighted
        ? `rgba(221, 255, 112, ${alpha.toFixed(3)})`
        : `rgba(120, 212, 220, ${alpha.toFixed(3)})`
      ctx.fill()
    })

  const sortedEdges = edges
    .map(([a, b]) => ({
      a,
      b,
      depth: (projectedVertices[a].z + projectedVertices[b].z) / 2,
    }))
    .sort((a, b) => a.depth - b.depth)

  sortedEdges.forEach(({ a, b, depth }) => {
    const depthNormalized = (depth + 1) / 2
    const alpha = 0.22 + depthNormalized * 0.55
    const width = 0.65 + depthNormalized * 1.55

    ctx.beginPath()
    ctx.moveTo(projectedVertices[a].x, projectedVertices[a].y)
    ctx.lineTo(projectedVertices[b].x, projectedVertices[b].y)
    ctx.strokeStyle = `rgba(202, 243, 211, ${alpha.toFixed(3)})`
    ctx.lineWidth = width
    ctx.shadowBlur = 14
    ctx.shadowColor = 'rgba(128, 221, 205, 0.24)'
    ctx.stroke()
  })

  ctx.shadowBlur = 0
}

function resolveFaceValueFromCurrentRotation() {
  const rotatedVertices = baseVertices.map((vertex) =>
    rotateVertex(vertex, motion.rotationX, motion.rotationY, motion.rotationZ),
  )
  const projectedVertices = rotatedVertices.map((vertex) => projectPoint(vertex))
  const faceRenderData = getFaceRenderData(rotatedVertices, projectedVertices)

  const bestFace = faceRenderData
    .filter((faceData) => faceData.visible)
    .sort((a, b) => b.depth - a.depth)[0]

  if (!bestFace) {
    return
  }

  highlightedFace.value = bestFace.index
  currentResult.value = bestFace.value
}

function tick(now = performance.now()) {
  if (!isDragging.value) {
    if (rollState.active) {
      motion.rotationX += 0.044 + motion.velocityX
      motion.rotationY += 0.064 + motion.velocityY
      motion.rotationZ += 0.038 + motion.velocityZ

      motion.velocityX *= 0.986
      motion.velocityY *= 0.986
      motion.velocityZ *= 0.986
      motion.zoom += (1 - motion.zoom) * 0.045

      if (now - rollState.startTime >= rollState.duration) {
        rollState.active = false
        isRolling.value = false
        resolveFaceValueFromCurrentRotation()
      }
    } else {
      if (!prefersReducedMotion) {
        motion.rotationY += 0.0048
        motion.rotationZ += 0.001
      }
      motion.rotationX += motion.velocityX
      motion.rotationY += motion.velocityY
      motion.rotationZ += motion.velocityZ
      motion.velocityX *= 0.92
      motion.velocityY *= 0.92
      motion.velocityZ *= 0.92
    }
  }

  drawScene()
  rafId = window.requestAnimationFrame(tick)
}

function resizeCanvas() {
  if (!shellRef.value || !canvasRef.value || !ctx) {
    return
  }

  const rect = shellRef.value.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  state.width = rect.width
  state.height = rect.height
  state.centerX = rect.width / 2
  state.centerY = rect.height / 2
  state.scale = Math.min(rect.width, rect.height) * 0.4

  canvasRef.value.width = Math.max(1, Math.floor(rect.width * dpr))
  canvasRef.value.height = Math.max(1, Math.floor(rect.height * dpr))
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function onPointerDown(event) {
  if (!canvasRef.value || rollState.active) {
    return
  }

  dragState.activePointerId = event.pointerId
  dragState.lastX = event.clientX
  dragState.lastY = event.clientY
  motion.velocityX = 0
  motion.velocityY = 0
  motion.velocityZ = 0
  isDragging.value = true
  canvasRef.value.setPointerCapture(event.pointerId)
}

function onPointerMove(event) {
  if (!isDragging.value || dragState.activePointerId !== event.pointerId) {
    return
  }

  const deltaX = event.clientX - dragState.lastX
  const deltaY = event.clientY - dragState.lastY

  dragState.lastX = event.clientX
  dragState.lastY = event.clientY

  motion.rotationY += deltaX * 0.01
  motion.rotationX += deltaY * 0.01
  motion.velocityY = deltaX * 0.00085
  motion.velocityX = deltaY * 0.00085
}

function onPointerUp(event) {
  if (!canvasRef.value || dragState.activePointerId !== event.pointerId) {
    return
  }

  if (canvasRef.value.hasPointerCapture(event.pointerId)) {
    canvasRef.value.releasePointerCapture(event.pointerId)
  }

  dragState.activePointerId = null
  isDragging.value = false
}

function onWheel(event) {
  const zoomStep = event.deltaY > 0 ? -0.05 : 0.05
  motion.zoom = Math.min(1.4, Math.max(0.72, motion.zoom + zoomStep))
}

function rollIcosahedron() {
  if (rollState.active) {
    return
  }

  rollState.active = true
  rollState.startTime = performance.now()
  rollState.duration = 1700 + Math.random() * 600

  isRolling.value = true
  currentResult.value = null
  highlightedFace.value = null

  motion.velocityX = (Math.random() * 2 - 1) * 0.22
  motion.velocityY = (Math.random() * 2 - 1) * 0.28
  motion.velocityZ = (Math.random() * 2 - 1) * 0.2
  motion.zoom = 0.9 + Math.random() * 0.35
}

onMounted(() => {
  if (!canvasRef.value || !shellRef.value) {
    return
  }

  ctx = canvasRef.value.getContext('2d')
  if (!ctx) {
    return
  }

  prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
  resizeCanvas()
  tick()

  resizeObserver = new ResizeObserver(() => {
    resizeCanvas()
  })
  resizeObserver.observe(shellRef.value)
})

onBeforeUnmount(() => {
  if (rafId) {
    window.cancelAnimationFrame(rafId)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<style scoped lang="scss" src="../css/components/interactive-icosahedron.scss"></style>
