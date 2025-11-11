// parallax.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useParallax(props) {
  const sceneRef = ref(null)

  const layerStyle = (layer) => ({
    zIndex: layer.zIndex ?? 1,
    opacity: layer.opacity ?? 1,
    mixBlendMode: layer.blendMode || 'normal',
  })

  let layers = []
  let io = null
  let reduceMotion = false

  // geometría cacheada del hero
  let sectionTop = 0
  let sectionHeight = 1
  let viewportHeight = 1

  // progresos para suavizar
  let targetProgress = 0 // a dónde queremos ir (0..1)
  let currentProgress = 0 // donde estamos ahora (0..1)

  let running = false // bucle rAF activo
  const lerpFactor = props.lerp ?? 0.15 // suavizado (0.1–0.2 va bien)

  const recalcGeometry = () => {
    const root = sceneRef.value
    if (!root) return

    const rect = root.getBoundingClientRect()
    const scrollY = window.scrollY || window.pageYOffset || 0

    sectionTop = rect.top + scrollY
    sectionHeight = rect.height || 1
    viewportHeight = window.innerHeight || 1
  }

  const computeTargetProgress = () => {
    const scrollY = window.scrollY || window.pageYOffset || 0

    // cuánto hemos avanzado el hero en el viewport
    const rel = scrollY + viewportHeight - sectionTop
    const range = viewportHeight + sectionHeight

    const raw = rel / range // ~0..1
    targetProgress = Math.max(0, Math.min(1, raw))
  }

  const applyTransforms = (progress) => {
    const strength = props.strength ?? 2.0
    const clamp = !!props.clamp

    for (let i = 0; i < layers.length; i++) {
      const el = layers[i]
      const layer = props.layers[i]
      if (!el || !layer) continue

      const depth = layer.depth ?? 0.5
      const base = layer.offsetY ?? 0

      //const direction = layer.direction ?? 1 // 1 normal, -1 invertida
      // desplazamiento más suave (ajusta el 40 si quieres más/menos efecto)
      let move = base + (progress - 0.5) * 2 * depth * strength * 120

      if (clamp) {
        move = Math.max(Math.min(move, 1600), -1600)
      }

      el.style.transform = `translate3d(0, ${move}px, 0)`
    }
  }

  const tick = () => {
    if (!running || reduceMotion) return

    // interpolación suave hacia el objetivo
    const diff = targetProgress - currentProgress
    currentProgress += diff * lerpFactor

    applyTransforms(currentProgress)

    // si estamos muy cerca del objetivo, no hace falta seguir refinando tanto
    if (Math.abs(diff) < 0.001) {
      // pero mantenemos el bucle vivo mientras el hero esté activo
      requestAnimationFrame(tick)
    } else {
      requestAnimationFrame(tick)
    }
  }

  const handleScroll = () => {
    if (reduceMotion) return
    computeTargetProgress()
    // el bucle rAF ya está corriendo y se encarga de suavizar
  }

  const handleResize = () => {
    recalcGeometry()
    computeTargetProgress()
  }

  const initParallax = (scene) => {
    sceneRef.value = scene.value
    const root = sceneRef.value
    if (!root) return

    reduceMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    layers = Array.from(root.querySelectorAll('.parallax-layer'))

    recalcGeometry()
    computeTargetProgress()
    currentProgress = targetProgress // empezamos sin salto
    applyTransforms(currentProgress)

    // IntersectionObserver para arrancar/detener el bucle solo cuando el hero está visible
    io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        const isActive = !!entry?.isIntersecting

        if (isActive && !running) {
          running = true
          recalcGeometry()
          computeTargetProgress()
          requestAnimationFrame(tick)
        } else if (!isActive && running) {
          running = false
        }
      },
      { threshold: 0 },
    )

    io.observe(root)

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
  }

  const destroyParallax = () => {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleResize)
    io?.disconnect()
    io = null
    running = false
    layers = []
  }

  onMounted(() => {
    // nada, initParallax lo llamas desde el componente
  })

  onUnmounted(() => {
    destroyParallax()
  })

  return { layerStyle, initParallax, destroyParallax, sceneRef }
}
