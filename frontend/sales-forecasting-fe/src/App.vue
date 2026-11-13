<script setup>
import Navbar from '@/components/Navbar.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
    <Navbar />

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>

    <footer class="bg-white border-t border-slate-200 mt-auto py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div class="flex items-center space-x-2">
          <span class="font-bold text-slate-700">Sales Forecasting Dashboard</span>
          <span>•</span>
          <span>Store Sales Time Series Forecasting</span>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>Vue.js 3</span>
          <span>•</span>
          <span>Tailwind CSS</span>
          <span>•</span>
          <span>Chart.js</span>
          <span>•</span>
          <span>FastAPI</span>
          <span>•</span>
          <span>Random Forest Regressor</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
/* Smooth transitions */
.router-link-active {
  transition: all 0.15s ease-in-out;
}
</style>
