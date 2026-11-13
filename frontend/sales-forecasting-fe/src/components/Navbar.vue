<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { checkHealth } from '@/services/api'
import {
  LayoutDashboard,
  TrendingUp,
  History,
  Award,
  CircleDot,
  Cpu
} from 'lucide-vue-next'

const route = useRoute()
const isBackendOnline = ref(false)
const backendDetails = ref(null)

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Historical Sales', path: '/history', icon: History },
  { name: 'Sales Forecasting', path: '/forecast', icon: TrendingUp },
  { name: 'Model Evaluation', path: '/evaluation', icon: Award }
]

async function verifyBackend() {
  try {
    const res = await checkHealth()
    isBackendOnline.value = res.status === 'OK'
    backendDetails.value = res
  } catch {
    isBackendOnline.value = false
  }
}

onMounted(() => {
  verifyBackend()
  // Check periodically
  setInterval(verifyBackend, 30000)
})
</script>

<template>
  <header class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Title -->
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <TrendingUp class="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-lg font-bold text-slate-900 tracking-tight">SalesForecast</span>
              <span class="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">v1.0</span>
            </div>
            <p class="text-xs text-slate-600 font-medium hidden sm:block">AI-Driven Sales Forecasting Dashboard</p>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="hidden md:flex items-center space-x-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="[
              route.path === item.path
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            ]"
          >
            <component :is="item.icon" class="w-4 h-4" />
            <span>{{ item.name }}</span>
          </router-link>
        </nav>

        <!-- Right Side: Model Badge & Status -->
        <div class="flex items-center space-x-3">
          <div class="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
            <Cpu class="w-3.5 h-3.5 text-slate-500" />
            <span>Random Forest (30d Horizon)</span>
          </div>

          <div
            class="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border"
            :class="isBackendOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'"
            :title="isBackendOnline ? 'FastAPI Backend Terhubung' : 'Gagal menghubungkan ke Backend API di port 8000'"
          >
            <span class="relative flex h-2 w-2">
              <span
                v-if="isBackendOnline"
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2"
                :class="isBackendOnline ? 'bg-emerald-500' : 'bg-rose-500'"
              ></span>
            </span>
            <span>{{ isBackendOnline ? 'API Connected' : 'API Offline' }}</span>
          </div>
        </div>
      </div>

      <!-- Mobile Navigation Bar -->
      <div class="md:hidden flex items-center justify-around py-2 border-t border-slate-100 overflow-x-auto">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex flex-col items-center py-1 px-2 text-xs font-medium rounded-md whitespace-nowrap"
          :class="[
            route.path === item.path
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          ]"
        >
          <component :is="item.icon" class="w-4 h-4 mb-0.5" />
          <span>{{ item.name }}</span>
        </router-link>
      </div>
    </div>
  </header>
</template>

