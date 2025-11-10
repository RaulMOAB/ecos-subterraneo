import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Lenis from '@studio-freight/lenis'

const lenis = new Lenis({ duration: 1.0, smoothWheel: true })
function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

createApp(App).mount('#app')
