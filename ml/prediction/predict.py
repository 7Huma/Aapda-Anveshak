"""
prediction/predict.py
Landslide Risk Monitoring — Backend-Facing Prediction API
SIH 26001

This module is the primary integration point for the backend developer.

Usage:
    from ml.prediction.predict import predict_risk, load_model

    model = load_model()                # Load once at server startup
    result = predict_risk(input_data, model=model)

Input format:
    {
        "location_id": 101,
        "rainfall_mm": 180.0,
        "soil_moisture": 82.0,
        "slope_degree": 42.0,
        "elevation_m": 1200.0,
        "terrain_roughness": 0.7,
        "historical_landslide_count": 8
    }

Output format:
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
"""

import logging
from typing import Any, Optional, Union

import numpy as np
import pandas as pd

from ml.models.landslide_model import load_model as _load_model
from ml.preprocessing.feature_engineering import (
    engineer_features,
    get_feature_columns,
    FEATURE_CONFIG,
)
from ml.preprocessing.feature_engineering import (
    _rainfall_risk,
    _soil_saturation,
    _slope_risk,
    _terrain_risk,
    _historical_susceptibility,
)

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Risk thresholds — SINGLE source of truth
# Change here and it propagates everywhere
# ──────────────────────────────────────────────────────────────
RISK_THRESHOLDS: dict[str, tuple[int, int]] = {
    "LOW":      (0,  24),
    "MEDIUM":   (25, 49),
    "HIGH":     (50, 74),
    "CRITICAL": (75, 100),
}

# Required input fields (elevation_m is optional — accepted but not used directly)
REQUIRED_INPUT_FIELDS = [
    "rainfall_mm",
    "soil_moisture",
    "slope_degree",
    "terrain_roughness",
    "historical_landslide_count",
]


# ──────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────

def load_model(model_dir=None, model_name: str = "landslide_model"):
    """
    Load the trained model. Call this ONCE at server startup.

    Returns
    -------
    model : Fitted sklearn pipeline ready for inference.
    """
    return _load_model(model_dir=model_dir, model_name=model_name)


def predict_risk(
    input_data: dict,
    model: Optional[Any] = None,
) -> dict:
    """
    Predict landslide risk for a single location.

    Parameters
    ----------
    input_data : dict
        Must contain the required fields listed in REQUIRED_INPUT_FIELDS.
        Optional: location_id, elevation_m (passed through to output).
    model : pre-loaded model (optional — will load from disk if None).

    Returns
    -------
    dict containing:
        location_id    : int    (echoed from input, -1 if not provided)
        risk_score     : int    (0–100)
        risk_level     : str    ("LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
        confidence     : float  (0.0–1.0, 4 decimal places)
        risk_factors   : dict   (individual component scores)

    Raises
    ------
    ValueError
        If required input fields are missing.
    FileNotFoundError
        If model file is not found and no model was passed.
    """
    _validate_input(input_data)

    if model is None:
        logger.info("No model passed — loading from disk.")
        model = load_model()

    # ── Build single-row DataFrame ──────────────────────────
    df = _input_to_dataframe(input_data)

    # ── Engineer features ───────────────────────────────────
    df = engineer_features(df, verbose=False)

    # ── Predict probability ─────────────────────────────────
    feature_cols = get_feature_columns()
    X = df[feature_cols].values.astype(np.float32)
    probability = float(model.predict_proba(X)[0][1])

    # ── Convert to risk score and level ────────────────────
    risk_score = probability_to_risk_score(probability)
    risk_level = risk_score_to_level(risk_score)
    confidence = round(probability, 4)

    # ── Extract individual risk factors for explainability ──
    risk_factors = _extract_risk_factors(df)

    result = {
        "location_id":  input_data.get("location_id", -1),
        "risk_score":   risk_score,
        "risk_level":   risk_level,
        "confidence":   confidence,
        "risk_factors": risk_factors,
    }

    logger.info(
        "Prediction — location_id=%s | score=%d | level=%s | confidence=%.4f",
        result["location_id"], risk_score, risk_level, confidence,
    )
    return result


def predict_batch(
    records: list[dict],
    model: Optional[Any] = None,
) -> list[dict]:
    """
    Predict landslide risk for multiple locations.

    Parameters
    ----------
    records : List of input dicts (same schema as predict_risk).
    model   : Pre-loaded model (loaded once if None).

    Returns
    -------
    List of prediction result dicts, in the same order as input.
    """
    if not records:
        return []

    if model is None:
        model = load_model()

    results = []
    for i, record in enumerate(records):
        try:
            result = predict_risk(record, model=model)
            results.append(result)
        except (ValueError, KeyError) as e:
            logger.error("Error processing record %d (location_id=%s): %s",
                         i, record.get("location_id", "?"), e)
            results.append({
                "location_id": record.get("location_id", -1),
                "error": str(e),
            })

    return results


def probability_to_risk_score(probability: float) -> int:
    """Convert raw model probability [0,1] to integer risk score [0,100]."""
    return int(round(probability * 100))


def risk_score_to_level(risk_score: int) -> str:
    """
    Map integer risk score [0,100] to risk level string.

    Thresholds come from RISK_THRESHOLDS (single source of truth).
    """
    for level, (lo, hi) in RISK_THRESHOLDS.items():
        if lo <= risk_score <= hi:
            return level
    # Fallback (should not happen for valid scores)
    return "CRITICAL" if risk_score > 74 else "LOW"


# ──────────────────────────────────────────────────────────────
# Private helpers
# ──────────────────────────────────────────────────────────────

def _validate_input(data: dict) -> None:
    """Check that all required fields are present and non-null."""
    missing = [f for f in REQUIRED_INPUT_FIELDS if f not in data]
    if missing:
        raise ValueError(
            f"Missing required input fields: {missing}\n"
            f"Required fields: {REQUIRED_INPUT_FIELDS}"
        )
    # Check for None/NaN
    null_fields = [
        f for f in REQUIRED_INPUT_FIELDS
        if data.get(f) is None or (isinstance(data[f], float) and np.isnan(data[f]))
    ]
    if null_fields:
        raise ValueError(f"Input fields contain null/NaN values: {null_fields}")


def _input_to_dataframe(data: dict) -> pd.DataFrame:
    """Convert a single input dict to a 1-row DataFrame."""
    row = {
        "location_id":               data.get("location_id", -1),
        "latitude":                  data.get("latitude", 26.0),  # NER centroid default
        "longitude":                 data.get("longitude", 92.0),
        "rainfall_mm":               float(data["rainfall_mm"]),
        "soil_moisture":             float(data["soil_moisture"]),
        "slope_degree":              float(data["slope_degree"]),
        "elevation_m":               float(data.get("elevation_m", 500.0)),
        "terrain_roughness":         float(data["terrain_roughness"]),
        "historical_landslide_count": int(data["historical_landslide_count"]),
        "landslide_occurred":        0,  # placeholder (not used at inference)
    }
    return pd.DataFrame([row])


def _extract_risk_factors(df: pd.DataFrame) -> dict:
    """Extract individual risk component values from feature-engineered row."""
    row = df.iloc[0]
    factor_cols = [
        "rainfall_risk",
        "soil_saturation",
        "slope_risk",
        "terrain_risk",
        "historical_susceptibility",
        "rainfall_soil_interaction",
        "slope_terrain_interaction",
        "composite_risk",
    ]
    return {
        col: round(float(row[col]), 4)
        for col in factor_cols
        if col in df.columns
    }
