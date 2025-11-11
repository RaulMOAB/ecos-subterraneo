import { onMounted, onUnmounted } from 'vue'

export function useParallax(props) {
  const layerStyle = (layer) => ({
    zIndex: layer.zIndex || 1,
    opacity: layer.opacity ?? 1,
    mixBlendMode: layer.blendMode || 'normal',
  })

  let ticking = false
  let reduceMotion = false

  onMounted(() => {
    reduceMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const handleScroll = () => {
      if (ticking || reduceMotion) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY || window.pageYOffset || 0
        document.querySelectorAll('.parallax-layer').forEach((el, i) => {
          const layer = props.layers[i]
          const speed = layer?.speed ?? 0.2
          const move = y * speed * (props.strength ?? 1)
          el.style.transform = `translate3d(0, ${
            props.clamp ? Math.max(Math.min(move, 600), -600) : move
          }px, 0)`
        })
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    onUnmounted(() => window.removeEventListener('scroll', handleScroll))
  })

  return { layerStyle }
}
