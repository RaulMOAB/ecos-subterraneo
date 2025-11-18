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
  // ---------------------------
  // AUDIO DEL HERO
  // ---------------------------
  const isAudioPlaying = ref(false)
  const hasInitializedAudio = ref(false)

  function playWithFadeIn(audioEl) {
    if (!audioEl) return

    hasInitializedAudio.value = true
    isAudioPlaying.value = true

    audioEl.volume = 0 // fade desde 0
    audioEl.play()

    let v = 0
    const target = 0.2 // volumen suave del hero
    const step = 0.02

    const interval = setInterval(() => {
      if (!isAudioPlaying.value || !audioEl) {
        clearInterval(interval)
        return
      }

      v += step
      if (v >= target) {
        v = target
        clearInterval(interval)
      }

      audioEl.volume = v
    }, 120)
  }

  function toggleAudio(audioEl) {
    if (!audioEl) return

    // Primera reproducción → fade-in a 0.2
    if (!hasInitializedAudio.value) {
      playWithFadeIn(audioEl)
      return
    }

    if (isAudioPlaying.value) {
      audioEl.pause()
      isAudioPlaying.value = false
      return
    }

    // Reanudar a volumen suave
    isAudioPlaying.value = true
    audioEl.volume = 0.2
    audioEl.play()
  }
  function stopHeroAudio(audioEl) {
    if (!audioEl) return
    audioEl.pause()
    isAudioPlaying.value = false
  }

  // Baja el volumen mientras una escena está abierta (no final)
  function duckHeroAudio(audioEl) {
    if (!audioEl) return
    if (!isAudioPlaying.value) return
    audioEl.volume = 0.1 // volumen reducido
  }

  // Restaura el volumen cuando la escena se cierra
  function restoreHeroAudio(audioEl) {
    if (!audioEl) return
    if (!isAudioPlaying.value) return
    audioEl.volume = 0.2 // volumen normal
  }

  return {
    layers,
    isAudioPlaying,
    toggleAudio,
    stopHeroAudio,
    duckHeroAudio,
    restoreHeroAudio,
  }
}
