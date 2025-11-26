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

  // control para throttling del scroll con requestAnimationFrame
  let ticking = false

  // mostrar abeja solo cuando el tronco tiene longitud
  const hasTrunk = computed(() => trunkEnd.value > trunkStart.value)

  // raíz del panel de intro
  const INTRO_SELECTOR = '.hero-intro-panel'

  // margen para que el tronco NO llegue al final de la última escena
  const TRUNK_BOTTOM_MARGIN = -500 // ajusta si quieres más/menos “aire”

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
   * Construye las ramas y fija trunkEnd sin atravesar la última escena.
   * Guarda también topDoc/bottomDoc para no recalcular geometría en cada scroll.
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
      const yCenterViewport = rect.top + rect.height / 2

      // coordenadas relativas al SVG
      const ySvg = yCenterViewport - svgRect.top
      const bottomSvg = rect.bottom - svgRect.top

      if (bottomSvg > lastBottomSvg) lastBottomSvg = bottomSvg

      // bordes reales de la imagen (o del card como fallback)
      const img = card.querySelector('.scene-img')
      const imgRect = (img || card).getBoundingClientRect()

      const imgLeftSvg = imgRect.left - svgRect.left
      const imgRightSvg = imgRect.right - svgRect.left

      const trunkXsvg = centerX
      let endX

      if (imgLeftSvg <= trunkXsvg && trunkXsvg <= imgRightSvg) {
        // imagen centrada → rama de longitud cero
        endX = trunkXsvg
      } else if (imgRightSvg < trunkXsvg) {
        // imagen a la izquierda
        endX = imgRightSvg
      } else {
        // imagen a la derecha
        endX = imgLeftSvg
      }

      const d = `M ${trunkXsvg} ${ySvg} L ${endX} ${ySvg}`

      // coordenadas en sistema de documento
      const topDoc = rect.top + scrollY
      const bottomDoc = rect.bottom + scrollY

      return {
        d,
        ySvg,
        topViewport,
        bottomViewport,
        topDoc,
        bottomDoc,
      }
    })

    // cálculo base de la longitud del tronco
    let endY = lastBottomSvg - TRUNK_BOTTOM_MARGIN

    // recorte suave para integrar el footer
    const footer = document.querySelector('.gallery-footer')
    if (footer) {
      const footerRect = footer.getBoundingClientRect()
      const svgRect2 = svgEl.value.getBoundingClientRect()

      const footerTopSvg = footerRect.top - svgRect2.top
      const FOOTER_CLEARANCE = 40

      if (footerTopSvg > trunkStart.value + 200) {
        const footerLimit = footerTopSvg - FOOTER_CLEARANCE
        endY = Math.min(endY, footerLimit)
      }
    }

    trunkEnd.value = Math.max(trunkStart.value + endY)
  }

  /**
   * Rama activa: escena cuyo topDoc <= centro del viewport (documento) <= bottomDoc.
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
   * Posición de la abeja (scroll-driven).
   * Con lógica de bucle al volver al inicio.
   */
  const updateBeePosition = () => {
    const svg = svgEl.value
    if (!svg) return

    // si está en animación automática, no la tocamos
    if (isBeeAutoFlying) return

    const currentScrollY = window.scrollY || window.pageYOffset

    // si está congelada al final, mantenerla fija...
    if (freezeBeeAtEnd) {
      // ... salvo que el usuario haya vuelto arriba: reinicio implícito
      if (currentScrollY < 200) {
        freezeBeeAtEnd = false
        beeX.value = trunkX.value
        beeY.value = trunkStart.value
        beeAngle.value = 0
        svg.style.setProperty('--path-glow-intensity', '0.4')
        lastScrollY = currentScrollY
      } else {
        beeX.value = trunkX.value
        beeY.value = trunkEnd.value
        beeAngle.value = 0
        return
      }
    }

    const svgRect = svg.getBoundingClientRect()

    // centro del viewport mapeado al SVG
    const viewportCenter = window.innerHeight / 2
    let ySvg = viewportCenter - svgRect.top

    // limitar al rango del tronco
    ySvg = Math.max(trunkStart.value, Math.min(ySvg, trunkEnd.value))

    // inclinación según cambio de scroll
    const delta = currentScrollY - lastScrollY
    lastScrollY = currentScrollY

    const maxDelta = 30
    const clamped = Math.max(-maxDelta, Math.min(maxDelta, delta))
    beeAngle.value = (clamped / maxDelta) * 15

    // intensidad del glow en función de la velocidad
    const speed = Math.min(1, Math.abs(delta) / 40)
    const intensity = 0.4 + speed * 0.5
    svg.style.setProperty('--path-glow-intensity', intensity.toString())

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

  /**
   * Vuelo automático de la abeja hasta el final del tronco (círculo del footer).
   */
  const flyBeeToFooter = () => {
    const svg = svgEl.value
    if (!svg) return
    if (trunkEnd.value <= trunkStart.value) return

    // cancelar animación previa si la hubiera
    if (autoFlyAnimationId) {
      cancelAnimationFrame(autoFlyAnimationId)
      autoFlyAnimationId = null
    }

    // por robustez: aseguramos que puede volar aunque antes estuviera congelada
    isBeeAutoFlying = false
    freezeBeeAtEnd = false

    const startY = beeY.value
    const endY = trunkEnd.value
    const duration = 2500 // ms
    const startTime = performance.now()

    isBeeAutoFlying = true

    const animate = (now) => {
      const t = Math.min(1, (now - startTime) / duration)
      const eased = t * t * (3 - 2 * t)

      const newY = startY + (endY - startY) * eased
      beeY.value = newY
      beeX.value = trunkX.value
      beeAngle.value = 0

      if (t < 1) {
        autoFlyAnimationId = requestAnimationFrame(animate)
      } else {
        isBeeAutoFlying = false
        autoFlyAnimationId = null

        // bloquear posición final en el círculo del footer
        beeY.value = trunkEnd.value
        beeX.value = trunkX.value
        beeAngle.value = 0

        lastScrollY = window.scrollY || window.pageYOffset
        freezeBeeAtEnd = true
      }
    }

    autoFlyAnimationId = requestAnimationFrame(animate)
  }

  /**
   * Reinicia la abeja para un nuevo recorrido desde el inicio del tronco.
   * (si disparas el evento 'bee-restart' desde el footer, por ejemplo)
   */
  const resetBeeForNewRun = () => {
    const svg = svgEl.value
    if (!svg) return

    // cancelar animación pendiente
    if (autoFlyAnimationId) {
      cancelAnimationFrame(autoFlyAnimationId)
      autoFlyAnimationId = null
    }

    isBeeAutoFlying = false
    freezeBeeAtEnd = false

    // recolocar abeja al inicio del tronco
    beeX.value = trunkX.value
    beeY.value = trunkStart.value
    beeAngle.value = 0

    svg.style.setProperty('--path-glow-intensity', '0.4')

    lastScrollY = window.scrollY || window.pageYOffset

    updateActiveBranch()
  }

  /**
   * Recalcula solo la geometría (tronco + ramas).
   */
  const recalcGeometry = () => {
    computeTrunkStart()
    buildBranches()
  }

  /**
   * Recalcula lo que depende del scroll:
   * - rama activa
   * - posición/ángulo de la abeja
   * - dispara el vuelo automático al llegar al final (bucle)
   */
  const recalcOnScroll = () => {
    updateActiveBranch()
    updateBeePosition()

    // NUEVO: si hemos llegado al final de la última escena, disparar vuelo
    if (!branches.value.length) return
    if (isBeeAutoFlying || freezeBeeAtEnd) return

    const scrollY = window.scrollY || window.pageYOffset
    const viewportBottomDoc = scrollY + window.innerHeight
    const lastBranch = branches.value[branches.value.length - 1]

    if (viewportBottomDoc >= lastBranch.bottomDoc) {
      flyBeeToFooter()
    }
  }

  /**
   * Listener de scroll envuelto en requestAnimationFrame.
   */
  const onScrollRaf = () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(() => {
        recalcOnScroll()
        ticking = false
      })
    }
  }

  const onResize = () => {
    recalcGeometry()
    recalcOnScroll()
  }

  const setupResizeObserver = () => {
    if (resizeObserver) return

    resizeObserver = new ResizeObserver(() => {
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
    // sigue existiendo por compatibilidad, pero ya no dependes solo de él
    flyBeeToFooter()
  }

  const onBeeRestart = () => {
    resetBeeForNewRun()
  }

  onMounted(() => {
    recalcGeometry()
    recalcOnScroll()

    setupResizeObserver()

    window.addEventListener('scroll', onScrollRaf, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('final-footer-visible', onFooterVisible)
    window.addEventListener('bee-restart', onBeeRestart)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScrollRaf)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('final-footer-visible', onFooterVisible)
    window.removeEventListener('bee-restart', onBeeRestart)
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
    resetBeeForNewRun,
  }
}
