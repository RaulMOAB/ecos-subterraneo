// Lógica para las capas de parallax del héroe

import bg from '@/assets/parallax-images/landscape.jpg' // Fondo (JPG)
import mid from '@/assets/parallax-images/parallax2.png' // Medio (PNG)
import fg from '@/assets/parallax-images/parallax_mid.png' // Primer plano (PNG)
import fx from '@/assets/parallax-images/parallax4.png' // Partículas (PNG)

export function useHeroParallax() {
  const layers = [
    { src: bg, speed: 0.08, alt: 'Fondo', zIndex: 1 },
    { src: mid, speed: 0.22, alt: 'Capa media', zIndex: 2, opacity: 0.98 },
    { src: fg, speed: 0.42, alt: 'Primer plano', zIndex: 3 },
    { src: fx, speed: 0.65, alt: 'Partículas', zIndex: 4, opacity: 0 },
  ]
  return { layers }
}
