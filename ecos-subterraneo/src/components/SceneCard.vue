<template>
  <article
    class="scene-card"
    :class="[
      { 'is-open': open, 'is-center': layout === 'center' },
      `scene-card--${layout}`,
    ]"
    :data-side="layout"
    ref="cardRef"
  >
    <!-- IMAGEN (SIEMPRE IGUAL) -->
    <figure class="scene-media" @click="toggle">
      <img
        :src="image"
        :alt="alt"
        class="scene-img"
        loading="lazy"
        decoding="async"
      />

      <!-- 🔊 BOTÓN DE AUDIO EN LA ESQUINA SUPERIOR DERECHA DE LA IMAGEN -->
      <button
        v-if="audioSrc && open"
        type="button"
        class="scene-audio-toggle--image"
        @click.stop="toggleSceneAudio"
        :aria-pressed="sceneAudioPlaying"
        :aria-label="
          sceneAudioPlaying
            ? 'Silenciar audio de la escena'
            : 'Activar audio de la escena'
        "
      >
        <img
          :src="sceneAudioPlaying ? soundOffUrl : soundOnUrl"
          alt=""
          class="scene-audio-icon"
        />
      </button>
    </figure>

    <!-- CTA CUANDO ESTÁ CERRADA -->
    <div v-if="!open" class="scene-controls">
      <button class="scene-cta" type="button" @click="toggle">
        {{ ctaLabel || 'Explorar escena' }}
      </button>
    </div>

    <!-- PANEL DE DESCRIPCIÓN CUANDO ESTÁ ABIERTA -->
    <section v-else class="scene-details">
      <header class="scene-header">
        <p v-if="kicker" class="scene-kicker">{{ kicker }}</p>
        <h3 class="scene-title">{{ title }}</h3>
      </header>

      <p class="scene-desc">
        <slot>{{ description }}</slot>
      </p>

      <div class="scene-actions">
        <button class="sc-btn sc-ghost" type="button" @click="open = false">
          Ocultar descripción
        </button>

        <!-- En la última escena NO mostramos "Seguir" -->
        <button
          v-if="!isLast"
          class="sc-btn sc-primary"
          type="button"
          @click="goNext"
        >
          Seguir
        </button>
      </div>
    </section>

    <!-- AUDIO AMBIENTAL DE LA ESCENA -->
    <audio v-if="audioSrc" ref="sceneAudio" :src="audioSrc" loop></audio>
  </article>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import soundOnUrl from '@/assets/resources/sound-on.png'
import soundOffUrl from '@/assets/resources/sound-off.png'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, required: true },
  alt: { type: String, default: '' },
  kicker: { type: String, default: '' },
  layout: { type: String, default: 'left' }, // 'left' | 'right' | 'center'
  anchor: { type: String, default: '' },
  ctaLabel: { type: String, default: '' },
  defaultOpen: { type: Boolean, default: false },
  isOpen: {
    type: Boolean,
    default: false,
  },
  audioSrc: {
    type: String,
    default: null,
  },
  isFinal: {
    type: Boolean,
    default: false,
  },
})

const open = ref(props.defaultOpen || props.isOpen)
const cardRef = ref(null)
const sceneAudio = ref(null)
const sceneAudioPlaying = ref(false) // estado de audio de esta escena

function toggle() {
  open.value = !open.value
}

/** Última escena => sin botón Seguir */
const isLast = computed(() => {
  const card = cardRef.value
  if (!card) return false
  const gallery = card.closest('.scene-gallery') || document
  const cards = Array.from(gallery.querySelectorAll('.scene-card'))
  const idx = cards.indexOf(card)
  return idx === cards.length - 1
})

/** Scroll suave a la siguiente escena */
function goNext() {
  const current = cardRef.value
  if (!current) return

  const gallery = current.closest('.scene-gallery') || document
  const cards = Array.from(gallery.querySelectorAll('.scene-card'))
  const idx = cards.indexOf(current)
  const next = cards[idx + 1]
  if (!next) return

  // cerrar la escena actual
  open.value = false

  // esperar a que el layout se estabilice y luego hacer scroll
  waitForStableTop(next).then((absTop) => {
    const header = document.querySelector('.site-header, header')
    const headerH = header?.offsetHeight || 0
    const pad = Math.max(24, window.innerHeight * 0.08)
    const targetY = Math.max(0, absTop - headerH - pad)
    smoothScrollTo(targetY, { duration: 900 })
  })
}

function waitForStableTop(el, { framesStable = 4, maxFrames = 40 } = {}) {
  return new Promise((resolve) => {
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
}

function smoothScrollTo(targetY, { duration = 900 } = {}) {
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

/* ==== AUDIO DE ESCENA + COMUNICACIÓN CON EL HERO ==== */

function playSceneAudio() {
  if (!sceneAudio.value) return
  sceneAudio.value.currentTime = 0
  sceneAudio.value.play()
  sceneAudioPlaying.value = true
}

function stopSceneAudio() {
  if (!sceneAudio.value) return
  sceneAudio.value.pause()
  sceneAudio.value.currentTime = 0
  sceneAudioPlaying.value = false
}

// toggle solo del audio de la escena (no abre/cierra la card)
function toggleSceneAudio() {
  if (!sceneAudio.value) return
  if (sceneAudioPlaying.value) {
    stopSceneAudio()
  } else {
    playSceneAudio()
  }
}

// cuando cambia `open`, gestionamos audio + eventos del hero
watch(
  open,
  (isNowOpen) => {
    if (isNowOpen) {
      // reproducir audio de la escena si existe
      if (props.audioSrc) {
        playSceneAudio()
      }

      if (props.isFinal) {
        window.dispatchEvent(new CustomEvent('final-scene-open'))
      } else {
        window.dispatchEvent(new CustomEvent('scene-opened'))
      }
    } else {
      // al cerrar, parar audio de escena
      stopSceneAudio()

      if (!props.isFinal) {
        window.dispatchEvent(new CustomEvent('scene-closed'))
      }
    }
  },
  { immediate: false },
)

onBeforeUnmount(() => {
  stopSceneAudio()
})
</script>
