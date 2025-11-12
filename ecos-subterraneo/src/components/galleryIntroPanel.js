export function useGalleryIntroPanel(persistKey) {
  const ensureInitState = (defaultOpen) => {
    try {
      const v = localStorage.getItem(persistKey)
      if (v === 'closed') return false
    } catch {}
    return defaultOpen
  }

  const saveCollapsed = () => {
    try {
      localStorage.setItem(persistKey, 'closed')
    } catch {}
  }

  const shouldOpenFromQuery = () => {
    const usp = new URLSearchParams(location.search)
    return usp.get('intro') === '1'
  }

  return { ensureInitState, saveCollapsed, shouldOpenFromQuery }
}
