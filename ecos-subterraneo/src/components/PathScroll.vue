<template>
  <svg
    class="pointer-events-none fixed inset-0 z-10"
    viewBox="0 0 100 100"
    preserveAspectRatio="xMidYMid slice"
  >
    <path
      d="M0,10 C25,20 35,40 50,50 C65,60 75,80 100,90"
      fill="none"
      stroke="#e0b700"
      stroke-width="1.1"
      stroke-linecap="round"
      pathLength="1"
      :style="{
        strokeDasharray: 1,
        strokeDashoffset: 1 - progress,
        opacity: Math.max(0, Math.min(1, progress / 0.1)),
      }"
    />
  </svg>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
const progress = ref(0)
const update = () => {
  const h = document.documentElement.scrollHeight - window.innerHeight
  progress.value = h > 0 ? window.scrollY / h : 0
}
onMounted(() => {
  update()
  window.addEventListener('scroll', update, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', update))
</script>
