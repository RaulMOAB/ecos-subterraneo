<template>
  <div class="path-layer">
    <svg ref="svgEl" class="scene-path" xmlns="http://www.w3.org/2000/svg">
      <!-- TRONCO: desde el final del intro hasta justo antes de la última escena -->
      <line
        class="scene-path-trunk"
        :x1="trunkX"
        :y1="trunkStart"
        :x2="trunkX"
        :y2="trunkEnd"
        stroke="#f5c05a"
        stroke-width="4"
        stroke-linecap="round"
      />

      <!-- RAMAS: una por cada escena -->
      <path
        v-for="(branch, index) in branches"
        :key="index"
        class="scene-path-branch"
        :class="{ 'is-visible': index === visibleBranchIndex }"
        :d="branch.d"
        fill="none"
        stroke="#f5c05a"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const svgEl = ref(null)
const trunkStart = ref(0)
const trunkEnd = ref(0)
const trunkX = ref(0)
const branches = ref([])
const visibleBranchIndex = ref(-1)

// raíz del panel de intro
const INTRO_SELECTOR = '.hero-intro-panel'

// margen para que el tronco NO llegue al final de la última escena
// puedes mantener 300 si te funciona bien
const TRUNK_BOTTOM_MARGIN = 300

const getSceneCards = () => Array.from(document.querySelectorAll('.scene-card'))

/**
 * Calcula dónde debe empezar el tronco: justo después del heroIntroPanel.
 */
const computeTrunkStart = () => {
  const svg = svgEl.value
  if (!svg) return

  const svgRect = svg.getBoundingClientRect()
  const intro = document.querySelector(INTRO_SELECTOR)

  // X del tronco siempre en el centro del SVG
  trunkX.value = svgRect.width / 2

  if (!intro) {
    trunkStart.value = 0
    return
  }

  const introRect = intro.getBoundingClientRect()
  let y = introRect.bottom - svgRect.top

  // clamp al alto del SVG
  y = Math.max(0, Math.min(y, svgRect.height))
  trunkStart.value = y
}

/**
 * Construye las ramas:
 * - el tronco permanece vertical y centrado
 * - el extremo de cada rama se engancha al borde de la imagen (.scene-img)
 * Además fija trunkEnd para que no atraviese la última escena.
 */
const buildBranches = () => {
  const svg = svgEl.value
  if (!svg) return

  const cards = getSceneCards()
  const svgRect = svg.getBoundingClientRect()

  if (!cards.length) {
    branches.value = []
    trunkEnd.value = trunkStart.value
    return
  }

  const centerX = svgRect.width / 2
  trunkX.value = centerX

  let lastBottomSvg = trunkStart.value

  branches.value = cards.map((card) => {
    const rect = card.getBoundingClientRect()

    const topViewport = rect.top
    const bottomViewport = rect.bottom
    const yCenterViewport = rect.top + rect.height / 2

    // coordenadas relativas al SVG
    const ySvg = yCenterViewport - svgRect.top
    const bottomSvg = rect.bottom - svgRect.top

    // actualizamos el "punto más bajo" de las escenas
    if (bottomSvg > lastBottomSvg) lastBottomSvg = bottomSvg

    // --- BORDES REALES DE LA IMAGEN ---
    let img = card.querySelector('.scene-img')
    // por seguridad, si no encontramos la imagen usamos el propio card
    const imgRect = (img || rect).getBoundingClientRect()

    const imgLeftSvg = imgRect.left - svgRect.left
    const imgRightSvg = imgRect.right - svgRect.left

    const trunkXsvg = centerX

    let endX

    // imagen centrada respecto al tronco → rama de longitud cero
    if (imgLeftSvg <= trunkXsvg && trunkXsvg <= imgRightSvg) {
      endX = trunkXsvg
    }
    // imagen a la izquierda → conectar al borde derecho de la imagen
    else if (imgRightSvg < trunkXsvg) {
      endX = imgRightSvg
    }
    // imagen a la derecha → conectar al borde izquierdo de la imagen
    else {
      endX = imgLeftSvg
    }

    const d = `M ${trunkXsvg} ${ySvg} L ${endX} ${ySvg}`

    return {
      d,
      topViewport,
      bottomViewport,
    }
  })

  // El tronco termina un poco antes del final de la última escena
  const svgHeight = svgRect.height
  const endY = lastBottomSvg - TRUNK_BOTTOM_MARGIN

  trunkEnd.value = Math.max(trunkStart.value, Math.min(endY, svgHeight))
}

/**
 * Rama activa: escena cuyo top <= centro del viewport <= bottom.
 */
const updateActiveBranch = () => {
  if (!branches.value.length) {
    visibleBranchIndex.value = -1
    return
  }

  const viewportCenter = window.innerHeight / 2
  let active = -1

  branches.value.forEach((branch, index) => {
    if (
      viewportCenter >= branch.topViewport &&
      viewportCenter <= branch.bottomViewport
    ) {
      active = index
    }
  })

  visibleBranchIndex.value = active
}

const recalcAll = () => {
  computeTrunkStart()
  buildBranches()
  updateActiveBranch()
}

onMounted(() => {
  recalcAll()
  window.addEventListener('scroll', recalcAll, { passive: true })
  window.addEventListener('resize', recalcAll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', recalcAll)
  window.removeEventListener('resize', recalcAll)
})
</script>

<style src="@/styles/pathTrail.css"></style>
