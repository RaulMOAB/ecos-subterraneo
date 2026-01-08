import { createRouter, createWebHistory } from 'vue-router'
import HomeParallax from '@/views/HomeParallax.vue'
import AboutView from '@/views/AboutView.vue'

const routes = [{ path: '/', name: 'home', component: HomeParallax }]

const router = createRouter({
  history: createWebHistory('/ecos-subterraneo/'),
  routes: [
    { path: '/', name: 'home', component: HomeParallax },
    { path: '/about', name: 'about', component: AboutView },
  ],
})

export default router
