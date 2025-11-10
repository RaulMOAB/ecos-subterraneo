<template>
  <div
    class="pointer-events-none fixed left-0 top-0 z-50 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hive/80 shadow-[0_0_20px_6px_rgba(224,183,0,0.45)]"
    :style="{ transform: `translate3d(${x}px, ${y}px, 0)` }"
  />
</template>

<script setup>
import { useMouseSpring } from '../composables/useMouseSpring'
const { x, y } = useMouseSpring(0.18)
</script>
