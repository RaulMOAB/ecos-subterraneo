<template>
  <section
    class="gi-panel"
    role="region"
    :aria-labelledby="ids.title"
    :data-open="open"
  >
    <div class="gi-wrap">
      <!-- Cabecera: título + cerrar -->
      <header class="gi-header">
        <h2 :id="ids.title" class="gi-title">{{ title }}</h2>
        <button
          class="gi-close"
          @click="collapse"
          aria-label="Cerrar introducción"
        >
          ×
        </button>
      </header>

      <div class="gi-grid">
        <!-- Figura / SVG del héroe -->
        <div class="gi-figure">
          <slot name="figure">
            <img v-if="svgSrc" :src="svgSrc" alt="Héroe" />
          </slot>
        </div>

        <!-- Descripción + CTA -->
        <div class="gi-content">
          <p class="gi-desc">{{ description }}</p>
          <div class="gi-actions">
            <button class="gi-cta" @click="start">
              {{ ctaLabel }}
            </button>
            <button class="gi-ghost" @click="collapse">Ocultar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Barra colapsada -->
    <button
      class="gi-reopen"
      v-if="!open"
      @click="expand"
      aria-label="Mostrar presentación del héroe"
    >
      Conoce al héroe
    </button>
  </section>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useGalleryIntroPanel } from './galleryIntroPanel.js'
import '@/styles/galleryIntroPanel.css'

const props = defineProps({
  modelValue: { type: Boolean, default: true }, // estado abierto/cerrado inicial
  title: { type: String, default: 'La Abeja Custodia' },
  description: {
    type: String,
    default:
      'Vigilante de los ecos, desciende por la colmena para custodiar los secretos del subsuelo.',
  },
  ctaLabel: { type: String, default: 'Empezar descenso' },
  // id del primer bloque real de la galería al que hacer scroll al pulsar CTA
  firstSceneId: { type: String, default: 'escena-1' },
  // persistencia del estado (para abrir solo la primera vez, por ejemplo)
  persistKey: { type: String, default: 'ecos:intro_seen' },
  // SVG/imagen del héroe si no usas slot
  svgSrc: { type: String, default: '' },
  // abrir solo si query param ?intro=1
  openOnQuery: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'start'])

const open = ref(props.modelValue)
const rnd = Math.random().toString(36).slice(2, 8)
const ids = { title: `gi-title-${rnd}` }

const { ensureInitState, saveCollapsed, shouldOpenFromQuery } =
  useGalleryIntroPanel(props.persistKey)

onMounted(() => {
  // decide estado inicial: query param > persistencia > prop
  if (props.openOnQuery && shouldOpenFromQuery()) {
    open.value = true
  } else {
    open.value = ensureInitState(props.modelValue)
  }
})

watch(open, (v) => emit('update:modelValue', v))

function expand() {
  open.value = true
}

function collapse() {
  open.value = false
  saveCollapsed()
}

function start() {
  emit('start')
  // cierra panel y baja a la primera escena real
  collapse()
  const el = document.getElementById(props.firstSceneId)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>
