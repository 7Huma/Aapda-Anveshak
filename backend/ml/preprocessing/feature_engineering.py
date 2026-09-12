"""
preprocessing/feature_engineering.py
Landslide Risk Monitoring — Feature Engineering
SIH 26001

Creates interpretable, domain-informed features from raw sensor/survey data.

Feature philosophy:
  - All derived features are normalized to [0, 1] where possible
  - Each feature represents a meaningful physical/geomorphological risk factor
  - Interaction terms capture compound risk effects
  - No black-box transformations — every feature is explainable
"""

import logging
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Configuration — thresholds used for normalization
# These should match domain knowledge; adjust with real data.
# ──────────────────────────────────────────────────────────────
FEATURE_CONFIG = {
    # Rainfall above this (mm/day) is considered extreme
    "rainfall_saturation_mm": 300.0,
    # Slopes above this (degrees) are considered fully unstable
    "slope_saturation_deg": 60.0,
    # Historical landslide counts at/above this are considered maximally
    # susceptible. Fixed constant (not derived from the current batch) so
    # single-location, real-time inference normalizes the same way as
    # batch training. Chosen above the observed max in the training
    # sample (12) to leave headroom.
    "historical_count_saturation": 20.0,
    # Composite risk feature weights (must sum to 1.0)
    "composite_weights": {
        "rainfall_risk":            0.30,
        "soil_saturation":          0.25,
        "slope_risk":               0.25,
        "terrain_risk":             0.10,
        "historical_susceptibility": 0.10,
    },
}

# Columns that must exist in the DataFrame before engineering
REQUIRED_INPUT_COLS = [
    "rainfall_mm",
    "soil_moisture",
    "slope_degree",
    "terrain_roughness",
    "historical_landslide_count",
]

# All feature columns produced by this module
ENGINEERED_FEATURE_COLS = [
    "rainfall_risk",
    "soil_saturation",
    "slope_risk",
    "terrain_risk",
    "historical_susceptibility",
    "rainfall_soil_interaction",
    "slope_terrain_interaction",
    "composite_risk",
]


def engineer_features(
    df: pd.DataFrame,
    config: Optional[dict] = None,
    verbose: bool = True,
) -> pd.DataFrame:
    """
    Create all engineered features from the cleaned DataFrame.

    Parameters
    ----------
    df      : Cleaned DataFrame (output of clean_data()).
    config  : Optional override for FEATURE_CONFIG values.
    verbose : Log feature summary if True.

    Returns
    -------
    pd.DataFrame with additional feature columns appended.
    """
    df = df.copy()
    cfg = {**FEATURE_CONFIG, **(config or {})}

    _check_required_cols(df)

    # ── Individual risk components ─────────────────────────
    df["rainfall_risk"] = _rainfall_risk(df["rainfall_mm"], cfg["rainfall_saturation_mm"])
    df["soil_saturation"] = _soil_saturation(df["soil_moisture"])
    df["slope_risk"] = _slope_risk(df["slope_degree"], cfg["slope_saturation_deg"])
    df["terrain_risk"] = _terrain_risk(df["terrain_roughness"])
    df["historical_susceptibility"] = _historical_susceptibility(
        df["historical_landslide_count"],
        cfg["historical_count_saturation"],
    )

    # ── Interaction features ───────────────────────────────
    df["rainfall_soil_interaction"] = (
        df["rainfall_risk"] * df["soil_saturation"]
    )
    df["slope_terrain_interaction"] = (
        df["slope_risk"] * df["terrain_risk"]
    )

    # ── Composite risk score (weighted sum) ────────────────
    weights = cfg["composite_weights"]
    df["composite_risk"] = (
        weights["rainfall_risk"]            * df["rainfall_risk"]
        + weights["soil_saturation"]          * df["soil_saturation"]
        + weights["slope_risk"]               * df["slope_risk"]
        + weights["terrain_risk"]             * df["terrain_risk"]
        + weights["historical_susceptibility"]* df["historical_susceptibility"]
    ).clip(0.0, 1.0)

    if verbose:
        logger.info("Feature engineering complete. Added %d features:", len(ENGINEERED_FEATURE_COLS))
        for col in ENGINEERED_FEATURE_COLS:
            logger.info(
                "  %-35s  mean=%.3f  std=%.3f  min=%.3f  max=%.3f",
                col,
                df[col].mean(),
                df[col].std(),
                df[col].min(),
                df[col].max(),
            )

    return df


def get_feature_columns() -> list[str]:
    """
    Return the list of feature column names used for model training.

    The backend/model code should call this to know which columns
    to pass to the model, ensuring consistency between training and inference.
    """
    return ENGINEERED_FEATURE_COLS.copy()


# ──────────────────────────────────────────────────────────────
# Individual feature transformers
# ──────────────────────────────────────────────────────────────

def _rainfall_risk(rainfall_mm: pd.Series, saturation_mm: float) -> pd.Series:
    """
    Normalize rainfall to [0, 1].
    Interpretation: 0 = no rain, 1 = extreme rainfall (≥ saturation_mm).
    
    Physical basis: Heavy continuous rainfall saturates soil and triggers slides.
    """
    return (rainfall_mm / saturation_mm).clip(0.0, 1.0)


def _soil_saturation(soil_moisture: pd.Series) -> pd.Series:
    """
    Normalize soil moisture percentage to [0, 1].
    Interpretation: 0 = bone dry, 1 = fully saturated.
    
    Physical basis: Saturated soil has no more pore space → pore water pressure rises.
    """
    return (soil_moisture / 100.0).clip(0.0, 1.0)


def _slope_risk(slope_degree: pd.Series, saturation_deg: float) -> pd.Series:
    """
    Normalize slope angle to [0, 1].
    Interpretation: 0 = flat, 1 = extremely steep slope (≥ saturation_deg).
    
    Physical basis: Gravitational stress on slope material increases with angle.
    """
    return (slope_degree / saturation_deg).clip(0.0, 1.0)


def _terrain_risk(terrain_roughness: pd.Series) -> pd.Series:
    """
    Terrain roughness is already [0, 1] — pass through.
    Interpretation: 0 = smooth/flat, 1 = highly irregular terrain.
    
    Physical basis: Irregular terrain concentrates water flow and stress.
    """
    return terrain_roughness.clip(0.0, 1.0)


def _historical_susceptibility(
    historical_count: pd.Series,
    saturation_count: float,
) -> pd.Series:
    """
    Normalize historical landslide count using log-scaling to [0, 1].
    Interpretation: 0 = no history, 1 = very high historical frequency.

    Log scaling avoids extreme locations dominating. Past landslides indicate
    vulnerable geology, soil type, and topography.

    BUGFIX (SIH-26001 backlog item #1): this previously normalized each row
    against the max of the *current batch* (`historical_count.max()`).
    That's fine during training (large batches), but at real-time inference
    the backend predicts one location at a time, so the batch max was
    always equal to that single row's own value — collapsing the score to
    1.0 for any location with history at all, regardless of how much.
    Normalizing against a fixed `saturation_count` instead makes the score
    consistent whether you're scoring 1,000 training rows or 1 live location.
    """
    log_series = np.log1p(historical_count.clip(lower=0))
    max_log = np.log1p(saturation_count)
    if max_log == 0:
        return pd.Series(np.zeros(len(historical_count)), index=historical_count.index)
    return (log_series / max_log).clip(0.0, 1.0)


def _check_required_cols(df: pd.DataFrame) -> None:
    missing = [c for c in REQUIRED_INPUT_COLS if c not in df.columns]
    if missing:
        raise ValueError(
            f"Feature engineering requires columns: {missing}\n"
            f"Run clean_data() first or check input schema."
        )