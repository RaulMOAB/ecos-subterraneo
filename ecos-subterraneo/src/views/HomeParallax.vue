<script setup lang="ts">
import HeroParallax from '@/components/HeroParallax.vue'
import Section from '@/components/Section.vue'
import Bee from '@/components/Bee.vue'
import PathScroll from '@/components/PathScroll.vue'
import SceneGallery from '@/components/SceneGallery.vue'
import '@/styles/sceneGallery.css'
</script>

<template>
  <HeroParallax />

  <Bee />
  <PathScroll />
  <section id="galeria">
    <!-- Aquí irá SceneGallery -->
    <div id="escena-1">
      <SceneGallery />
    </div>
  </section>
</template>
