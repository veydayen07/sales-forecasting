<script setup>
import { ref, onMounted, computed } from 'vue'
import { getEvaluationMetrics, formatCurrency } from '@/services/api'
import SalesChart from '@/components/SalesChart.vue'
import MetricCard from '@/components/MetricCard.vue'
import {
  Award,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  Layers,
  Cpu,
  BarChart2,
  BookOpen
} from 'lucide-vue-next'

const loading = ref(true)
const evaluationData = ref(null)

async function fetchEvaluation() {
  loading.value = true
  try {
    const res = await getEvaluationMetrics()
    evaluationData.value = res.evaluation
  } catch (err) {
    console.error('Error fetching evaluation:', err)
  } finally {
    loading.value = false
  }
}

// Chart.js Bar comparison between Random Forest and Baseline
const comparisonChartConfig = computed(() => {
  if (!evaluationData.value?.models?.length) {
    return { labels: [], datasets: [] }
  }

  const models = evaluationData.value.models
  const labels = models.map(m => m.model_name)
  const maeValues = models.map(m => m.mae)
  const rmseValues = models.map(m => m.rmse)

  return {
    labels,
    datasets: [
      {
        label: 'MAE (Mean Absolute Error) ($)',
        data: maeValues,
        backgroundColor: '#6366f1', // Indigo
        borderRadius: 8,
        borderWidth: 0
      },
      {
        label: 'RMSE (Root Mean Squared Error) ($)',
        data: rmseValues,
        backgroundColor: '#3b82f6', // Blue
        borderRadius: 8,
        borderWidth: 0
      }
    ]
  }
})

// Calculate improvement percentages
const improvements = computed(() => {
  if (!evaluationData.value?.models || evaluationData.value.models.length < 2) {
    return null
  }
  const rf = evaluationData.value.models.find(m => m.model_name.toLowerCase().includes('random forest'))
  const baseline = evaluationData.value.models.find(m => m.model_name.toLowerCase().includes('baseline'))

  if (!rf || !baseline) return null

  const maeImp = ((baseline.mae - rf.mae) / baseline.mae) * 100
  const rmseImp = ((baseline.rmse - rf.rmse) / baseline.rmse) * 100
  const wapeImp = ((baseline.wape - rf.wape) / baseline.wape) * 100

  return {
    mae: maeImp.toFixed(2),
    rmse: rmseImp.toFixed(2),
    wape: wapeImp.toFixed(2)
  }
})

onMounted(() => {
  fetchEvaluation()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Evaluasi Performa Model ML</h1>
        <p class="text-sm text-slate-500 mt-1">
          Hasil evaluasi eksperimen Google Colab untuk algoritma Random Forest Regressor pada dataset Store Sales.
        </p>
      </div>
      <div class="inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
        <ShieldCheck class="w-4 h-4 text-emerald-600" />
        <span>Tervalidasi Google Colab</span>
      </div>
    </div>

    <!-- 3 Core PRD Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5" v-if="evaluationData?.rf">
      <!-- 1. MAE -->
      <MetricCard
        title="MAE (Mean Absolute Error)"
        :value="formatCurrency(evaluationData.rf.mae)"
        subtitle="Rata-rata selisih mutlak prediksi vs aktual"
        :badge-text="improvements ? `Lebih baik +${improvements.mae}%` : 'Akurat'"
        badge-type="positive"
        color-scheme="indigo"
      >
        <template #icon>
          <BarChart2 class="w-6 h-6" />
        </template>
      </MetricCard>

      <!-- 2. RMSE -->
      <MetricCard
        title="RMSE (Root Mean Squared Error)"
        :value="formatCurrency(evaluationData.rf.rmse)"
        subtitle="Bobot kesalahan terhadap fluktuasi ekstrem"
        :badge-text="improvements ? `Lebih baik +${improvements.rmse}%` : 'Stabil'"
        badge-type="positive"
        color-scheme="blue"
      >
        <template #icon>
          <TrendingDown class="w-6 h-6" />
        </template>
      </MetricCard>

      <!-- 3. WAPE -->
      <MetricCard
        title="WAPE (Weighted Error %)"
        :value="`${evaluationData.rf.wape}%`"
        subtitle="Tingkat akurasi model mencapai ~93.15%"
        badge-text="Akurasi > 93%"
        badge-type="positive"
        color-scheme="emerald"
      >
        <template #icon>
          <Award class="w-6 h-6" />
        </template>
      </MetricCard>
    </div>

    <!-- Comparison Section: Chart & Table -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Comparative Chart -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div class="pb-4 border-b border-slate-100 mb-4">
          <h2 class="text-base font-bold text-slate-900">Perbandingan Model vs Baseline</h2>
          <p class="text-xs text-slate-500">
            Perbandingan nilai error (MAE & RMSE) antara model Random Forest dengan metode Baseline (7 hari terakhir). Nilai lebih rendah menunjukkan model lebih akurat.
          </p>
        </div>

        <div class="h-72">
          <SalesChart
            type="bar"
            :data="comparisonChartConfig"
            :options="{
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
                  }
                }
              }
            }"
            :height="280"
          />
        </div>
      </div>

      <!-- Comparative Table & Improvement summary -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <div class="pb-4 border-b border-slate-100 mb-4">
            <h2 class="text-base font-bold text-slate-900">Tabel Rincian Evaluasi Metrik</h2>
            <p class="text-xs text-slate-500">Nilai riil dari file benchmark <span class="font-mono text-indigo-600">evaluation_metrics.csv</span></p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th class="px-4 py-3">Nama Model</th>
                  <th class="px-4 py-3">MAE ($)</th>
                  <th class="px-4 py-3">RMSE ($)</th>
                  <th class="px-4 py-3">WAPE (%)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700" v-if="evaluationData?.models">
                <tr
                  v-for="m in evaluationData.models"
                  :key="m.model_name"
                  :class="m.model_name.toLowerCase().includes('random forest') ? 'bg-indigo-50/40 font-semibold text-indigo-950' : ''"
                >
                  <td class="px-4 py-3.5 flex items-center space-x-2">
                    <span
                      class="w-2 h-2 rounded-full"
                      :class="m.model_name.toLowerCase().includes('random forest') ? 'bg-indigo-600' : 'bg-slate-400'"
                    ></span>
                    <span>{{ m.model_name }}</span>
                  </td>
                  <td class="px-4 py-3.5 font-mono">{{ formatCurrency(m.mae) }}</td>
                  <td class="px-4 py-3.5 font-mono">{{ formatCurrency(m.rmse) }}</td>
                  <td class="px-4 py-3.5 font-mono font-bold" :class="m.model_name.toLowerCase().includes('random forest') ? 'text-emerald-600' : ''">
                    {{ m.wape }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Improvement Box -->
        <div class="mt-4 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5" v-if="improvements">
          <p class="font-bold text-emerald-900 flex items-center space-x-1.5">
            <CheckCircle class="w-4 h-4 text-emerald-600" />
            <span>Keunggulan Model Random Forest terhadap Baseline:</span>
          </p>
          <p class="text-emerald-800">
            • Penurunan kesalahan rata-rata (MAE) sebesar <strong>{{ improvements.mae }}%</strong>.
          </p>
          <p class="text-emerald-800">
            • Penurunan lonjakan kesalahan ekstrem (RMSE) sebesar <strong>{{ improvements.rmse }}%</strong>.
          </p>
          <p class="text-emerald-800">
            • WAPE berhasil ditekan menjadi <strong>6.85%</strong>, membuktikan model sangat handal untuk perencanaan stok toko.
          </p>
        </div>
      </div>
    </div>

    <!-- Educational & Technical Architecture Guide -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div class="flex items-center space-x-2 pb-3 border-b border-slate-100">
        <BookOpen class="w-5 h-5 text-indigo-600" />
        <h2 class="text-base font-bold text-slate-900">Interpretasi Metrik untuk Perencanaan Operasional Toko</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
        <div class="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
          <p class="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span>Mean Absolute Error (MAE)</span>
          </p>
          <p class="leading-relaxed">
            Mengukur seberapa jauh rata-rata prediksi meleset dari penjualan riil. Nilai MAE sebesar $57,075 berarti estimasi harian rata-rata hanya memiliki deviasi wajar terhadap total volume toko harian.
          </p>
        </div>

        <div class="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
          <p class="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
            <span class="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Root Mean Squared Error (RMSE)</span>
          </p>
          <p class="leading-relaxed">
            Memberikan bobot lebih berat pada kesalahan besar (outlier). RMSE $79,545 menunjukkan model mampu mengantisipasi lonjakan akhir pekan atau promo musiman tanpa eror berlebihan.
          </p>
        </div>

        <div class="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
          <p class="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Weighted Absolute Percentage (WAPE)</span>
          </p>
          <p class="leading-relaxed">
            Rasio total deviasi terhadap total penjualan. Nilai 6.85% merupakan standar <em>industry grade</em> yang sangat baik (di bawah 10% dikategorikan sangat akurat untuk kebutuhan supply chain & inventaris).
          </p>
        </div>
      </div>

      <!-- Feature Engineering Context -->
      <div class="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-950 space-y-2 mt-4">
        <div class="flex items-center space-x-2 font-bold text-indigo-900">
          <Cpu class="w-4 h-4 text-indigo-600" />
          <span>Konfigurasi Model & Rekayasa Fitur (Google Colab)</span>
        </div>
        <p class="text-indigo-800 leading-relaxed">
          Model Random Forest Regressor dilatih menggunakan 11 fitur turunan:
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-slate-700">
          <div class="bg-white p-2 rounded-lg border border-indigo-100">
            <span class="font-bold text-indigo-600">Lag Penjualan:</span>
            <div class="text-[11px] mt-0.5">lag_1, lag_7, lag_14, lag_28</div>
          </div>
          <div class="bg-white p-2 rounded-lg border border-indigo-100">
            <span class="font-bold text-indigo-600">Rolling Mean:</span>
            <div class="text-[11px] mt-0.5">rolling_7, rolling_14, rolling_28</div>
          </div>
          <div class="bg-white p-2 rounded-lg border border-indigo-100">
            <span class="font-bold text-indigo-600">Fitur Kalender:</span>
            <div class="text-[11px] mt-0.5">year, month, day, dayofweek</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

