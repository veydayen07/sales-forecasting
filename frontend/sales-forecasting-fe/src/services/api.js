const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`)
  if (!response.ok) {
    throw new Error(`API health check failed with status: ${response.status}`)
  }
  return response.json()
}

export async function getDashboardSummary() {
  const response = await fetch(`${API_BASE_URL}/api/summary`)
  if (!response.ok) {
    throw new Error(`Failed to load dashboard summary: ${response.statusText}`)
  }
  return response.json()
}

export async function getHistoricalSales({
  preset = null,
  startDate = null,
  endDate = null,
  page = 1,
  pageSize = 50
} = {}) {
  const params = new URLSearchParams()
  if (preset) params.append('preset', preset)
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)
  if (page) params.append('page', page)
  if (pageSize) params.append('page_size', pageSize)

  const url = `${API_BASE_URL}/api/history?${params.toString()}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load historical data: ${response.statusText}`)
  }
  return response.json()
}

export async function runForecast(days = 30) {
  const response = await fetch(`${API_BASE_URL}/api/forecast?days=${days}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to run forecast: ${response.statusText}`)
  }
  return response.json()
}

export async function getEvaluationMetrics() {
  const response = await fetch(`${API_BASE_URL}/api/evaluation`)
  if (!response.ok) {
    throw new Error(`Failed to load evaluation metrics: ${response.statusText}`)
  }
  return response.json()
}

export function getForecastCsvDownloadUrl() {
  return `${API_BASE_URL}/api/forecast/csv`
}

export function downloadForecastCsvClient(predictions) {
  if (!predictions || !predictions.length) return

  const headers = ['date', 'day_name', 'forecast_sales', 'change_pct']
  const rows = predictions.map(p => [
    p.date,
    p.day_name,
    p.forecast_sales,
    p.change_pct !== undefined ? `${p.change_pct}%` : '0%'
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', 'forecast_penjualan_30_hari.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 2500)
}

export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export function formatCompactCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '$0'
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}k`
  }
  return formatCurrency(value)
}

export function formatDateIndo(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

