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

  // control
  let ticking = false

  // mostrar abeja solo cuando el tronco tiene longitud
  const hasTrunk = computed(() => trunkEnd.value > trunkStart.value)

  // raíz del panel de intro
  const INTRO_SELECTOR = '.hero-intro-panel'

  // margen para que el tronco NO llegue al final de la última escena
  const TRUNK_BOTTOM_MARGIN = -500

  const getSceneCards = () =>
    Array.from(document.querySelectorAll('.scene-card'))

  const getOpenBranchIndex = () => {
    const cards = getSceneCards()
    if (!cards.length || !branches.value.length) return -1

    const openIdx = cards.findIndex((card) =>
      card.classList.contains('is-open'),
    )

    if (openIdx < 0 || openIdx >= branches.value.length) return -1
    return openIdx
  }

  /**
   * Calcula dónde debe empezar el tronco (justo después del heroIntroPanel)
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

    y = Math.max(0, Math.min(y, svgRect.height))
    trunkStart.value = y
  }

  /**
   * Construye las ramas y fija trunkEnd sin atravesar la última escena.
   * Guarda topDoc/bottomDoc para no recalcular geometría en cada scroll.
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

      // coordenadas en el documento
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

  //rama activa según scroll
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
   *  Si hay una card abierta, la abeja se queda en la rama bifurcada de esa escena.
   */
  const updateBeePosition = () => {
    const svg = svgEl.value
    if (!svg) return

    // si está en animación automática, no se toca
    if (isBeeAutoFlying) return

    const currentScrollY = window.scrollY || window.pageYOffset

    // si está congelada al final, mantenerla fija
    if (freezeBeeAtEnd) {
      // si el usuario ha vuelto arriba: reinicio del vuelo
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

    // Si hay una card abierta, forzamos la Y de la rama correspondiente
    const openBranchIdx = getOpenBranchIndex()
    if (openBranchIdx >= 0 && branches.value[openBranchIdx]) {
      ySvg = branches.value[openBranchIdx].ySvg
    }

    ySvg = Math.max(trunkStart.value, Math.min(ySvg, trunkEnd.value))

    // inclinación según cambio de scroll
    const delta = currentScrollY - lastScrollY
    lastScrollY = currentScrollY

    const maxDelta = 30
    const clamped = Math.max(-maxDelta, Math.min(maxDelta, delta))
    beeAngle.value = (clamped / maxDelta) * 15

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

    // cancelar animación previa
    if (autoFlyAnimationId) {
      cancelAnimationFrame(autoFlyAnimationId)
      autoFlyAnimationId = null
    }

    //control de estado
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
   */
  const resetBeeForNewRun = () => {
    const svg = svgEl.value
    if (!svg) return

    // cancelar animación
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

  const recalcGeometry = () => {
    computeTrunkStart()
    buildBranches()
  }

  const recalcOnScroll = () => {
    updateActiveBranch()
    updateBeePosition()

    // si hemos llegado al final de la última escena, trigger del vuelo
    if (!branches.value.length) return
    if (isBeeAutoFlying || freezeBeeAtEnd) return

    const scrollY = window.scrollY || window.pageYOffset
    const viewportBottomDoc = scrollY + window.innerHeight
    const lastBranch = branches.value[branches.value.length - 1]

    if (viewportBottomDoc >= lastBranch.bottomDoc) {
      flyBeeToFooter()
    }
  }

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
