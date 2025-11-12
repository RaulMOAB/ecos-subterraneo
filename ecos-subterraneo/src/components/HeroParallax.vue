<template>
  <ParallaxLayers
    :layers="layers"
    :strength="1.5"
    :clamp="true"
    :lerp="0.28"
    class="hero-parallax"
  >
    <article class="hero" aria-labelledby="hero-title">
      <div class="hero-backdrop" aria-hidden="true"></div>
      <div class="hero-content">
        <p class="hero-kicker">Colección inmersiva</p>
        <h1 id="hero-title" class="hero-title">Ecos de lo Subterráneo</h1>
        <p class="hero-sub">
          Desciende por el paisaje abisal y descubre las piezas inspiradas en la
          colmena invertida.
        </p>
        <a class="hero-cta" href="#inicio">Comenzar descenso</a>
      </div>
    </article>
  </ParallaxLayers>
</template>

<script setup>
import ParallaxLayers from './ParallaxLayers.vue'
import '../styles/HeroParallax.css'
import { useHeroParallax } from './heroParallaxLogic.js'

const { layers } = useHeroParallax()
</script>
