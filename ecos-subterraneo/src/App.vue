<script setup lang="ts">
import Section from './components/Section.vue'
import Bee from './components/Bee.vue'
import PathScroll from './components/PathScroll.vue'
</script>

<template>
  <Bee />
  <PathScroll />
  <main class="relative z-20">
    <Section title="Entrada a la Torre Invertida">
      Bienvenida/o a la galería. Desplázate para descender.
    </Section>
    <Section title="Pasillos de colmena">
      Ámbar tenue y ecos metálicos guían el viaje.
    </Section>
    <Section title="Trono del monarca abeja">
      El rumor de alas resuena en la piedra.
    </Section>
  </main>
</template>
