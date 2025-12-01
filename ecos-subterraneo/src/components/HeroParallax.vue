<template>
  <section>
    <!-- AUDIO DE FONDO (COMÚN A AMBAS VERSIONES) -->
    <audio ref="introAudio" :src="introAudioUrl" loop></audio>

    <!-- 📱 MÓVIL: HERO SIN PARALLAX -->
    <article v-if="isMobile" class="hero" aria-labelledby="hero-title-mobile">
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
        <h1 id="hero-title-mobile" class="hero-title">
          Ecos de lo Subterráneo
        </h1>
        <p class="hero-sub">
          Desciende por el paisaje abisal y descubre las piezas inspiradas en la
          colmena invertida.
        </p>
        <button
          class="hero-cta hero-cta--desktop"
          type="button"
          @click="handleStart"
        >
          Comenzar descenso
        </button>
      </div>
    </article>

    <!-- 💻 TABLET / ESCRITORIO: HERO CON PARALLAX -->
    <ParallaxLayers
      v-else
      :layers="layers"
      :strength="1.5"
      :clamp="true"
      :lerp="0.28"
      :slotZ="10"
      class="hero-parallax"
    >
      <article class="hero" aria-labelledby="hero-title-desktop">
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
          <h1 id="hero-title-desktop" class="hero-title">
            Ecos de lo Subterráneo
          </h1>
          <p class="hero-sub">
            Desciende por el paisaje abisal y descubre las piezas inspiradas en
            la colmena invertida.
          </p>
          <button class="hero-cta" type="button" @click="handleStart">
            Comenzar descenso
          </button>
        </div>
      </article>
    </ParallaxLayers>
  </section>
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
const isMobile = ref(false)

const updateIsMobile = () => {
  if (typeof window === 'undefined') return
  isMobile.value = window.matchMedia('(max-width: 640px)').matches
}

const goToGalleryTop = () => {
  const el = document.getElementById('galeria')
  if (!el) return
  smoothScrollToElem(el, {
    duration: 900,
    offset: 0,
    easing: 'easeInOutCubic',
  })
}

/** helper local para esperar a que se estabilice la primera escena */
const waitForStableTop = (el, { framesStable = 4, maxFrames = 40 } = {}) =>
  new Promise((resolve) => {
    let last = null
    let stable = 0
    let frames = 0

    function step() {
      frames++
      const now = el.getBoundingClientRect().top + window.pageYOffset

      if (last != null && Math.abs(now - last) < 1) {
        stable++
      } else {
        stable = 0
      }

      last = now

      if (stable >= framesStable || frames >= maxFrames) {
        resolve(now)
      } else {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  })

const smoothScrollTo = (targetY, { duration = 900 } = {}) => {
  const reduce =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduce) {
    window.scrollTo(0, Math.round(targetY))
    return
  }

  const startY = window.pageYOffset
  const delta = targetY - startY
  let start

  const ease = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

  function raf(ts) {
    if (!start) start = ts
    const p = Math.min((ts - start) / duration, 1)
    window.scrollTo(0, startY + delta * ease(p))
    if (p < 1) requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)
}

/** Centra la primera escena en el viewport (escritorio) */
const centerFirstScene = () => {
  const gallery = document.querySelector('.scene-gallery')
  if (!gallery) {
    goToGalleryTop()
    return
  }

  const firstCard = gallery.querySelector('.scene-card')
  if (!firstCard) {
    goToGalleryTop()
    return
  }

  waitForStableTop(firstCard).then(() => {
    const rect = firstCard.getBoundingClientRect()
    const cardCenterDoc = rect.top + window.pageYOffset + rect.height / 2
    const viewportCenter = window.innerHeight / 2
    const targetY = cardCenterDoc - viewportCenter

    smoothScrollTo(targetY, { duration: 900 })
  })
}

// "Comenzar descenso": en escritorio centra la primera escena;
// en móvil el botón no se muestra
const handleStart = () => {
  // reinicia la abeja para un nuevo recorrido
  window.dispatchEvent(new CustomEvent('bee-restart'))

  // buscamos la primera escena
  const firstCard = document.querySelector('.scene-gallery .scene-card')
  if (!firstCard) {
    // fallback: scroll al inicio de la galería como antes
    goToGallery()
    return
  }

  // centramos la primera escena en el viewport
  const rect = firstCard.getBoundingClientRect()
  const cardCenterDoc = rect.top + window.pageYOffset + rect.height / 2
  const viewportCenter = window.innerHeight / 2
  const targetY = cardCenterDoc - viewportCenter

  window.scrollTo({
    top: targetY,
    behavior: 'smooth',
  })
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
let resizeHandler

onMounted(() => {
  updateIsMobile()

  resizeHandler = () => {
    updateIsMobile()
  }
  window.addEventListener('resize', resizeHandler)

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
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
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
