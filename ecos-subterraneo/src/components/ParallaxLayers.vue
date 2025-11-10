<template>
  <section
    class="parallax-scene"
    :style="{ height }"
    aria-label="Parallax scene"
  >
    <div
      v-for="(layer, i) in layers"
      :key="i"
      class="parallax-layer"
      :style="layerStyle(layer)"
    >
      <img
        :src="layer.src"
        :alt="layer.alt || `Capa ${i + 1}`"
        class="parallax-img"
        draggable="false"
      />
    </div>
    <div class="parallax-slot"><slot /></div>
  </section>
</template>

<script setup>
import '@/styles/parallax.css'
import { useParallax } from './parallax.js'

const props = defineProps({
  layers: { type: Array, required: true },
  height: { type: String, default: '120vh' },
  strength: { type: Number, default: 1 },
  clamp: { type: Boolean, default: true },
})

const { layerStyle } = useParallax(props)
</script>
