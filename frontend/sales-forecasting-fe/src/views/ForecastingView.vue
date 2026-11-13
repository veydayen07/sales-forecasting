<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  runForecast,
  formatCurrency,
  formatCompactCurrency,
  formatDateIndo,
  downloadForecastCsvClient,
  getForecastCsvDownloadUrl
} from '@/services/api'
import SalesChart from '@/components/SalesChart.vue'
import MetricCard from '@/components/MetricCard.vue'
import {
  Sparkles,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
  Cpu,
  FileSpreadsheet
} from 'lucide-vue-next'

const loading = ref(false)
const hasRunForecast = ref(false)
const forecastData = ref(null)
const error = ref(null)

async function executeForecast() {
  loading.value = true
  error.value = null
  try {
    const res = await runForecast(30)
    forecastData.value = res
    hasRunForecast.value = true
  } catch (err) {
    error.value = err.message || 'Gagal menjalankan prediksi model.'
  } finally {
    loading.value = false
  }
}

// Chart.js configuration for the 30-day forecast
const forecastChartConfig = computed(() => {
  if (!forecastData.value?.predictions?.length) {
    return { labels: [], datasets: [] }
  }

  const preds = forecastData.value.predictions
  const labels = preds.map(p => `${p.date} (${p.day_name.slice(0, 3)})`)
  const values = preds.map(p => p.forecast_sales)

  return {
    labels,
    datasets: [
      {
        label: 'Estimasi Penjualan Harian ($)',
        data: values,
        borderColor: '#059669', // Emerald 600
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        fill: true,
        borderWidth: 2.5,
        tension: 0.3,
        pointBackgroundColor: '#059669',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7
      }
    ]
  }
})

function handleDownloadCsv() {
  if (forecastData.value?.predictions) {
    downloadForecastCsvClient(forecastData.value.predictions)
  } else {
    window.open(getForecastCsvDownloadUrl(), '_blank')
  }
}

onMounted(() => {
  // Automatically execute forecast on page open so the user immediately gets visual results,
  // while also keeping the explicit "Generate Forecast" button as requested in PRD
  executeForecast()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header & Action Banner -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
      <!-- Decorative background glow -->
      <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute right-1/3 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="max-w-2xl space-y-2">
          <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
            <Cpu class="w-3.5 h-3.5 text-indigo-300" />
            <span>Random Forest Regressor • Multi-Step Recursive</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Prediksi Penjualan 30 Hari ke Depan
          </h1>
          <p class="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Menjalankan inferensi model Random Forest (<span class="text-emerald-400 font-mono">rf_sales_forecast.joblib</span>) untuk memproyeksikan total penjualan harian selama horizon 30 hari berdasarkan fitur lag penjualan dan rata-rata bergerak (rolling mean).
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Generate Forecast Button -->
          <button
            @click="executeForecast"
            :disabled="loading"
            class="inline-flex items-center space-x-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <Sparkles class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            <span>{{ loading ? 'Menjalankan Model...' : 'Generate Forecast' }}</span>
          </button>

          <!-- Download CSV Button -->
          <button
            @click="handleDownloadCsv"
            :disabled="loading || !forecastData"
            class="inline-flex items-center space-x-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition backdrop-blur-xs disabled:opacity-40 cursor-pointer"
          >
            <Download class="w-4 h-4 text-emerald-300" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="error"
      class="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800 text-sm"
    >
      <AlertCircle class="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
      <div>
        <p class="font-semibold">Gagal Menghasilkan Prediksi:</p>
        <p class="text-rose-700 mt-0.5">{{ error }}</p>
      </div>
    </div>

    <!-- Forecast KPI Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" v-if="forecastData">
      <MetricCard
        title="Total Prediksi 30 Hari"
        :value="formatCompactCurrency(forecastData.total_forecast)"
        :subtitle="`Akumulasi 30 hari ke depan`"
        :badge-text="formatCurrency(forecastData.total_forecast)"
        badge-type="positive"
        color-scheme="emerald"
      >
        <template #icon>
          <TrendingUp class="w-6 h-6" />
        </template>
      </MetricCard>

      <MetricCard
        title="Rata-Rata Penjualan Harian"
        :value="formatCurrency(forecastData.average_forecast)"
        :subtitle="`Estimasi harian toko`"
        badge-text="Rata-rata Prediksi"
        badge-type="neutral"
        color-scheme="blue"
      >
        <template #icon>
          <Calendar class="w-6 h-6" />
        </template>
      </MetricCard>

      <MetricCard
        title="Prediksi Penjualan Tertinggi"
        :value="formatCurrency(forecastData.max_forecast)"
        :subtitle="`Puncak lonjakan penjualan harian`"
        badge-text="Puncak"
        badge-type="positive"
        color-scheme="purple"
      >
        <template #icon>
          <ArrowUpRight class="w-6 h-6" />
        </template>
      </MetricCard>

      <MetricCard
        title="Prediksi Penjualan Terendah"
        :value="formatCurrency(forecastData.min_forecast)"
        :subtitle="`Estimasi batas bawah harian`"
        badge-text="Dasar"
        badge-type="neutral"
        color-scheme="amber"
      >
        <template #icon>
          <ArrowDownRight class="w-6 h-6" />
        </template>
      </MetricCard>
    </div>

    <!-- Forecast Chart Section -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">Grafik Prediksi Penjualan 30 Hari</h2>
          <p class="text-xs text-slate-500">
            Proyeksi penjualan per hari dari
            <span class="font-semibold text-slate-700" v-if="forecastData?.predictions?.length">
              {{ forecastData.predictions[0].date }}
            </span>
            sampai
            <span class="font-semibold text-slate-700" v-if="forecastData?.predictions?.length">
              {{ forecastData.predictions[forecastData.predictions.length - 1].date }}
            </span>
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 class="w-3.5 h-3.5" />
            <span>Horizon: 30 Hari</span>
          </span>
        </div>
      </div>

      <div v-if="loading" class="h-80 flex flex-col items-center justify-center text-slate-400">
        <Sparkles class="w-8 h-8 animate-spin text-emerald-500 mb-2" />
        <p class="text-xs">Model sedang melakukan kalkulasi prediksi rekursif...</p>
      </div>

      <div v-else-if="forecastData">
        <SalesChart :data="forecastChartConfig" :height="340" />
      </div>
    </div>

    <!-- Forecast Data Table -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-900">Tabel Rincian Hasil Prediksi</h2>
          <p class="text-xs text-slate-500">Rincian estimasi harian dengan indikator perubahan persentase harian</p>
        </div>

        <button
          @click="handleDownloadCsv"
          :disabled="!forecastData"
          class="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <FileSpreadsheet class="w-4 h-4 text-emerald-400" />
          <span>Export CSV</span>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-100">
            <tr>
              <th class="px-5 py-3 w-16 text-center">Hari Ke-</th>
              <th class="px-5 py-3">Tanggal Prediksi</th>
              <th class="px-5 py-3">Hari</th>
              <th class="px-5 py-3">Estimasi Penjualan (USD)</th>
              <th class="px-5 py-3">Perubahan Day-over-Day</th>
              <th class="px-5 py-3 text-right">Tanggal Formal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700" v-if="forecastData?.predictions">
            <tr
              v-for="(row, idx) in forecastData.predictions"
              :key="row.date"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <td class="px-5 py-3 text-center font-bold text-slate-500">
                #{{ idx + 1 }}
              </td>
              <td class="px-5 py-3 font-semibold text-slate-900 font-mono">
                {{ row.date }}
              </td>
              <td class="px-5 py-3">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-md font-medium"
                  :class="['Sabtu', 'Minggu'].includes(row.day_name)
                    ? 'bg-amber-100 text-amber-800 font-semibold'
                    : 'bg-slate-100 text-slate-700'"
                >
                  {{ row.day_name }}
                </span>
              </td>
              <td class="px-5 py-3 font-bold text-slate-900">
                {{ formatCurrency(row.forecast_sales) }}
              </td>
              <td class="px-5 py-3">
                <span
                  v-if="row.change_pct > 0"
                  class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <TrendingUp class="w-3 h-3" />
                  <span>+{{ row.change_pct }}%</span>
                </span>
                <span
                  v-else-if="row.change_pct < 0"
                  class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                >
                  <TrendingDown class="w-3 h-3" />
                  <span>{{ row.change_pct }}%</span>
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600"
                >
                  0.0%
                </span>
              </td>
              <td class="px-5 py-3 text-right text-slate-500">
                {{ formatDateIndo(row.date) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

