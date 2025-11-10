<template>
  <section
    class="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6"
  >
    <h2 class="mb-6 text-center text-3xl font-semibold text-bone">
      {{ title }}
    </h2>
    <div class="prose prose-invert text-bone/80"><slot /></div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>
