"""
pipeline/run_pipeline.py
Landslide Risk Monitoring — End-to-End ML Pipeline
SIH 26001

Run with:
    python -m ml.pipeline.run_pipeline

Steps:
    1. Load sample dataset
    2. Clean data
    3. Engineer features
    4. Train model
    5. Evaluate model
    6. Save model
    7. Run demo predictions
    8. Print risk results
"""

import json
import logging
import sys
from pathlib import Path

# ── Ensure repo root is on the Python path when running directly ──
_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from ml.preprocessing.cleaning import load_data, clean_data
from ml.preprocessing.feature_engineering import engineer_features, get_feature_columns
from ml.models.landslide_model import train_model, save_model
from ml.prediction.predict import predict_risk, load_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────
SAMPLE_DATA_PATH = _REPO_ROOT / "ml" / "datasets" / "sample" / "landslide_sample.csv"
MODEL_DIR = _REPO_ROOT / "ml" / "models" / "saved"

# ──────────────────────────────────────────────────────────────
# Demo prediction inputs
# ──────────────────────────────────────────────────────────────
DEMO_INPUTS = [
    {
        "location_id": 101,
        "rainfall_mm": 250.0,
        "soil_moisture": 90.0,
        "slope_degree": 48.0,
        "elevation_m": 1500.0,
        "terrain_roughness": 0.82,
        "historical_landslide_count": 12,
    },
    {
        "location_id": 102,
        "rainfall_mm": 50.0,
        "soil_moisture": 30.0,
        "slope_degree": 10.0,
        "elevation_m": 200.0,
        "terrain_roughness": 0.15,
        "historical_landslide_count": 0,
    },
    {
        "location_id": 103,
        "rainfall_mm": 150.0,
        "soil_moisture": 60.0,
        "slope_degree": 30.0,
        "elevation_m": 800.0,
        "terrain_roughness": 0.55,
        "historical_landslide_count": 4,
    },
    {
        "location_id": 104,
        "rainfall_mm": 380.0,
        "soil_moisture": 95.0,
        "slope_degree": 55.0,
        "elevation_m": 2000.0,
        "terrain_roughness": 0.92,
        "historical_landslide_count": 20,
    },
]


def run_pipeline(data_path: Path = SAMPLE_DATA_PATH) -> dict:
    """
    Execute the full ML pipeline.

    Parameters
    ----------
    data_path : Path to the input CSV dataset.

    Returns
    -------
    dict : Summary including metrics and demo predictions.
    """
    print("\n" + "=" * 65)
    print("  LANDSLIDE RISK MONITORING — AI/ML PIPELINE  ")
    print("  SIH 26001 | NER Landslide Early Warning System  ")
    print("=" * 65)
    print()

    # ── STEP 1: Load ────────────────────────────────────────
    _step("1", "Loading dataset")
    if not data_path.exists():
        logger.error("Dataset not found: %s", data_path)
        logger.error(
            "Run: python -m ml.datasets.generate_sample\n"
            "to generate the sample dataset first."
        )
        sys.exit(1)

    df_raw = load_data(data_path)
    print(f"  [OK] Loaded {len(df_raw)} rows from: {data_path.name}\n")

    # ── STEP 2: Clean ───────────────────────────────────────
    _step("2", "Cleaning data")
    df_clean = clean_data(df_raw, verbose=True)
    print(f"  [OK] Cleaned dataset: {len(df_clean)} rows\n")

    # ── STEP 3: Feature Engineering ─────────────────────────
    _step("3", "Engineering features")
    df_features = engineer_features(df_clean, verbose=True)
    feature_cols = get_feature_columns()
    print(f"  [OK] Created {len(feature_cols)} features: {feature_cols}\n")

    # ── STEP 4: Train ───────────────────────────────────────
    _step("4", "Training model")
    model, metrics = train_model(df_features)
    print("  [OK] Model trained successfully\n")

    # ── STEP 5: Evaluate ────────────────────────────────────
    _step("5", "Evaluation results")
    print(f"  Accuracy  : {metrics['accuracy']:.4f}")
    print(f"  Precision : {metrics['precision']:.4f}")
    print(f"  Recall    : {metrics['recall']:.4f}")
    print(f"  F1 Score  : {metrics['f1']:.4f}")
    print(f"  ROC-AUC   : {metrics['roc_auc']:.4f}")
    print(f"  Test size : {metrics['test_samples']} samples")
    if "feature_importance" in metrics:
        print("\n  Feature Importance (top 5):")
        for i, (feat, imp) in enumerate(list(metrics["feature_importance"].items())[:5]):
            print(f"    {i+1}. {feat:<35} {imp:.4f}")
    print()

    # ── STEP 6: Save ────────────────────────────────────────
    _step("6", "Saving model")
    model_path = save_model(model, metrics, model_dir=MODEL_DIR)
    print(f"  [OK] Model saved to: {model_path}\n")

    # ── STEP 7 & 8: Demo Predictions ────────────────────────
    _step("7", "Running demo predictions")
    print()
    print("  [DEMO] Predictions using synthetic scenario data - NOT real NER data")
    print("  " + "-" * 61)

    demo_results = []
    loaded_model = load_model(model_dir=MODEL_DIR)

    for inp in DEMO_INPUTS:
        result = predict_risk(inp, model=loaded_model)
        demo_results.append(result)

        level_icon = {"LOW": "[LOW]", "MEDIUM": "[MED]", "HIGH": "[HIGH]", "CRITICAL": "[!!!]"}.get(
            result["risk_level"], "[?]"
        )
        print(f"  Location {result['location_id']:>4} | "
              f"Score: {result['risk_score']:>3}/100 | "
              f"Level: {level_icon} {result['risk_level']:<8} | "
              f"Confidence: {result['confidence']:.4f}")
        print(f"    Input  -> rainfall={inp['rainfall_mm']}mm, "
              f"soil={inp['soil_moisture']}%, "
              f"slope={inp['slope_degree']} deg")
        print(f"    Factors -> "
              f"rain_risk={result['risk_factors'].get('rainfall_risk', 0):.2f}, "
              f"soil_sat={result['risk_factors'].get('soil_saturation', 0):.2f}, "
              f"slope_risk={result['risk_factors'].get('slope_risk', 0):.2f}, "
              f"composite={result['risk_factors'].get('composite_risk', 0):.2f}")

    print()
    print("  JSON output sample (location 101):")
    print("  " + json.dumps(demo_results[0], indent=4).replace("\n", "\n  "))

    print()
    print("=" * 65)
    print("  PIPELINE COMPLETE")
    print("=" * 65)
    print()
    print("  To run predictions from the backend, see:")
    print("  ml/prediction/predict.py")
    print()
    print("  To explore data interactively, open:")
    print("  ml/notebooks/01_data_exploration.ipynb")
    print()

    return {
        "metrics": metrics,
        "model_path": str(model_path),
        "demo_predictions": demo_results,
    }


def _step(n: str, label: str) -> None:
    print(f"[STEP {n}] {label}")
    print("-" * 65)


if __name__ == "__main__":
    run_pipeline()
