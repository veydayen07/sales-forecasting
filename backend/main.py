
from pathlib import Path

import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


# ==========================================
# 1. CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"

MODEL_PATH = MODEL_DIR / "rf_sales_forecast.joblib"
HISTORY_PATH = MODEL_DIR / "daily_sales_history.csv"


# ==========================================
# 2. INITIALIZE FASTAPI
# ==========================================

app = FastAPI(
    title="Sales Forecasting API",
    description="Sales Forecasting using Random Forest",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 3. LOAD MODEL
# ==========================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

model_bundle = joblib.load(MODEL_PATH)

model = model_bundle["model"]
FEATURES = model_bundle["features"]
LAGS = model_bundle["lags"]
WINDOWS = model_bundle["windows"]
HORIZON = model_bundle["horizon"]


# ==========================================
# 4. LOAD HISTORICAL SALES
# ==========================================

if not HISTORY_PATH.exists():
    raise FileNotFoundError(f"History not found: {HISTORY_PATH}")

history_df = pd.read_csv(
    HISTORY_PATH,
    parse_dates=["date"]
)

daily_sales = (
    history_df
    .set_index("date")["sales"]
    .sort_index()
)

# Follow the same missing-date handling as Colab
full_range = pd.date_range(
    start=daily_sales.index.min(),
    end=daily_sales.index.max(),
    freq="D"
)

daily_sales = daily_sales.reindex(
    full_range,
    fill_value=0.0
)

daily_sales.index.name = "date"
daily_sales = daily_sales.asfreq("D")


# ==========================================
# 5. FEATURE ENGINEERING
# ==========================================

def features_for_date(history, date):

    date = pd.Timestamp(date)

    row = {
        "year": date.year,
        "month": date.month,
        "day": date.day,
        "dayofweek": date.dayofweek,
    }

    for lag in LAGS:
        row[f"lag_{lag}"] = history.loc[
            date - pd.Timedelta(days=lag)
        ]

    for window in WINDOWS:
        row[f"rolling_mean_{window}"] = history.loc[
            date - pd.Timedelta(days=window):
            date - pd.Timedelta(days=1)
        ].mean()

    return pd.DataFrame([row])[FEATURES]


# ==========================================
# 6. RECURSIVE FORECASTING
# ==========================================

def generate_forecast(history, days):

    hist = history.copy()
    predictions = []

    for _ in range(days):

        next_date = hist.index[-1] + pd.Timedelta(days=1)

        X_next = features_for_date(
            hist,
            next_date
        )

        y_hat = float(
            model.predict(X_next)[0]
        )

        y_hat = max(y_hat, 0.0)

        # Prediction becomes history for the next day
        hist.loc[next_date] = y_hat

        predictions.append({
            "date": next_date.strftime("%Y-%m-%d"),
            "forecast_sales": round(y_hat, 2)
        })

    return predictions


# ==========================================
# 7. API ENDPOINTS
# ==========================================

@app.get("/")
def home():

    return {
        "message": "Sales Forecasting API is running",
        "model": "Random Forest Regressor",
        "forecast_horizon": HORIZON
    }


@app.get("/api/health")
def health():

    return {
        "status": "OK",
        "model_loaded": True,
        "history_records": len(daily_sales),
        "last_history_date": str(
            daily_sales.index[-1].date()
        )
    }


@app.get("/api/forecast")
def forecast():

    try:

        results = generate_forecast(
            daily_sales,
            HORIZON
        )

        return {
            "success": True,
            "historical_end_date": str(
                daily_sales.index[-1].date()
            ),
            "forecast_days": HORIZON,
            "predictions": results
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
