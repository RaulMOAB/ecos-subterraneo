import { createRouter, createWebHistory } from 'vue-router'
import HomeParallax from '@/views/HomeParallax.vue'

const routes = [{ path: '/', name: 'home', component: HomeParallax }]

const router = createRouter({
  history: createWebHistory('/ecos-subterraneo/'),
  routes,
})

export default router
