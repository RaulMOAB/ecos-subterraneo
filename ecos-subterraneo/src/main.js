import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import Lenis from '@studio-freight/lenis'
import './styles/pathTrail.css'

const lenis = new Lenis({
  smooth: true,
  lerp: 0.1,
})
function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

createApp(App).use(router).mount('#app')
