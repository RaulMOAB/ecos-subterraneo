export function smoothScrollTo(
  targetY,
  { duration = 1000, easing = 'easeInOutCubic' } = {},
) {
  const startY = window.scrollY || window.pageYOffset || 0
  const diff = targetY - startY
  let start

  const easings = {
    linear: (t) => t,
    easeInOutCubic: (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
  }
  const fn = easings[easing] || easings.easeInOutCubic

  // Respeta reduce motion
  const reduce =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    window.scrollTo(0, targetY)
    return
  }

  function step(ts) {
    if (!start) start = ts
    const p = Math.min((ts - start) / duration, 1)
    window.scrollTo(0, startY + diff * fn(p))
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export function smoothScrollToElem(
  elem,
  { duration = 1000, offset = 0, easing = 'easeInOutCubic' } = {},
) {
  if (!elem) return
  const rect = elem.getBoundingClientRect()
  const targetY = (window.scrollY || 0) + rect.top + offset
  smoothScrollTo(targetY, { duration, easing })
}
