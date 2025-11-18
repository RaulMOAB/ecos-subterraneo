<template>
  <div id="app">
    <!-- Cursor mágico -->
    <div class="magic-cursor" ref="cursorEl"></div>

    <!-- Resto de la app -->
    <RouterView />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const cursorEl = ref(null)

let mouseX = window.innerWidth / 2
let mouseY = window.innerHeight / 2
let cursorX = mouseX
let cursorY = mouseY
let rafId = null

function animateCursor() {
  const lerp = 0.18
  cursorX += (mouseX - cursorX) * lerp
  cursorY += (mouseY - cursorY) * lerp

  if (cursorEl.value) {
    cursorEl.value.style.left = `${cursorX}px`
    cursorEl.value.style.top = `${cursorY}px`
  }

  rafId = requestAnimationFrame(animateCursor)
}

function handleMouseMove(e) {
  mouseX = e.clientX
  mouseY = e.clientY

  updateInteractiveState(e.target)
  createSpark(e.clientX, e.clientY)
}

function updateInteractiveState(target) {
  if (!cursorEl.value) return

  const interactiveSelector =
    'a, button, [role="button"], .scene-cta, .sc-btn, .hero-cta'

  const isInteractive = !!target.closest?.(interactiveSelector)

  if (isInteractive) {
    cursorEl.value.classList.add('is-interactive')
  } else {
    cursorEl.value.classList.remove('is-interactive')
  }
}

function createSpark(x, y) {
  const spark = document.createElement('div')
  spark.className = 'magic-spark'

  const offsetX = (Math.random() - 0.5) * 18
  const offsetY = (Math.random() - 0.5) * 18
  const size = 4 + Math.random() * 6

  spark.style.left = `${x + offsetX}px`
  spark.style.top = `${y + offsetY}px`
  spark.style.width = `${size}px`
  spark.style.height = `${size}px`
  spark.style.opacity = 0.6 + Math.random() * 0.4

  document.body.appendChild(spark)
  setTimeout(() => spark.remove(), 900)
}

function handleScroll() {
  const scrollY = window.scrollY || window.pageYOffset
  const h = Math.min(40 + scrollY / 50, 55)
  const root = document.documentElement

  root.style.setProperty('--cursor-gold-main', `hsla(${h}, 90%, 75%, 1)`)
  root.style.setProperty('--cursor-gold-mid', `hsla(${h}, 85%, 65%, 0.7)`)
  root.style.setProperty('--cursor-gold-soft', `hsla(${h}, 80%, 55%, 0.35)`)
  root.style.setProperty('--cursor-gold-secondary', `hsla(${h}, 80%, 60%, 0.5)`)
}

function handleFinalBattleOpen() {
  document.body.dataset.finalBattle = 'true'
}

function handleFinalBattleClose() {
  delete document.body.dataset.finalBattle
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('scroll', handleScroll, { passive: true })

  window.addEventListener('final-scene-open', handleFinalBattleOpen)
  window.addEventListener('final-scene-close', handleFinalBattleClose)

  rafId = requestAnimationFrame(animateCursor)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('scroll', handleScroll)

  window.removeEventListener('final-scene-open', handleFinalBattleOpen)
  window.removeEventListener('final-scene-close', handleFinalBattleClose)

  if (rafId) cancelAnimationFrame(rafId)
})
</script>
