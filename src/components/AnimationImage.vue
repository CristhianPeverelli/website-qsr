<template>
  <div class="container" @mousedown="onStart" @touchstart="onStart">
    <div class="cube" ref="cubeRef">
      <div class="side front" />
      <div class="side back" />
      <div class="side right" />
      <div class="side left" />
      <div class="side top" />
      <div class="side bottom" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAnimationFrame } from 'motion-v'

const cubeRef = ref(null)

const autoX = ref(0)
const autoY = ref(0)

const isDragging = ref(false)
const lastPos = ref({ x: 0, y: 0 })
const dragRotation = ref({ x: 0, y: 0 })

function getEventPosition(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  return { x: e.clientX, y: e.clientY }
}

function onStart(e) {
  isDragging.value = true
  lastPos.value = getEventPosition(e)
}

function onMove(e) {
  if (!isDragging.value) return
  const pos = getEventPosition(e)
  const dx = pos.x - lastPos.value.x
  const dy = pos.y - lastPos.value.y

  dragRotation.value.x += dy * 0.3
  dragRotation.value.y += dx * 0.3

  lastPos.value = pos

  if (e.cancelable) e.preventDefault()
}

function onEnd() {
  isDragging.value = false
}

onMounted(() => {
  window.addEventListener('mousemove', onMove, { passive: false })
  window.addEventListener('mouseup', onEnd)
  window.addEventListener('touchmove', onMove, { passive: false })
  window.addEventListener('touchend', onEnd)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onEnd)
  window.removeEventListener('touchmove', onMove)
  window.removeEventListener('touchend', onEnd)
})

useAnimationFrame((t) => {
  if (!cubeRef.value) return

  if (!isDragging.value) {
    autoX.value = Math.sin(t / 900) * 30
    autoY.value = Math.cos(t / 1000) * 30
  }

  const rotX = isDragging.value ? dragRotation.value.x : autoX.value
  const rotY = isDragging.value ? dragRotation.value.y : autoY.value
  const rotZ = isDragging.value ? 0 : Math.sin(t / 2000) * 10

  cubeRef.value.style.transform = `
    rotateX(${rotX}deg)
    rotateY(${rotY}deg)
    rotateZ(${rotZ}deg)
  `
})
</script>

<style scoped>
.container {
  height: 500px;
  width: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cube {
  width: 250px;
  height: 250px;
  position: relative;
  transform-style: preserve-3d;
  transform: rotateX(0deg) rotateY(0deg);
  transition: transform 0.1s linear;
  cursor: grab;
  user-select: none;
}

.side {
  position: absolute;
  width: 250px;
  height: 250px;
  background-color: rgba(13, 93, 107, 0.6);
  border: 1px solid #000000;
}

/* Facce */
.front {
  transform: translateZ(125px);
}
.back {
  transform: rotateY(180deg) translateZ(125px);
}
.right {
  transform: rotateY(90deg) translateZ(125px);
}
.left {
  transform: rotateY(-90deg) translateZ(125px);
}
.top {
  transform: rotateX(90deg) translateZ(125px);
}
.bottom {
  transform: rotateX(-90deg) translateZ(125px);
}

@media (max-width: 600px) {
  .container {
    width: 100vw;
    height: 300px;
  }

  .cube {
    width: 150px;
    height: 150px;
  }

  .side {
    width: 150px;
    height: 150px;
  }

  .front,
  .back,
  .right,
  .left,
  .top,
  .bottom {
    transform: none; /* verrà ridefinito in JS in base a dimensioni */
  }

  .front {
    transform: translateZ(75px);
  }
  .back {
    transform: rotateY(180deg) translateZ(75px);
  }
  .right {
    transform: rotateY(90deg) translateZ(75px);
  }
  .left {
    transform: rotateY(-90deg) translateZ(75px);
  }
  .top {
    transform: rotateX(90deg) translateZ(75px);
  }
  .bottom {
    transform: rotateX(-90deg) translateZ(75px);
  }
}
</style>
