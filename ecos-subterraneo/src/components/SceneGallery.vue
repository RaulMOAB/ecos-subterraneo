<template>
  <section
    class="scene-gallery-wrapper relative w-full overflow-x-hidden bg-[#0b0b12] py-16 sm:py-20 lg:py-24"
  >
    <!-- El path puede ir por detrás; el posicionamiento lo controla su propio CSS -->
    <PathTrail />

    <section
      class="scene-gallery mx-auto grid grid-cols-1 gap-y-16 sm:gap-y-20 lg:gap-y-24 px-4 sm:px-6 lg:px-8 max-w-5xl lg:max-w-6xl"
      aria-label="Galería"
    >
      <SceneCard
        v-for="(scene, i) in scenesWithAudio"
        :key="scene.id"
        :title="scene.title"
        :description="scene.description"
        :image="scene.image"
        :alt="scene.alt || scene.title"
        :kicker="scene.kicker"
        :layout="computeLayout(i, scenesWithAudio.length)"
        :anchor="i === 0 ? 'escena-1' : undefined"
        :audio-src="scene.audioSrc"
        :is-final="scene.isFinal"
      />
    </section>

    <!-- Separación limpia del footer respecto a la última escena -->
    <div class="mt-16 sm:mt-20">
      <GalleryFooter />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import SceneCard from './SceneCard.vue'
import PathTrail from './PathTrail.vue'
import { scenes as defaultScenes } from './scenesData.js'
import GalleryFooter from './GalleryFooter.vue'

import scene1Audio from '@/assets/audio/scene1.wav'
import scene2Audio from '@/assets/audio/scene2.wav'
import scene3Audio from '@/assets/audio/scene3.wav'
import scene4Audio from '@/assets/audio/scene4.wav'
import scene5Audio from '@/assets/audio/final_battle.mp3'

const sceneAudios = [
  scene1Audio,
  scene2Audio,
  scene3Audio,
  scene4Audio,
  scene5Audio,
]

const cardsObserver = ref(null)

onMounted(() => {
  if (typeof window === 'undefined') return

  const cards = document.querySelectorAll('.scene-card')
  if (!cards.length) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.2,
    },
  )

  cards.forEach((card) => observer.observe(card))
  cardsObserver.value = observer
})

onBeforeUnmount(() => {
  if (cardsObserver.value) {
    cardsObserver.value.disconnect()
  }
})

const props = defineProps({
  items: { type: Array, default: null },
})

const galleryScenes = computed(() => props.items ?? defaultScenes)

const scenesWithAudio = computed(() =>
  galleryScenes.value.map((scene, index, arr) => ({
    ...scene,
    audioSrc: sceneAudios[index] ?? null,
    isFinal: index === arr.length - 1,
  })),
)

const computeLayout = (index, total) => {
  const isLast = index === total - 1
  if (isLast) return 'center'
  return index % 2 === 0 ? 'left' : 'right'
}
</script>
