<template>
  <article
    class="scene-card"
    :class="[{ 'is-center': layout === 'center', 'is-open': open }]"
    :data-side="layout"
    :id="anchor || undefined"
    ref="cardRef"
  >
    <!-- ESTADO CERRADO: imagen grande + CTA debajo -->
    <template v-if="!open">
      <figure
        class="scene-media"
        @click="toggle"
        :aria-controls="ids.panel"
        :aria-expanded="open ? 'true' : 'false'"
      >
        <img
          :src="image"
          :alt="alt"
          class="scene-img"
          loading="lazy"
          decoding="async"
        />
      </figure>

      <div class="scene-controls">
        <button class="scene-cta" type="button" @click="toggle">
          {{ ctaLabel || 'Explorar escena' }}
        </button>
      </div>
    </template>

    <!-- ESTADO ABIERTO: TODO dentro del MISMO RECUADRO (borde) -->
    <div
      v-else
      class="scene-frame"
      :aria-labelledby="ids.title"
      :aria-describedby="ids.panel"
    >
      <!-- Imagen dentro del recuadro -->
      <figure class="frame-media">
        <img
          :src="image"
          :alt="alt"
          class="scene-img"
          loading="lazy"
          decoding="async"
        />
      </figure>

      <!-- Contenido / descripción dentro del recuadro -->
      <div :id="ids.panel" class="frame-content">
        <header class="scene-header">
          <h3 :id="ids.title" class="scene-title">{{ title }}</h3>
          <p v-if="kicker" class="scene-kicker">{{ kicker }}</p>
        </header>

        <p class="scene-desc">
          <slot>{{ description }}</slot>
        </p>

        <div class="panel-ctas">
          <button class="sc-btn sc-ghost" type="button" @click="toggle">
            Ocultar descripción
          </button>
          <button v-if="!isLast" class="sc-btn sc-primary" @click="goNext">
            Seguir
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

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
})

const open = ref(props.defaultOpen)
const cardRef = ref(null)

const ids = {
  title: `scene-title-${Math.random().toString(36).slice(2, 8)}`,
  panel: `scene-panel-${Math.random().toString(36).slice(2, 8)}`,
}

function toggle() {
  open.value = !open.value
}

/* ===== Scroll robusto a la siguiente escena (corrige el “se queda a medias”) ===== */
function goNext() {
  const current = cardRef.value
  if (!current) return

  // localizar la siguiente .scene-card dentro de la misma galería
  const gallery = current.closest('.scene-gallery') || document
  const cards = Array.from(gallery.querySelectorAll('.scene-card'))
  const idx = cards.indexOf(current)
  const next = cards[idx + 1]
  if (!next) return

  // 1) Cierra la actual
  open.value = false

  // 2) Espera a que el layout se estabilice (fin de transición / próximo frame)
  waitForStableTop(next).then((absTop) => {
    const header = document.querySelector('.site-header, header')
    const headerH = header?.offsetHeight || 0
    const pad = Math.max(24, window.innerHeight * 0.08) // 8% de viewport como colchón
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
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
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
const isLast = computed(() => {
  const gallery = cardRef.value?.closest('.scene-gallery') || document
  const cards = Array.from(gallery.querySelectorAll('.scene-card'))
  const idx = cards.indexOf(cardRef.value)
  return idx === cards.length - 1
})
</script>
