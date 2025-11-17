// useHeroParallax.js
import { ref } from 'vue'
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
  // ---- AUDIO ----
  const isAudioPlaying = ref(false)
  const hasInitializedAudio = ref(false)

  // Fade in cuando se activa por primera vez
  function playWithFadeIn(audioEl) {
    if (!audioEl) return

    hasInitializedAudio.value = true
    isAudioPlaying.value = true

    audioEl.volume = 0
    audioEl.play()

    let v = 0
    const step = 0.05
    const interval = setInterval(() => {
      if (!isAudioPlaying.value || !audioEl) {
        clearInterval(interval)
        return
      }

      v += step
      if (v >= 1) {
        v = 1
        clearInterval(interval)
      }
      audioEl.volume = v
    }, 120)
  }

  // Icono de sonido: toggle on/off
  function toggleAudio(audioEl) {
    if (!audioEl) return

    // primera vez → fade in
    if (!hasInitializedAudio.value) {
      playWithFadeIn(audioEl)
      return
    }

    if (isAudioPlaying.value) {
      audioEl.pause()
      isAudioPlaying.value = false
    } else {
      audioEl.play()
      isAudioPlaying.value = true
    }
  }

  // Para el botón "Comenzar descenso"
  function stopHeroAudio(audioEl) {
    if (!audioEl) return
    audioEl.pause()
    isAudioPlaying.value = false
  }

  return {
    layers,
    isAudioPlaying,
    toggleAudio,
    stopHeroAudio,
  }
}
