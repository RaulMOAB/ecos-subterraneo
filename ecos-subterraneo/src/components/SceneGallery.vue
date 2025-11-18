<template>
  <section class="scene-gallery-wrapper">
    <!--<heroIntroPanel /> -->
    <PathTrail />

    <section class="scene-gallery" aria-label="Galería">
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
  </section>
</template>

<script setup>
import { computed } from 'vue'
import SceneCard from './SceneCard.vue'
import PathTrail from './PathTrail.vue'
import { scenes as defaultScenes } from './scenesData.js'

/**
 * 1) Importa aquí los audios de cada escena
 *    Ajusta los nombres de archivo a los que tengas realmente en assets/audio
 */
import scene1Audio from '@/assets/audio/scene1.wav'
import scene2Audio from '@/assets/audio/scene2.wav'
import scene3Audio from '@/assets/audio/scene3.wav'
import scene4Audio from '@/assets/audio/scene4.mp3'
import scene5Audio from '@/assets/audio/final_battle.mp3' // por ejemplo, la escena final

// Array paralelo de audios, en el mismo orden que tus escenas
const sceneAudios = [
  scene1Audio,
  scene2Audio,
  scene3Audio,
  scene4Audio,
  scene5Audio,
]

const props = defineProps({
  items: { type: Array, default: null },
})

// Escenas base: vienen de props o de scenesData
const galleryScenes = computed(() => props.items ?? defaultScenes)

/**
 * 2) Combinamos escenas + audios
 *    - audioSrc: la pista que usará SceneCard
 *    - isFinal: true solo en la última escena
 */
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
