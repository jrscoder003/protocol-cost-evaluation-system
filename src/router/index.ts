import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue')
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('../views/LibraryView.vue')
    },
    {
      path: '/evaluation',
      name: 'evaluation',
      component: () => import('../views/EvaluationView.vue')
    },
    {
      path: '/report',
      name: 'report',
      component: () => import('../views/ReportView.vue')
    }
  ]
})

export default router
