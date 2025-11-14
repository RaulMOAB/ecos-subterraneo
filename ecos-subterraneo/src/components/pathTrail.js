import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import beeUrlImport from '@/assets/bee.svg'

export function usePathTrail() {
  const svgEl = ref(null)
  const trunkStart = ref(0)
  const trunkEnd = ref(0)
  const trunkX = ref(0)
  const branches = ref([])
  const visibleBranchIndex = ref(-1)

  // posición de la abeja en coordenadas del SVG
  const beeX = ref(0)
  const beeY = ref(0)
  const beeUrl = beeUrlImport
  const beeAngle = ref(0)
  let lastScrollY = window.scrollY || window.pageYOffset

  const isBeeHovered = ref(false)

  // mostrar abeja solo cuando el tronco tiene longitud
  const hasTrunk = computed(() => trunkEnd.value > trunkStart.value)

  // raíz del panel de intro
  const INTRO_SELECTOR = '.hero-intro-panel'

  // margen para que el tronco NO llegue al final de la última escena
  const TRUNK_BOTTOM_MARGIN = 300

  const getSceneCards = () =>
    Array.from(document.querySelectorAll('.scene-card'))

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
      const img = card.querySelector('.scene-img')
      // por seguridad, si no encontramos la imagen usamos el propio card
      const imgRect = (img || card).getBoundingClientRect()

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
        ySvg,
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

  /**
   * Posición de la abeja:
   * - Se mueve verticalmente a lo largo del tronco
   * - Usamos el centro del viewport mapeado a coordenadas del SVG
   */
  const updateBeePosition = () => {
    const svg = svgEl.value
    if (!svg) return

    const svgRect = svg.getBoundingClientRect()

    const viewportCenter = window.innerHeight / 2
    let ySvg = viewportCenter - svgRect.top

    ySvg = Math.max(trunkStart.value, Math.min(ySvg, trunkEnd.value))

    // cálculo de inclinación según cambio de scroll
    const currentScrollY = window.scrollY || window.pageYOffset
    const delta = currentScrollY - lastScrollY
    lastScrollY = currentScrollY

    // mapeamos el delta a un ángulo entre -15 y 15 grados aprox.
    const maxDelta = 30 // cuanto más pequeño, más sensible
    const clamped = Math.max(-maxDelta, Math.min(maxDelta, delta))
    beeAngle.value = (clamped / maxDelta) * 15

    beeX.value = trunkX.value
    beeY.value = ySvg
  }
  const onBeeEnter = () => {
    isBeeHovered.value = true
  }

  const onBeeLeave = () => {
    isBeeHovered.value = false
  }

  const onBeeClick = () => {
    const cards = getSceneCards()
    const index = visibleBranchIndex.value

    if (!cards.length || index < 0 || index >= cards.length) return

    const card = cards[index]
    card.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const recalcAll = () => {
    computeTrunkStart()
    buildBranches()
    updateActiveBranch()
    updateBeePosition()
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

  return {
    svgEl,
    trunkStart,
    trunkEnd,
    trunkX,
    branches,
    visibleBranchIndex,
    beeX,
    beeY,
    hasTrunk,
    beeUrl,
    beeAngle,
    isBeeHovered,
    onBeeEnter,
    onBeeLeave,
    onBeeClick,
  }
}
