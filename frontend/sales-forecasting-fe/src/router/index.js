import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import HistoricalView from '@/views/HistoricalView.vue'
import ForecastingView from '@/views/ForecastingView.vue'
import EvaluationView from '@/views/EvaluationView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { title: 'Dashboard - Sales Forecasting' }
    },
    {
      path: '/history',
      name: 'historical',
      component: HistoricalView,
      meta: { title: 'Historical Sales - Sales Forecasting' }
    },
    {
      path: '/forecast',
      name: 'forecast',
      component: ForecastingView,
      meta: { title: 'Sales Forecasting - Sales Forecasting' }
    },
    {
      path: '/evaluation',
      name: 'evaluation',
      component: EvaluationView,
      meta: { title: 'Model Evaluation - Sales Forecasting' }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Sales Forecasting Dashboard'
  next()
})

export default router
