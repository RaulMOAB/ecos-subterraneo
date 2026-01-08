<template>
  <main class="about-page" aria-labelledby="about-title">
    <section
      ref="cardRef"
      class="about-card"
      @mousemove="onMove"
      @mouseenter="onEnter"
      @mouseleave="onLeave"
      :style="cardStyle"
    >
      <img
        class="about-avatar"
        src="@/assets/foto_perfil_uoc.jpg"
        alt="Foto de perfil"
        loading="lazy"
        decoding="async"
      />

      <h1 id="about-title" class="about-title">Sobre mí</h1>

      <p class="about-text">
        ¡Hola! soy Raul. <br />Este proyecto explora un descenso simbólico a un
        mundo subterráneo, combinando narrativa visual, sonido y ritmo de
        exploración.<br />
        Como buen fan de la atmósferas oscuras inspiradas en videojuegos y
        novelas de fantasía oscura he disfrutado inmensamente en el desarrollo
        de Ecos de lo Subterráneo. <br />Espero que haya sido de vuestro agrado.
      </p>

      <div class="about-actions">
        <a class="about-link" href="mailto:rmontoroab@uoc.edu">Contacto</a>
        <RouterLink class="about-link is-secondary" to="/"
          >Volver a la galería</RouterLink
        >
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

const cardRef = ref(null)

const rotX = ref(0) // rotación en X
const rotY = ref(0) // rotación en Y
const tx = ref(0) // translate X
const ty = ref(0) // translate Y
const hovering = ref(false)

const MAX_ROT = 6 // grados
const MAX_MOVE = 8 // px

const onEnter = () => {
  hovering.value = true
}

const onLeave = () => {
  hovering.value = false
  rotX.value = 0
  rotY.value = 0
  tx.value = 0
  ty.value = 0
}

const onMove = (e) => {
  const el = cardRef.value
  if (!el) return

  const r = el.getBoundingClientRect()
  const x = e.clientX - r.left
  const y = e.clientY - r.top

  // normalizado -1..1 (centro = 0)
  const nx = (x / r.width) * 2 - 1
  const ny = (y / r.height) * 2 - 1

  // “empuja” hacia donde va el cursor
  rotY.value = nx * MAX_ROT
  rotX.value = -ny * MAX_ROT

  tx.value = nx * MAX_MOVE
  ty.value = ny * MAX_MOVE
}

const cardStyle = computed(() => ({
  transform: `perspective(900px) translate3d(${tx.value}px, ${ty.value}px, 0) rotateX(${rotX.value}deg) rotateY(${rotY.value}deg)`,
  transition: hovering.value
    ? 'transform 60ms linear'
    : 'transform 420ms cubic-bezier(.2,.8,.2,1)',
}))
</script>

<style src="@/styles/about.css"></style>
