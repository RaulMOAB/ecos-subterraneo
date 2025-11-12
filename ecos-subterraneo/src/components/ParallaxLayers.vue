<template>
  <section ref="sceneRef" class="parallax-scene" aria-label="Parallax scene">
    <div
      v-for="(layer, i) in props.layers"
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
    <div class="parallax-dark-overlay" aria-hidden="true"></div>
    <!--capa oscura-->
    <div class="parallax-slot">
      <slot />
    </div>
  </section>
</template>

<script setup>
import '@/styles/parallax.css'
import { ref, onMounted, onUnmounted } from 'vue'
import { useParallax } from './parallax.js'

const props = defineProps({
  layers: { type: Array, required: true },
  strength: { type: Number, default: 2.0 },
  clamp: { type: Boolean, default: true },
  lerp: { type: Number, default: 0.28 },
})

const sceneRef = ref(null)
const { layerStyle, initParallax, destroyParallax } = useParallax(props)

onMounted(() => {
  initParallax(sceneRef)
})

onUnmounted(() => {
  destroyParallax()
})
</script>
