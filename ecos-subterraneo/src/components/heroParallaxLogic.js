// Lógica para las capas de parallax del héroe

import bg from '@/assets/parallax-images/landscape.jpg' // Fondo (JPG)
import mid from '@/assets/parallax-images/parallax2.png' // Medio (PNG)
import fg from '@/assets/parallax-images/parallax_mid.png' // Primer plano (PNG)
import fx from '@/assets/parallax-images/parallax4.png' // Partículas (PNG)

export function useHeroParallax() {
  const layers = [
    {
      src: bg,
      speed: 0.06,
      alt: 'Horizonte nocturno',
      zIndex: 1,
    },
    {
      src: mid,
      speed: 0.18,
      alt: 'Cordillera iluminada',
      zIndex: 2,
      opacity: 0.96,
    },
    {
      src: fg,
      speed: 0.32,
      alt: 'Raíces subterráneas',
      zIndex: 3,
      opacity: 0.98,
    },
    {
      src: fx,
      speed: 0.55,
      alt: 'Partículas flotantes',
      zIndex: 4,
      opacity: 0.65,
      blendMode: 'screen',
    },
  ]
  return { layers }
}
