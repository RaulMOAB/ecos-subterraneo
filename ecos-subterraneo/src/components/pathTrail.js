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
  const isBeeHovered = ref(false)

  let lastScrollY = window.scrollY || window.pageYOffset
  let resizeObserver = null
  let autoFlyAnimationId = null
  let isBeeAutoFlying = false
  let freezeBeeAtEnd = false

  // mostrar abeja solo cuando el tronco tiene longitud
  const hasTrunk = computed(() => trunkEnd.value > trunkStart.value)

  // raíz del panel de intro
  const INTRO_SELECTOR = '.hero-intro-panel'

  // margen para que el tronco NO llegue al final de la última escena
  const TRUNK_BOTTOM_MARGIN = -500 // si quieres más “aire”, súbelo (p.ej. 200–300)

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
   *
   * IMPORTANTE:
   * Guardamos también coordenadas en sistema de documento (topDoc/bottomDoc)
   * para no tener que recalcular geometría en cada scroll.
   */
  const buildBranches = () => {
    const svg = svgEl.value
    if (!svg) return

    const cards = getSceneCards()
    const svgRect = svg.getBoundingClientRect()
    const scrollY = window.scrollY || window.pageYOffset

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
      const yCenterViewport = rect.top + rect.height / 2 // ← centro real de la card

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

      // coordenadas en sistema de documento (no de viewport)
      const topDoc = rect.top + scrollY
      const bottomDoc = rect.bottom + scrollY

      return {
        d,
        ySvg,
        // dejamos estos campos por compatibilidad, aunque
        // la lógica nueva usa topDoc/bottomDoc:
        topViewport,
        bottomViewport,
        // nuevos campos coherentes con scroll:
        topDoc,
        bottomDoc,
      }
    })

    // --- Cálculo normal del tronco según las escenas ---
    //const svgHeight = svgRect.height
    let endY = lastBottomSvg - TRUNK_BOTTOM_MARGIN

    // --- NUEVO: recorte suave para integrar el footer ---
    const footer = document.querySelector('.gallery-footer')
    if (footer) {
      const footerRect = footer.getBoundingClientRect()
      const svgRect = svgEl.value.getBoundingClientRect()

      // posición del footer en coordenadas del SVG
      const footerTopSvg = footerRect.top - svgRect.top

      // margen visual de separación entre tronco y núcleo del footer
      const FOOTER_CLEARANCE = 40

      // si el footer realmente está por debajo del último card
      if (footerTopSvg > trunkStart.value + 200) {
        const footerLimit = footerTopSvg - FOOTER_CLEARANCE
        endY = Math.min(endY, footerLimit)
      }
    }

    // --- clamp final de seguridad ---
    trunkEnd.value = Math.max(trunkStart.value + endY)
  }

  /**
   * Rama activa: escena cuyo topDoc <= centro del viewport (en coords de documento) <= bottomDoc.
   */
  const updateActiveBranch = () => {
    if (!branches.value.length) {
      visibleBranchIndex.value = -1
      return
    }

    const scrollY = window.scrollY || window.pageYOffset
    const viewportCenterDoc = scrollY + window.innerHeight / 2

    let active = -1

    branches.value.forEach((branch, index) => {
      if (
        viewportCenterDoc >= branch.topDoc &&
        viewportCenterDoc <= branch.bottomDoc
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

    // Si está en animación automática, no forzamos nada desde el scroll
    if (isBeeAutoFlying) return

    // Si ya ha llegado al final y queremos que se quede allí, la fijamos y salimos
    if (freezeBeeAtEnd) {
      beeX.value = trunkX.value
      beeY.value = trunkEnd.value
      beeAngle.value = 0
      return
    }

    const svgRect = svg.getBoundingClientRect()

    // Centro del viewport mapeado al SVG
    const viewportCenter = window.innerHeight / 2
    let ySvg = viewportCenter - svgRect.top

    // Limitamos al rango del tronco
    ySvg = Math.max(trunkStart.value, Math.min(ySvg, trunkEnd.value))

    // Cálculo de inclinación según cambio de scroll
    const currentScrollY = window.scrollY || window.pageYOffset
    const delta = currentScrollY - lastScrollY
    lastScrollY = currentScrollY

    const maxDelta = 30 // cuanto más pequeño, más sensible
    const clamped = Math.max(-maxDelta, Math.min(maxDelta, delta))
    beeAngle.value = (clamped / maxDelta) * 15

    // Intensidad del glow en función de la velocidad de scroll
    const speed = Math.min(1, Math.abs(delta) / 40) // normaliza 0–1
    const intensity = 0.4 + speed * 0.5 // 0.4 en reposo → 0.9 scroll rápido
    svg.style.setProperty('--path-glow-intensity', intensity.toString())

    // Posición final de la abeja
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
  const flyBeeToFooter = () => {
    const svg = svgEl.value
    if (!svg) return

    // si el tronco no tiene longitud, no hacemos nada
    if (trunkEnd.value <= trunkStart.value) return

    // cancelar animación previa si la hubiera
    if (autoFlyAnimationId) {
      cancelAnimationFrame(autoFlyAnimationId)
      autoFlyAnimationId = null
    }

    const startY = beeY.value
    const endY = trunkEnd.value
    const duration = 2500 // ms
    const startTime = performance.now()

    isBeeAutoFlying = true

    const animate = (now) => {
      const t = Math.min(1, (now - startTime) / duration)
      // suavizado tipo smoothstep
      const eased = t * t * (3 - 2 * t)

      const newY = startY + (endY - startY) * eased
      beeY.value = newY
      beeX.value = trunkX.value
      beeAngle.value = 0 // horizontal mientras aterriza

      if (t < 1) {
        autoFlyAnimationId = requestAnimationFrame(animate)
      } else {
        isBeeAutoFlying = false
        autoFlyAnimationId = null

        // bloquear la posición final PERMANENTEMENTE
        beeY.value = trunkEnd.value
        beeX.value = trunkX.value
        beeAngle.value = 0
        // sincronizar lastScrollY para evitar salto de ángulo en el siguiente scroll
        lastScrollY = window.scrollY || window.pageYOffset

        freezeBeeAtEnd = true
        beeY.value = trunkEnd.value
        beeX.value = trunkX.value
        beeAngle.value = 0
      }
    }

    autoFlyAnimationId = requestAnimationFrame(animate)
  }

  /**
   * Recalcula solo la geometría (tronco + ramas).
   * Útil cuando cambia el layout de las escenas (por ejemplo, al abrir/cerrar).
   */
  const recalcGeometry = () => {
    computeTrunkStart()
    buildBranches()
  }

  /**
   * Recalcula solo lo que depende del scroll:
   * - rama activa
   * - posición/ángulo de la abeja
   */
  const recalcOnScroll = () => {
    updateActiveBranch()
    updateBeePosition()
  }

  const onResize = () => {
    recalcGeometry()
    recalcOnScroll()
  }

  // NUEVO: observar cambios de tamaño en las scene-card
  const setupResizeObserver = () => {
    if (resizeObserver) return

    resizeObserver = new ResizeObserver(() => {
      // cuando cambia la altura de cualquier .scene-card
      recalcGeometry()
      recalcOnScroll()
    })

    getSceneCards().forEach((card) => resizeObserver.observe(card))
  }

  const cleanupResizeObserver = () => {
    if (!resizeObserver) return
    resizeObserver.disconnect()
    resizeObserver = null
  }

  const onFooterVisible = () => {
    flyBeeToFooter()
  }

  onMounted(() => {
    recalcGeometry()
    recalcOnScroll()

    // activamos el observador de tamaño
    setupResizeObserver()

    window.addEventListener('scroll', recalcOnScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('final-footer-visible', onFooterVisible)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', recalcOnScroll)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('final-footer-visible', onFooterVisible)
    cleanupResizeObserver()

    if (autoFlyAnimationId) {
      cancelAnimationFrame(autoFlyAnimationId)
      autoFlyAnimationId = null
    }
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
    recalcGeometry,
    recalcOnScroll,
  }
}
