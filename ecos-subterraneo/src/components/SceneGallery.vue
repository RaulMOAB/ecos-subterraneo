<template>
  <section class="scene-gallery-wrapper">
    <!--<heroIntroPanel /> -->
    <PathTrail />

    <section class="scene-gallery" aria-label="Galería">
      <SceneCard
        v-for="(scene, i) in galleryScenes"
        :key="scene.id"
        :title="scene.title"
        :description="scene.description"
        :image="scene.image"
        :alt="scene.alt || scene.title"
        :kicker="scene.kicker"
        :layout="computeLayout(i, galleryScenes.length)"
        :anchor="i === 0 ? 'escena-1' : undefined"
      />
    </section>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import SceneCard from './SceneCard.vue'
import PathTrail from './PathTrail.vue'
import { scenes as defaultScenes } from './scenesData.js'

const props = defineProps({ items: { type: Array, default: null } })
const galleryScenes = computed(() => props.items ?? defaultScenes)

const computeLayout = (index, total) => {
  const isLast = index === total - 1
  if (isLast) return 'center'
  return index % 2 === 0 ? 'left' : 'right'
}
</script>
