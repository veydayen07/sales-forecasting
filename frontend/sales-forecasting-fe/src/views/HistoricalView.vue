<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import {
  getHistoricalSales,
  formatCurrency,
  formatCompactCurrency,
  formatDateIndo
} from '@/services/api'
import SalesChart from '@/components/SalesChart.vue'
import {
  Calendar,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CalendarDays,
  X
} from 'lucide-vue-next'

const loading = ref(true)
const activePreset = ref('90d') // Default 90 days for crisp initial render
const startDateInput = ref('')
const endDateInput = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(15)

const chartDataSeries = ref([])
const tableRecords = ref([])
const totalFilteredRecords = ref(0)
const totalOverallRecords = ref(0)
const minDatasetDate = ref('')
const maxDatasetDate = ref('')

async function fetchData() {
  loading.value = true
  try {
    const isCustom = Boolean(startDateInput.value || endDateInput.value)
    const res = await getHistoricalSales({
      preset: isCustom ? null : activePreset.value,
      startDate: startDateInput.value || null,
      endDate: endDateInput.value || null,
      page: 1,
      pageSize: 500 // Fetch sufficient table data for client-side fluid pagination & filtering
    })

    chartDataSeries.value = res.chart_data || []
    tableRecords.value = res.chart_data ? [...res.chart_data].reverse() : []
    totalFilteredRecords.value = res.filtered_records || 0
    totalOverallRecords.value = res.total_records || 0
    if (res.start_date) minDatasetDate.value = res.start_date
    if (res.end_date) maxDatasetDate.value = res.end_date
  } catch (err) {
    console.error('Error fetching historical sales:', err)
  } finally {
    loading.value = false
  }
}

function selectPreset(preset) {
  activePreset.value = preset
  startDateInput.value = ''
  endDateInput.value = ''
  currentPage.value = 1
  fetchData()
}

function applyCustomDateFilter() {
  activePreset.value = ''
  currentPage.value = 1
  fetchData()
}

function resetFilter() {
  startDateInput.value = ''
  endDateInput.value = ''
  activePreset.value = '90d'
  currentPage.value = 1
  fetchData()
}

// Stats for current selected timeframe
const periodStats = computed(() => {
  if (!chartDataSeries.value.length) {
    return { total: 0, avg: 0, min: 0, max: 0, count: 0 }
  }
  const sales = chartDataSeries.value.map(d => d.sales)
  const total = sales.reduce((acc, curr) => acc + curr, 0)
  const avg = total / sales.length
  const min = Math.min(...sales)
  const max = Math.max(...sales)
  return {
    total,
    avg,
    min,
    max,
    count: sales.length
  }
})

// Chart.js data configuration
const chartConfig = computed(() => {
  if (!chartDataSeries.value.length) {
    return { labels: [], datasets: [] }
  }

  return {
    labels: chartDataSeries.value.map(d => d.date),
    datasets: [
      {
        label: 'Penjualan Historis ($)',
        data: chartDataSeries.value.map(d => d.sales),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        fill: true,
        tension: 0.2,
        pointRadius: chartDataSeries.value.length > 180 ? 0 : 2.5,
        pointHoverRadius: 6,
        borderWidth: 2
      }
    ]
  }
})

// Search & Pagination for table
const filteredTableData = computed(() => {
  let list = tableRecords.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(item =>
      item.date.includes(q) || item.day_name.toLowerCase().includes(q)
    )
  }
  return list
})

const totalPages = computed(() => {
  return Math.ceil(filteredTableData.value.length / pageSize.value) || 1
})

const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTableData.value.slice(start, start + pageSize.value)
})

watch(searchQuery, () => {
  currentPage.value = 1
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Data Historis Penjualan</h1>
        <p class="text-sm text-slate-500 mt-1">
          Eksplorasi riwayat transaksi penjualan harian dari dataset Store Sales Kaggle.
        </p>
      </div>
      <div class="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-xl">
        Total Tersedia: <span class="font-bold text-slate-800">{{ totalOverallRecords }} hari</span>
      </div>
    </div>

    <!-- Filter Bar Card -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <!-- Preset Buttons -->
        <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span class="text-xs font-semibold text-slate-500 mr-2 flex items-center">
            <Filter class="w-3.5 h-3.5 mr-1" /> Periode:
          </span>
          <button
            v-for="p in [
              { id: '30d', label: '30 Hari' },
              { id: '90d', label: '90 Hari' },
              { id: '180d', label: '180 Hari' },
              { id: '1y', label: '1 Tahun' },
              { id: 'all', label: 'Semua Data' }
            ]"
            :key="p.id"
            @click="selectPreset(p.id)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
            :class="[
              activePreset === p.id && !startDateInput && !endDateInput
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- Custom Date Range -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center space-x-1 text-xs">
            <label class="text-slate-500 font-medium">Dari:</label>
            <input
              type="date"
              v-model="startDateInput"
              class="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div class="flex items-center space-x-1 text-xs">
            <label class="text-slate-500 font-medium">Sampai:</label>
            <input
              type="date"
              v-model="endDateInput"
              class="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            @click="applyCustomDateFilter"
            class="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Terapkan
          </button>
          <button
            v-if="startDateInput || endDateInput || activePreset !== '90d'"
            @click="resetFilter"
            class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
            title="Reset Filter"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Quick Summary strip for active period -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-slate-500 font-medium">Total Periode Ini</p>
          <p class="text-sm font-bold text-slate-900 mt-0.5">{{ formatCompactCurrency(periodStats.total) }}</p>
        </div>
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-slate-500 font-medium">Rata-rata Harian</p>
          <p class="text-sm font-bold text-slate-900 mt-0.5">{{ formatCurrency(periodStats.avg) }}</p>
        </div>
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-slate-500 font-medium">Penjualan Tertinggi</p>
          <p class="text-sm font-bold text-emerald-600 mt-0.5">{{ formatCurrency(periodStats.max) }}</p>
        </div>
        <div class="p-3 bg-slate-50 rounded-xl">
          <p class="text-slate-500 font-medium">Rentang Data</p>
          <p class="text-sm font-bold text-indigo-600 mt-0.5">{{ periodStats.count }} Hari</p>
        </div>
      </div>
    </div>

    <!-- Historical Chart -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">Grafik Penjualan Harian</h2>
          <p class="text-xs text-slate-500">Visualisasi fluktuasi penjualan harian pada rentang waktu yang dipilih</p>
        </div>
        <div class="text-xs text-slate-600 font-medium">
          Satuan: USD ($)
        </div>
      </div>

      <div v-if="loading" class="h-80 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw class="w-7 h-7 animate-spin mb-2 text-indigo-500" />
        <p class="text-xs">Memuat data grafik penjualan...</p>
      </div>

      <div v-else-if="!chartDataSeries.length" class="h-80 flex flex-col items-center justify-center text-slate-400">
        <p class="text-sm">Tidak ada data ditemukan untuk rentang tanggal tersebut.</p>
      </div>

      <div v-else>
        <SalesChart :data="chartConfig" :height="340" />
      </div>
    </div>

    <!-- Historical Data Table -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <!-- Table Header & Search -->
      <div class="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-900">Tabel Data Historis</h2>
          <p class="text-xs text-slate-500">Rincian penjualan harian diurutkan dari tanggal terbaru</p>
        </div>

        <div class="flex items-center space-x-2">
          <div class="relative w-full sm:w-64">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Cari tanggal atau hari..."
              class="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            v-model="pageSize"
            class="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
          >
            <option :value="10">10 / hal</option>
            <option :value="15">15 / hal</option>
            <option :value="25">25 / hal</option>
            <option :value="50">50 / hal</option>
          </select>
        </div>
      </div>

      <!-- Table Body -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-100">
            <tr>
              <th class="px-5 py-3">Tanggal</th>
              <th class="px-5 py-3">Hari</th>
              <th class="px-5 py-3">Penjualan (USD)</th>
              <th class="px-5 py-3">Status vs Rata-Rata Periode</th>
              <th class="px-5 py-3 text-right">Format Lengkap</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr
              v-for="(row, idx) in paginatedTableData"
              :key="row.date"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <td class="px-5 py-3 font-semibold text-slate-900 font-mono">
                {{ row.date }}
              </td>
              <td class="px-5 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded-md font-medium text-slate-700 bg-slate-100">
                  {{ row.day_name }}
                </span>
              </td>
              <td class="px-5 py-3 font-bold text-slate-900">
                {{ formatCurrency(row.sales) }}
              </td>
              <td class="px-5 py-3">
                <span
                  v-if="row.sales >= periodStats.avg"
                  class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <TrendingUp class="w-3 h-3" />
                  <span>Di Atas Rata-rata</span>
                </span>
                <span
                  v-else
                  class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                >
                  <TrendingDown class="w-3 h-3" />
                  <span>Di Bawah Rata-rata</span>
                </span>
              </td>
              <td class="px-5 py-3 text-right text-slate-500">
                {{ formatDateIndo(row.date) }}
              </td>
            </tr>

            <tr v-if="!paginatedTableData.length">
              <td colspan="5" class="px-5 py-8 text-center text-slate-400">
                Tidak ada data yang sesuai dengan pencarian.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Menampilkan
          <span class="font-bold text-slate-800">{{ (currentPage - 1) * pageSize + 1 }}</span>
          hingga
          <span class="font-bold text-slate-800">{{ Math.min(currentPage * pageSize, filteredTableData.length) }}</span>
          dari
          <span class="font-bold text-slate-800">{{ filteredTableData.length }}</span> data
        </div>

        <div class="flex items-center space-x-1.5">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="px-3 py-1 font-semibold text-slate-800">
            Hal {{ currentPage }} dari {{ totalPages }}
          </span>
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

