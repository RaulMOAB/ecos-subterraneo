<template>
  <!-- El contenedor completo se oculta en el hero -->
  <div class="path-layer" v-show="visible">
    <svg class="scene-path" viewBox="0 0 100 100" preserveAspectRatio="none">
      <!-- Tronco recto, animado con el scroll -->
      <path
        ref="trunkRef"
        class="scene-path-trunk"
        :d="trunkD"
        fill="none"
        stroke="#f5c05a"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Rama horizontal hacia la escena activa -->
      <path
        ref="branchRef"
        class="scene-path-branch"
        :class="{ 'is-visible': branchVisible }"
        :d="branchD"
        fill="none"
        stroke="#f5c05a"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import '@/styles/pathTrail.css'

/* ---------- REFERENCIAS Y ESTADO BÁSICO ---------- */

const trunkRef = ref(null)
const branchRef = ref(null)

// Tronco: se recalculará para terminar al inicio de la última escena
const trunkD = ref('M 50 0 L 50 100')
const trunkLength = ref(0)
const trunkBottomNorm = ref(100) // Y (0–100) donde termina el tronco

// Rama: horizontal, desde el tronco al lado de la escena activa
const branchD = ref('')
const branchVisible = ref(false)

// Datos de escenas
// yCenterNorm: centro normalizado (0–100)
// yTopNorm: parte superior normalizada (0–100)
const scenesData = ref([]) // [{ el, centerDocY, yCenterNorm, yTopNorm, side }, ...]
const activeIndex = ref(-1)

// Visibilidad global del path (no mostrar en el hero)
const visible = ref(false)
const firstSceneTop = ref(0)

/* ---------- MEDIR ESCENAS Y DEFINIR EL TRONCO ---------- */

const measureScenes = async () => {
  await nextTick()

  const cards = Array.from(document.querySelectorAll('.scene-card'))
  if (!cards.length) return

  const docHeight = document.documentElement.scrollHeight || 1

  scenesData.value = cards.map((el) => {
    const rect = el.getBoundingClientRect()
    const topDocY = window.scrollY + rect.top
    const centerDocY = topDocY + rect.height / 2

    const yTopNorm = (topDocY / docHeight) * 100
    const yCenterNorm = (centerDocY / docHeight) * 100

    const isRight =
      el.classList.contains('scene-card--right') || el.dataset.side === 'right' // IMPORTANTE: data-side="left"/"right"

    return {
      el,
      centerDocY,
      yCenterNorm: Math.max(5, Math.min(95, yCenterNorm)),
      yTopNorm: Math.max(5, Math.min(95, yTopNorm)),
      side: isRight ? 'right' : 'left',
    }
  })

  // Top absoluto de la primera escena: para decidir cuándo mostrar el path
  const firstRect = cards[0].getBoundingClientRect()
  firstSceneTop.value = window.scrollY + firstRect.top

  // El tronco termina AL INICIO de la última escena (no la atraviesa)
  const last = scenesData.value[scenesData.value.length - 1]
  // puedes restar un poco si quieres que acabe justo antes del borde:
  const bottom = last.yTopNorm - 5.5 // o last.yTopNorm - 2
  trunkBottomNorm.value = Math.max(5, Math.min(95, bottom))

  trunkD.value = `M 50 0 L 50 ${trunkBottomNorm.value}`

  // Recalcular longitud del tronco para la animación
  await nextTick()
  if (trunkRef.value) {
    trunkLength.value = trunkRef.value.getTotalLength()
    trunkRef.value.style.strokeDasharray = trunkLength.value
    trunkRef.value.style.strokeDashoffset = trunkLength.value
  }
}

/* ---------- DETERMINAR ESCENA ACTIVA (PARA LA RAMA) ---------- */

const updateActiveScene = () => {
  if (!scenesData.value.length) return

  const vpHeight = window.innerHeight

  // Banda de activación centrada (35%–65% del viewport)
  const activationTop = vpHeight * 0.35
  const activationBottom = vpHeight * 0.65

  let newIndex = -1

  scenesData.value.forEach((scene, i) => {
    const rect = scene.el.getBoundingClientRect()
    const center = rect.top + rect.height / 2

    if (
      center >= activationTop &&
      center <= activationBottom &&
      newIndex === -1
    ) {
      newIndex = i
    }
  })

  // Ya no hacemos regla especial para la última escena aquí;
  // el tronco YA no baja más de su inicio, así que no "atraviesa" el final.

  if (newIndex !== activeIndex.value) {
    activeIndex.value = newIndex
  }
}

/* ---------- CONSTRUIR LA RAMA HORIZONTAL ---------- */

const buildBranchPath = async () => {
  await nextTick()

  const trunkX = 50
  const leftX = 30
  const rightX = 70

  const idx = activeIndex.value

  if (idx < 0 || !scenesData.value[idx]) {
    branchD.value = ''
    return
  }

  const scene = scenesData.value[idx]
  const y = scene.yCenterNorm // centro de la escena
  const sideX = scene.side === 'right' ? rightX : leftX

  // Línea horizontal simple desde el tronco hacia la escena
  branchD.value = `M ${trunkX} ${y} L ${sideX} ${y}`
}

/* ---------- ANIMACIÓN CON EL SCROLL ---------- */

const handleScroll = () => {
  updateActiveScene()

  if (!trunkRef.value || !trunkLength.value) return

  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight

  // Mostrar el path solo cuando nos acercamos a la primera escena
  const showThreshold = firstSceneTop.value - window.innerHeight * 0.6
  visible.value = scrollTop >= showThreshold

  const progress = docHeight > 0 ? scrollTop / docHeight : 0
  const clamped = Math.min(1, Math.max(0, progress))

  // Animar el tronco desde arriba hasta su final
  const drawLength = trunkLength.value * clamped
  trunkRef.value.style.strokeDashoffset = trunkLength.value - drawLength

  // Lógica de visibilidad de la rama:
  // solo si hay escena activa, el path está visible
  // y el tronco ha llegado a esa altura
  if (
    activeIndex.value >= 0 &&
    scenesData.value[activeIndex.value] &&
    visible.value
  ) {
    const scene = scenesData.value[activeIndex.value]
    const sceneY = scene.yCenterNorm

    // Proporción de altura de esa escena respecto al final del tronco
    const branchFrac =
      trunkBottomNorm.value > 0
        ? Math.min(1, sceneY / trunkBottomNorm.value)
        : 1

    // La rama solo aparece si el tronco ya ha llegado hasta esa altura
    branchVisible.value = clamped >= branchFrac
  } else {
    branchVisible.value = false
  }
}

/* ---------- REACCIONES Y CICLO DE VIDA ---------- */

// Cuando cambia la escena activa, recalculamos la rama
watch(activeIndex, () => {
  buildBranchPath()
})

// Al redimensionar, volvemos a medir todo y re-sincronizamos
const handleResize = async () => {
  await measureScenes()
  updateActiveScene()
  await buildBranchPath()
  handleScroll()
}

onMounted(async () => {
  await measureScenes()
  updateActiveScene()
  await buildBranchPath()

  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize)

  // Estado inicial coherente
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
})
</script>
