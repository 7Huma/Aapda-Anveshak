# Landslide Risk Monitoring — AI/ML Module

> **Project:** SIH 26001 — AI-Based Early Warning and Landslide Risk Monitoring System for the North Eastern Region (NER)  
> **Module:** AI / ML + Data Pipeline  
> **Branch:** `ml-dev`

---

## ⚠️ Data Disclaimer

> **IMPORTANT:** The dataset in `ml/datasets/sample/` is **synthetically generated demo data** for MVP/hackathon demonstration purposes only.  
> It does **NOT** represent real IMD, ISRO, NASA, or NER historical landslide records.  
> For real-world deployment, this must be replaced or supplemented with authoritative data from:  
> - **IMD** (India Meteorological Department) for rainfall  
> - **ISRO Bhuvan / NASA SRTM** for DEM/slope/elevation  
> - **GSI** (Geological Survey of India) for historical landslide inventory  
> - **In-situ sensors** for real-time soil moisture  

---

## 📁 Module Structure

```
ml/
├── datasets/
│   ├── raw/           # Place raw authoritative data here (gitignored for large files)
│   ├── processed/     # Cleaned & feature-engineered data (gitignored for large files)
│   └── sample/        # Synthetic demo dataset (committed for development)
│
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   ├── 02_data_cleaning.ipynb
│   └── 03_model_training.ipynb
│
├── preprocessing/
│   ├── __init__.py
│   ├── cleaning.py          # Data loading, cleaning, validation
│   └── feature_engineering.py  # Feature creation and transformation
│
├── models/
│   ├── __init__.py
│   ├── landslide_model.py   # Model training, evaluation, saving
│   └── saved/               # Saved model artifacts (gitignored)
│
├── prediction/
│   ├── __init__.py
│   └── predict.py           # Backend-facing prediction API
│
├── pipeline/
│   ├── __init__.py
│   └── run_pipeline.py      # End-to-end runnable pipeline
│
├── README.md
└── requirements.txt
```

---

## 📊 Dataset Schema

| Column | Type | Description |
|--------|------|-------------|
| `location_id` | int | Unique location identifier |
| `latitude` | float | Latitude (24.0–29.5 for NER) |
| `longitude` | float | Longitude (88.0–97.5 for NER) |
| `rainfall_mm` | float | Rainfall in mm (24h or event-based) |
| `soil_moisture` | float | Soil moisture % (0–100) |
| `slope_degree` | float | Slope angle in degrees (0–90) |
| `elevation_m` | float | Elevation above MSL in meters |
| `terrain_roughness` | float | Terrain roughness index (0–1) |
| `historical_landslide_count` | int | Historical landslide events at/near location |
| `landslide_occurred` | int | Target: 1 = landslide occurred, 0 = not occurred |

---

## 🔧 Engineered Features

| Feature | Formula / Logic | Purpose |
|---------|----------------|---------|
| `rainfall_risk` | rainfall_mm / 300 (capped at 1.0) | Rainfall contribution to risk |
| `soil_saturation` | soil_moisture / 100 | Soil wetness factor |
| `slope_risk` | slope_degree / 60 (capped at 1.0) | Slope instability factor |
| `terrain_risk` | terrain_roughness (already 0–1) | Surface irregularity factor |
| `historical_susceptibility` | log1p(count) / log1p(max_count) | Past landslide frequency factor |
| `rainfall_soil_interaction` | rainfall_risk × soil_saturation | Combined rainfall+moisture |
| `slope_terrain_interaction` | slope_risk × terrain_risk | Combined slope+terrain |
| `composite_risk` | weighted sum of above | Overall risk composite |

---

## 🤖 Model

| Property | Value |
|----------|-------|
| Algorithm | XGBoost (fallback: Random Forest) |
| Target | `landslide_occurred` (binary) |
| Output | Probability [0, 1] |
| Splitting | 80% train / 20% test, stratified |
| Random seed | 42 (reproducible) |

---

## 🚦 Risk Levels

| Risk Score (0–100) | Risk Level |
|--------------------|------------|
| 0 – 24 | 🟢 LOW |
| 25 – 49 | 🟡 MEDIUM |
| 50 – 74 | 🔴 HIGH |
| 75 – 100 | 🔴 CRITICAL |

Risk score = `round(probability × 100)`

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd sih-26001-landslide-risk-monitoring
pip install -r ml/requirements.txt
```

### 2. Run full pipeline (train + evaluate + predict demo)

```bash
python -m ml.pipeline.run_pipeline
```

### 3. Expected output

```
=== LANDSLIDE RISK MONITORING — ML PIPELINE ===
[STEP 1] Loading data...
[STEP 2] Cleaning data...
[STEP 3] Engineering features...
[STEP 4] Training model...
[STEP 5] Evaluating model...
  Accuracy:  0.87
  Precision: 0.85
  Recall:    0.89
  F1:        0.87
  ROC-AUC:   0.93
[STEP 6] Saving model...
[STEP 7] Running demo predictions...

DEMO PREDICTIONS:
{
  "location_id": 101,
  "risk_score": 91,
  "risk_level": "CRITICAL",
  "confidence": 0.91
}
```

---

## 🔌 Backend Integration

The backend developer needs to import only the prediction module:

```python
from ml.prediction.predict import predict_risk, load_model

# Load model once at startup
model = load_model()

# Call for each prediction request
result = predict_risk(input_data, model=model)
```

### Required Input Fields

```json
{
  "location_id": 101,
  "rainfall_mm": 180.0,
  "soil_moisture": 82.0,
  "slope_degree": 42.0,
  "elevation_m": 1200.0,
  "terrain_roughness": 0.7,
  "historical_landslide_count": 8
}
```

### Output JSON

```json
{
  "location_id": 101,
  "risk_score": 91,
  "risk_level": "CRITICAL",
  "confidence": 0.91,
  "risk_factors": {
    "rainfall_risk": 0.60,
    "soil_saturation": 0.82,
    "slope_risk": 0.70,
    "terrain_risk": 0.70,
    "historical_susceptibility": 0.75
  }
}
```

### Error Handling

The `predict_risk()` function raises:
- `ValueError` — if required input fields are missing
- `FileNotFoundError` — if model file is not found (run pipeline first)

---

## 🏋️ Training Instructions

```bash
# Full pipeline (recommended)
python -m ml.pipeline.run_pipeline

# Or use notebooks for step-by-step exploration
jupyter notebook ml/notebooks/
```

---

## ⚠️ Limitations

1. **Synthetic data** — model trained on demo data, not real NER observations
2. **No real-time integration** — rainfall/soil moisture must be supplied externally
3. **Static features** — no temporal/sequence modeling yet
4. **No spatial autocorrelation** — neighbor effects not modeled
5. **Binary target** — multi-class severity not modeled

---

## 🗺️ Future Integrations

- Connect IMD API for real-time rainfall
- Integrate ISRO Bhuvan DEM for slope/elevation
- Add GSI landslide inventory as historical data
- Deploy model via FastAPI endpoint
- Add SHAP explainability

---

*Module maintained by AI/ML + Data team — SIH 26001*
