<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  getDashboardSummary,
  getHistoricalSales,
  runForecast,
  formatCurrency,
  formatCompactCurrency,
  formatDateIndo
} from '@/services/api'
import MetricCard from '@/components/MetricCard.vue'
import SalesChart from '@/components/SalesChart.vue'
import {
  DollarSign,
  BarChart3,
  Calendar,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-vue-next'

const loading = ref(true)
const error = ref(null)
const summary = ref(null)
const historySeries = ref([])
const forecastSeries = ref([])

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const [summaryRes, historyRes, forecastRes] = await Promise.all([
      getDashboardSummary(),
      getHistoricalSales({ preset: '90d' }),
      runForecast(30)
    ])

    summary.value = summaryRes
    historySeries.value = historyRes.chart_data || []
    forecastSeries.value = forecastRes.predictions || []
  } catch (err) {
    error.value = err.message || 'Gagal memuat ringkasan dashboard.'
  } finally {
    loading.value = false
  }
}

// Prepare combined timeline chart: last 60 days history + 30 days forecast
const combinedChartData = computed(() => {
  if (!historySeries.value.length && !forecastSeries.value.length) {
    return { labels: [], datasets: [] }
  }

  const recentHistory = historySeries.value.slice(-60)
  const labels = [
    ...recentHistory.map(h => h.date),
    ...forecastSeries.value.map(f => f.date)
  ]

  // Historical dataset (null during forecast range)
  const historicalPoints = [
    ...recentHistory.map(h => h.sales),
    ...forecastSeries.value.map(() => null)
  ]

  // Forecast dataset (null during historical range except connecting point)
  const lastHistoricalVal = recentHistory.length ? recentHistory[recentHistory.length - 1].sales : null
  const forecastPoints = [
    ...recentHistory.slice(0, -1).map(() => null),
    lastHistoricalVal,
    ...forecastSeries.value.map(f => f.forecast_sales)
  ]

  return {
    labels,
    datasets: [
      {
        label: 'Penjualan Historis Aktual',
        data: historicalPoints,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        fill: true,
        borderWidth: 2.5,
        pointRadius: 2,
        pointHoverRadius: 5,
        tension: 0.25
      },
      {
        label: 'Perkiraan Prediksi (30 Hari ke Depan)',
        data: forecastPoints,
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.12)',
        borderDash: [5, 5],
        fill: true,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.25
      }
    ]
  }
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header & Action -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Sales Forecasting Dashboard</h1>
        <p class="text-sm text-slate-500 mt-1">
          Ringkasan performa penjualan historis dan proyeksi cerdas 30 hari ke depan menggunakan Machine Learning.
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <button
          @click="loadData"
          :disabled="loading"
          class="inline-flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw class="w-4 h-4 text-slate-500" :class="{ 'animate-spin': loading }" />
          <span>Segarkan Data</span>
        </button>
        <router-link
          to="/forecast"
          class="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-200"
        >
          <Sparkles class="w-4 h-4" />
          <span>Buka Forecasting</span>
        </router-link>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="error"
      class="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800 text-sm"
    >
      <AlertCircle class="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
      <div class="flex-1">
        <p class="font-semibold">Terjadi kendala saat memuat data:</p>
        <p class="text-rose-700 mt-0.5">{{ error }}</p>
        <p class="text-xs text-rose-600 mt-2">Pastikan backend FastAPI sedang berjalan di port 8000.</p>
      </div>
    </div>

    <!-- 4 Main PRD KPI Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- 1. Total Penjualan Historis -->
      <MetricCard
        title="Total Penjualan Historis"
        :value="summary ? formatCompactCurrency(summary.total_historical_sales) : '$0'"
        :subtitle="summary ? `Total akumulasi ${summary.total_history_days} hari data` : 'Memuat...'"
        :badge-text="summary ? `${formatCurrency(summary.total_historical_sales)}` : ''"
        badge-type="indigo"
        color-scheme="indigo"
      >
        <template #icon>
          <DollarSign class="w-6 h-6" />
        </template>
      </MetricCard>

      <!-- 2. Rata-Rata Penjualan Harian -->
      <MetricCard
        title="Rata-Rata Penjualan Harian"
        :value="summary ? formatCurrency(summary.average_daily_sales) : '$0'"
        :subtitle="summary ? `Rentang harian historis seluruh toko` : 'Memuat...'"
        badge-text="Historis"
        badge-type="neutral"
        color-scheme="blue"
      >
        <template #icon>
          <BarChart3 class="w-6 h-6" />
        </template>
      </MetricCard>

      <!-- 3. Perkiraan Total Penjualan 30 Hari ke Depan -->
      <MetricCard
        title="Estimasi Penjualan (30 Hari)"
        :value="summary ? formatCompactCurrency(summary.forecast_30d_total) : '$0'"
        :subtitle="summary ? `Rata-rata ${formatCurrency(summary.forecast_30d_avg)} / hari` : 'Memuat...'"
        :badge-text="summary ? `${summary.forecast_growth_vs_recent_30d >= 0 ? '+' : ''}${summary.forecast_growth_vs_recent_30d}% vs 30d lalu` : ''"
        :badge-type="summary && summary.forecast_growth_vs_recent_30d >= 0 ? 'positive' : 'negative'"
        color-scheme="emerald"
      >
        <template #icon>
          <TrendingUp class="w-6 h-6" />
        </template>
      </MetricCard>

      <!-- 4. Tanggal Terakhir Data Historis -->
      <MetricCard
        title="Tanggal Data Terakhir"
        :value="summary ? summary.last_history_date : '-'"
        :subtitle="summary ? formatDateIndo(summary.last_history_date) : 'Memuat...'"
        badge-text="Kaggle Store Sales"
        badge-type="neutral"
        color-scheme="amber"
      >
        <template #icon>
          <Calendar class="w-6 h-6" />
        </template>
      </MetricCard>
    </div>

    <!-- Main Chart Section: Overview & Projection -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Tren Penjualan Historis & Proyeksi 30 Hari</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Menampilkan data 60 hari terakhir dari tanggal akhir historis disambungkan dengan prediksi Random Forest 30 hari ke depan.
          </p>
        </div>
        <div class="flex items-center space-x-3 text-xs">
          <div class="flex items-center space-x-1.5">
            <span class="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
            <span class="text-slate-600 font-medium">Historis</span>
          </div>
          <div class="flex items-center space-x-1.5">
            <span class="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
            <span class="text-slate-600 font-medium">Prediksi (30 Hari)</span>
          </div>
        </div>
      </div>

      <div v-if="loading" class="h-80 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw class="w-8 h-8 animate-spin mb-2 text-indigo-500" />
        <p class="text-sm">Menyiapkan visualisasi data...</p>
      </div>

      <div v-else>
        <SalesChart :data="combinedChartData" :height="340" />
      </div>
    </div>

    <!-- Quick Navigation & Operational Insights -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <!-- Historical Sales Feature Card -->
      <router-link
        to="/history"
        class="group p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between"
      >
        <div>
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <BarChart3 class="w-5 h-5" />
          </div>
          <h3 class="font-bold text-slate-900 group-hover:text-indigo-600 transition">Eksplorasi Data Historis</h3>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            Analisis data penjualan lengkap dari 2013 hingga 2017 dengan filter periode tanggal, grafik interaktif, dan tabel data terperinci.
          </p>
        </div>
        <div class="flex items-center space-x-1 text-xs font-semibold text-indigo-600 mt-4 group-hover:translate-x-1 transition-transform">
          <span>Lihat Data Historis</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </div>
      </router-link>

      <!-- Forecasting Feature Card -->
      <router-link
        to="/forecast"
        class="group p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
      >
        <div>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <TrendingUp class="w-5 h-5" />
          </div>
          <h3 class="font-bold text-slate-900 group-hover:text-emerald-600 transition">Generate Sales Forecast</h3>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            Jalankan model Random Forest untuk memprediksi angka penjualan 30 hari ke depan dan download hasil prediksi dalam format file CSV.
          </p>
        </div>
        <div class="flex items-center space-x-1 text-xs font-semibold text-emerald-600 mt-4 group-hover:translate-x-1 transition-transform">
          <span>Jalankan Prediksi</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </div>
      </router-link>

      <!-- Evaluation Feature Card -->
      <router-link
        to="/evaluation"
        class="group p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-md transition flex flex-col justify-between"
      >
        <div>
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <h3 class="font-bold text-slate-900 group-hover:text-purple-600 transition">Evaluasi Model ML</h3>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            Tinjau metrik performa model (MAE, RMSE, WAPE) hasil pengujian Google Colab dibandingkan dengan baseline model 7 hari terakhir.
          </p>
        </div>
        <div class="flex items-center space-x-1 text-xs font-semibold text-purple-600 mt-4 group-hover:translate-x-1 transition-transform">
          <span>Tinjau Evaluasi</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </div>
      </router-link>
    </div>
  </div>
</template>

