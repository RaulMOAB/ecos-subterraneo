<template>
  <footer
    class="gallery-footer"
    :class="{ 'is-visible': isVisible }"
    ref="footerRef"
  >
    <!-- pequeño círculo brillante -->
    <div class="footer-core"></div>

    <p class="gallery-footer__text">
      Fin del recorrido · Ecos de lo Subterráneo
    </p>

    <button class="gallery-footer__button" @click="scrollToTop">
      Volver al inicio
    </button>
  </footer>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const footerRef = ref(null)
const isVisible = ref(false)
const hasReachedOnce = ref(false)

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

let observer = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true

          // Avisar solo la primera vez
          if (!hasReachedOnce.value) {
            hasReachedOnce.value = true
            window.dispatchEvent(new CustomEvent('final-footer-visible'))
          }
        }
      })
    },
    { threshold: 0.4 },
  )

  if (footerRef.value) {
    observer.observe(footerRef.value)
  }
})

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
})
</script>

<style src="@/styles/galleryFooter.css"></style>
