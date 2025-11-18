<template>
  <ParallaxLayers
    :layers="layers"
    :strength="1.5"
    :clamp="true"
    :lerp="0.28"
    :slotZ="10"
    class="hero-parallax"
  >
    <!-- AUDIO DE FONDO: la URL viene del import del script -->
    <audio ref="introAudio" :src="introAudioUrl" loop></audio>

    <article class="hero" aria-labelledby="hero-title">
      <!-- BOTÓN AUDIO ARRIBA A LA DERECHA -->
      <button
        type="button"
        class="hero-audio-toggle"
        @click="handleToggleAudio"
        :aria-pressed="isAudioPlaying"
        :aria-label="
          isAudioPlaying
            ? 'Desactivar audio de fondo'
            : 'Activar audio de fondo'
        "
      >
        <img
          :src="isAudioPlaying ? soundOffUrl : soundOnUrl"
          alt=""
          class="hero-audio-icon"
        />
      </button>

      <div class="hero-backdrop" aria-hidden="true"></div>

      <div class="hero-content">
        <p class="hero-kicker">Colección inmersiva</p>
        <h1 id="hero-title" class="hero-title">Ecos de lo Subterráneo</h1>
        <p class="hero-sub">
          Desciende por el paisaje abisal y descubre las piezas inspiradas en la
          colmena invertida.
        </p>
        <button class="hero-cta" type="button" @click="handleStart">
          Comenzar descenso
        </button>
      </div>
    </article>
  </ParallaxLayers>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ParallaxLayers from './ParallaxLayers.vue'
import '../styles/HeroParallax.css'
import { useHeroParallax } from './heroParallaxLogic.js'
import { smoothScrollToElem } from '@/utils/smoothScroll.js'

// IMPORTS DE RECURSOS
import introAudioUrl from '@/assets/audio/intro.mp3'
import soundOnUrl from '@/assets/resources/sound-on.png'
import soundOffUrl from '@/assets/resources/sound-off.png'

const {
  layers,
  isAudioPlaying,
  toggleAudio,
  stopHeroAudio,
  duckHeroAudio,
  restoreHeroAudio,
} = useHeroParallax()

const introAudio = ref(null)

const goToGallery = () => {
  const el = document.getElementById('galeria')
  if (!el) return
  smoothScrollToElem(el, {
    duration: 1100,
    offset: 0,
    easing: 'easeInOutCubic',
  })
}

// "Comenzar descenso" solo hace scroll; el hero sigue sonando
const handleStart = () => {
  goToGallery()
}

// botón de sonido (activa/desactiva, con fade in en la primera vez)
const handleToggleAudio = () => {
  if (!introAudio.value) return
  toggleAudio(introAudio.value)
}

// manejadores de eventos globales lanzados por las cards
let onSceneOpened
let onSceneClosed
let onFinalSceneOpened

onMounted(() => {
  onSceneOpened = () => {
    if (introAudio.value) {
      duckHeroAudio(introAudio.value)
    }
  }

  onSceneClosed = () => {
    if (introAudio.value) {
      restoreHeroAudio(introAudio.value)
    }
  }

  onFinalSceneOpened = () => {
    if (introAudio.value) {
      stopHeroAudio(introAudio.value)
    }
  }

  window.addEventListener('scene-opened', onSceneOpened)
  window.addEventListener('scene-closed', onSceneClosed)
  window.addEventListener('final-scene-open', onFinalSceneOpened)
})

onBeforeUnmount(() => {
  if (onSceneOpened) {
    window.removeEventListener('scene-opened', onSceneOpened)
  }
  if (onSceneClosed) {
    window.removeEventListener('scene-closed', onSceneClosed)
  }
  if (onFinalSceneOpened) {
    window.removeEventListener('final-scene-open', onFinalSceneOpened)
  }
})
</script>
