// useHeroParallax.js
import bg from '@/assets/parallax-images/fondo.jpg'
import mid from '@/assets/parallax-images/rocks.png'
import fg from '@/assets/parallax-images/entrance.png'

export function useHeroParallax() {
  const layers = [
    {
      src: bg,
      alt: 'Villa en el bosque',
      depth: 0.2, // fondo, se mueve poco
      zIndex: 1,
      offsetY: 0,
    },
    {
      src: mid,
      alt: 'Rocas y raíces',
      depth: 1.1, // capa media
      zIndex: 12,
      offsetY: 0,
      opacity: 0.98,
    },
    {
      src: fg,
      alt: 'Colmena subterránea',
      depth: 1.8, // primer plano, se mueve más
      zIndex: 14,
      offsetY: 0,
      opacity: 1,
    },
  ]

  return { layers }
}
