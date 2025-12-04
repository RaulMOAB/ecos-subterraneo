<template>
  <!-- ⬇️ ahora el section tiene clase y estilo reactivo -->
  <section class="hero-wrapper" :style="heroStyle">
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
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
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

// ⬇️ Estado del fade del hero
const heroOpacity = ref(1)
const heroTranslateY = ref(0)
const FADE_DISTANCE = 320 // píxeles de scroll para desaparecer del todo

const updateIsMobile = () => {
  if (typeof window === 'undefined') return
  isMobile.value = window.matchMedia('(max-width: 640px)').matches
}

// ⬇️ Estilo reactivo aplicado al <section>
const heroStyle = computed(() => ({
  opacity: heroOpacity.value,
  transform: `translateY(${heroTranslateY.value}px)`,
}))

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

// "Comenzar descenso": reinicia la abeja y centra la primera escena
const HERO_HIDE_PATH_THRESHOLD = 0.8 // 0–1: porcentaje del fade donde aún ocultamos el path

const handleScroll = () => {
  const scrollY = window.scrollY || window.pageYOffset || 0
  const progress = Math.min(Math.max(scrollY / FADE_DISTANCE, 0), 1)

  heroOpacity.value = 1 - progress
  heroTranslateY.value = -progress * 40

  // Mientras el hero sigue siendo relevante, ocultamos path + abeja
  if (progress < HERO_HIDE_PATH_THRESHOLD) {
    document.body.dataset.heroStage = 'intro'
  } else {
    document.body.dataset.heroStage = 'gallery'
  }
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
  window.addEventListener('scroll', handleScroll, { passive: true })

  handleScroll()
  document.body.dataset.heroStage = 'intro'
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  delete document.body.dataset.heroStage

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
