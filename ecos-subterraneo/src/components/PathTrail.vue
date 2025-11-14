<template>
  <!-- Siempre presente para que sea fácil de depurar -->
  <div class="path-layer">
    <svg ref="svgEl" class="scene-path" xmlns="http://www.w3.org/2000/svg">
      <!-- TRONCO: camino continuo desde arriba hasta abajo del viewport -->
      <line
        class="scene-path-trunk"
        x1="50%"
        y1="0"
        x2="50%"
        y2="100%"
        stroke="#f5c05a"
        stroke-width="4"
        stroke-linecap="round"
      />

      <!-- RAMAS: se generan para cada .scene-card -->
      <line
        v-for="(branch, index) in branches"
        :key="index"
        class="scene-path-branch"
        :class="{ 'is-visible': index === visibleBranchIndex }"
        :x1="branch.x1"
        :y1="branch.y"
        :x2="branch.x2"
        :y2="branch.y"
        stroke="#f5c05a"
        stroke-width="4"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const svgEl = ref(null)
const branches = ref([])
const visibleBranchIndex = ref(-1)

// Configuración
const BRANCH_OFFSET = 40 // píxeles hacia izquierda/derecha desde el tronco
const ACTIVATION_RADIUS = 80 // radio en píxeles alrededor del centro del viewport

// Escenas
const getSceneCards = () => Array.from(document.querySelectorAll('.scene-card'))

/**
 * Construye las ramas:
 * - x1/x2 en coordenadas del SVG (px)
 * - y en coordenadas del viewport relativas al SVG (px)
 * - yCenterViewport para decidir cuál activar
 */
const buildBranches = () => {
  const svg = svgEl.value
  if (!svg) return

  const cards = getSceneCards()
  if (!cards.length) {
    branches.value = []
    visibleBranchIndex.value = -1
    return
  }

  const svgRect = svg.getBoundingClientRect()
  const centerX = svgRect.width / 2

  branches.value = cards.map((card, index) => {
    const rect = card.getBoundingClientRect()

    // Centro de la escena en coordenadas de viewport
    const yCenterViewport = rect.top + rect.height / 2

    // Misma coordenada pero relativa al SVG (como está fijo y ocupa el viewport, suele ser igual)
    const yInSvg = yCenterViewport - svgRect.top

    // Rama alternando izquierda/derecha
    const x1 = centerX
    const x2 =
      index % 2 === 0 ? centerX - BRANCH_OFFSET : centerX + BRANCH_OFFSET

    return {
      x1,
      x2,
      y: yInSvg,
      yCenterViewport,
    }
  })
}

/**
 * Activa la rama de la escena cuyo centro está más cerca
 * del centro de la ventana (dentro de ACTIVATION_RADIUS).
 */
const updateActiveBranch = () => {
  if (!branches.value.length) {
    visibleBranchIndex.value = -1
    return
  }

  const viewportCenter = window.innerHeight / 2

  let active = -1
  let best = Infinity

  branches.value.forEach((branch, index) => {
    const dist = Math.abs(branch.yCenterViewport - viewportCenter)
    if (dist < ACTIVATION_RADIUS && dist < best) {
      active = index
      best = dist
    }
  })

  visibleBranchIndex.value = active
}

const handleScroll = () => {
  // Recalculamos posiciones (por si cambian alturas al abrir/cerrar escenas)
  buildBranches()
  updateActiveBranch()
}

const handleResize = () => {
  buildBranches()
  updateActiveBranch()
}

onMounted(() => {
  buildBranches()
  updateActiveBranch()

  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
})
</script>

<style src="@/styles/pathTrail.css"></style>
