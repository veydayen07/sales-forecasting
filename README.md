# Sales Forecasting Dashboard

Aplikasi web modern untuk menampilkan data historis penjualan dan memprediksi total penjualan harian selama 30 hari ke depan menggunakan model Machine Learning **Random Forest Regressor** (`.joblib`) yang dilatih pada dataset **Store Sales - Time Series Forecasting** (Kaggle).

Aplikasi dibangun sesuai dengan Product Requirement Document (PRD) menggunakan **Vue.js 3**, **Vite**, **Tailwind CSS**, dan **Chart.js** untuk Frontend, serta **Python FastAPI** untuk Backend.

---

## 🌟 Fitur Utama

### 1. Dashboard
- **Ringkasan KPI Utama**:
  - Total penjualan historis akumulatif
  - Rata-rata penjualan harian
  - Perkiraan total penjualan 30 hari ke depan
  - Tanggal terakhir data historis
- **Visualisasi Overview**:
  - Grafik gabungan tren historis aktual yang tersambung langsung dengan proyeksi model 30 hari ke depan.

### 2. Historical Sales
- **Grafik Interaktif Chart.js**: Visualisasi fluktuasi penjualan harian.
- **Filter Fleksibel**:
  - Filter preset cepat: *30 Hari*, *90 Hari*, *180 Hari*, *1 Tahun*, dan *Semua Data*.
  - Pemilihan rentang tanggal kustom (*Start Date* s/d *End Date*).
- **Tabel Data Historis**: Dilengkapi fitur pencarian tanggal/hari, indikator status deviasi penjualan harian terhadap rata-rata, dan paginasi.

### 3. Sales Forecasting
- **Inferensi Rekursif**: Tombol **Generate Forecast** untuk mengeksekusi model Random Forest (`rf_sales_forecast.joblib`) secara rekursif berbasis lag dan rolling features.
- **Grafik Prediksi 30 Hari**: Visualisasi proyeksi harian dengan highlight hari kerja dan akhir pekan.
- **Tabel Hasil Prediksi**: Rincian hari ke-1 s/d hari ke-30, tanggal, hari, estimasi penjualan, dan perubahan *Day-over-Day* (%).
- **Ekspor Data**: Tombol **Download CSV** untuk mengunduh hasil prediksi langsung ke komputer.

### 4. Model Evaluation
- **Metrik Performa Model**:
  - **MAE** (*Mean Absolute Error*): `57,075.73`
  - **RMSE** (*Root Mean Squared Error*): `79,545.34`
  - **WAPE** (*Weighted Absolute Percentage Error*): `6.85%` (Akurasi > 93%)
- **Benchmark vs Baseline**: Perbandingan visual diagram batang (Bar Chart) dan tabel terhadap model Baseline (7 hari terakhir).
- **Panduan Operasional**: Penjelasan makna setiap metrik bagi pemilik toko dan tim perencana stok inventaris.

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|---|---|
| **Frontend Framework** | Vue.js 3 (Composition API) |
| **Build Tool** | Vite |
| **CSS & Styling** | Tailwind CSS v4 |
| **Data Visualization** | Chart.js |
| **Icons** | Lucide Icons (`lucide-vue-next`) |
| **Backend Framework** | Python FastAPI & Uvicorn |
| **Machine Learning** | Scikit-learn (Random Forest Regressor) |
| **Model Persistence** | Joblib (`rf_sales_forecast.joblib`) |
| **Data Processing** | Pandas, NumPy |

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Menjalankan Backend (FastAPI)

Buka terminal dan arahkan ke direktori backend:

```bash
cd sales-forecasting/backend
```

Aktifkan virtual environment dan jalankan server FastAPI:

```bash
# Windows
.venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

Backend API akan berjalan di: `http://localhost:8000`  
Dokumentasi Swagger API: `http://localhost:8000/docs`

---

### 2. Menjalankan Frontend (Vue.js 3 + Vite)

Buka terminal baru dan arahkan ke direktori frontend:

```bash
cd sales-forecasting/frontend/sales-forecasting-fe
```

Jalankan Vite dev server:

```bash
npm run dev
```

Buka browser dan akses: `http://localhost:5173`
