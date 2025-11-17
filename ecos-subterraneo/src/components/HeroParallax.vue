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
          :src="isAudioPlaying ? soundOnUrl : soundOffUrl"
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
import { ref } from 'vue'
import ParallaxLayers from './ParallaxLayers.vue'
import '../styles/HeroParallax.css'
import { useHeroParallax } from './heroParallaxLogic.js'
import { smoothScrollToElem } from '@/utils/smoothScroll.js'

// IMPORTS DE RECURSOS
import introAudioUrl from '@/assets/audio/intro.mp3'
import soundOnUrl from '@/assets/resources/sound-on.png'
import soundOffUrl from '@/assets/resources/sound-off.png'

// hook de parallax + estado de audio
const { layers, isAudioPlaying, playWithFadeIn, toggleAudio, stopHeroAudio } =
  useHeroParallax()

// ref al elemento <audio> del template
const introAudio = ref(null)

// scroll a la galería (tal como lo tenías)
const goToGallery = () => {
  const el = document.getElementById('galeria')
  if (!el) return
  smoothScrollToElem(el, {
    duration: 1100,
    offset: 0,
    easing: 'easeInOutCubic',
  })
}

// botón principal: si el audio está parado, lo inicia con fade in y baja a la galería
const handleStart = () => {
  if (introAudio.value) {
    stopHeroAudio(introAudio.value)
  }
  goToGallery()
}

// botón de icono sonido: alterna on/off
const handleToggleAudio = () => {
  if (!introAudio.value) return
  toggleAudio(introAudio.value)
}
</script>
