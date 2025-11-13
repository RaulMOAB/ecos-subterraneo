<template>
  <article class="scene-card" :class="cardClasses" :id="anchor">
    <!-- ===== ESTADO CERRADO ===== -->
    <template v-if="!isOpen">
      <div class="scene-media" @click="openScene">
        <img
          class="scene-img"
          :src="image"
          :alt="alt || title"
          loading="lazy"
        />
      </div>

      <div class="scene-controls">
        <button type="button" class="scene-cta" @click="openScene">
          Explorar escena
        </button>
      </div>
    </template>

    <!-- ===== ESTADO ABIERTO ===== -->
    <template v-else>
      <div class="scene-frame">
        <!-- Imagen, mismo tamaño que escena cerrada -->
        <div class="frame-media">
          <img
            class="scene-img"
            :src="image"
            :alt="alt || title"
            loading="lazy"
          />
        </div>

        <!-- Contenido de la escena (dentro de scene-frame) -->
        <div class="frame-content">
          <header class="scene-header">
            <p v-if="kicker" class="scene-kicker">
              {{ kicker }}
            </p>
            <h3 class="scene-title">
              {{ title }}
            </h3>
          </header>

          <p class="scene-desc">
            {{ description }}
          </p>

          <div class="panel-ctas">
            <button type="button" class="sc-btn sc-ghost" @click="closeScene">
              Ocultar descripción
            </button>

            <button type="button" class="sc-btn sc-primary" @click="handleNext">
              Seguir
            </button>
          </div>
        </div>
      </div>
    </template>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  alt: { type: String, default: '' },
  kicker: { type: String, default: '' },
  layout: {
    type: String,
    default: 'left', // 'left' | 'right' | 'center'
  },
  anchor: {
    type: String,
    default: undefined,
  },
})

const emit = defineEmits(['open', 'close', 'next'])

const isOpen = ref(false)

const cardClasses = computed(() => ({
  'is-open': isOpen.value,
  'is-center': props.layout === 'center',
}))

function openScene() {
  if (!isOpen.value) {
    isOpen.value = true
    emit('open')
  }
}

function closeScene() {
  if (isOpen.value) {
    isOpen.value = false
    emit('close')
  }
}

function handleNext() {
  emit('next')
}
</script>
