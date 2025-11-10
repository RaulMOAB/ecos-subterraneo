<template>
  <ParallaxLayers :layers="layers" height="120vh" :strength="1" :clamp="true">
    <div class="hero">
      <h1 class="hero-title">Ecos de lo Subterráneo</h1>
      <p class="hero-sub">Desplázate para descender</p>
    </div>
  </ParallaxLayers>
</template>

<script setup>
import ParallaxLayers from './ParallaxLayers.vue'
import '../styles/HeroParallax.css'
import { useHeroParallax } from './heroParallaxLogic.js'

const { layers } = useHeroParallax()
</script>
