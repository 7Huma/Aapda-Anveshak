"""
preprocessing/cleaning.py
Landslide Risk Monitoring — Data Loading & Cleaning
SIH 26001

⚠️ DEMO/MVP NOTE:
The sample dataset in ml/datasets/sample/ is synthetically generated for
development and hackathon demonstration. For real-world deployment,
replace with authoritative data from IMD, ISRO, GSI, or in-situ sensors.
"""

import logging
from pathlib import Path
from typing import Optional, Tuple

import numpy as np
import pandas as pd

# ──────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Expected schema for validation
# ──────────────────────────────────────────────────────────────
REQUIRED_COLUMNS = [
    "location_id",
    "latitude",
    "longitude",
    "rainfall_mm",
    "soil_moisture",
    "slope_degree",
    "elevation_m",
    "terrain_roughness",
    "historical_landslide_count",
    "landslide_occurred",
]

# Valid numeric ranges — NER-centric bounds
COLUMN_RANGES = {
    "latitude":                  (24.0, 29.5),
    "longitude":                 (88.0, 97.5),
    "rainfall_mm":               (0.0, 1500.0),
    "soil_moisture":             (0.0, 100.0),
    "slope_degree":              (0.0, 90.0),
    "elevation_m":               (0.0, 7000.0),
    "terrain_roughness":         (0.0, 1.0),
    "historical_landslide_count":(0,   200),
    "landslide_occurred":        (0,   1),
}


# ──────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────

def load_data(filepath: str | Path) -> pd.DataFrame:
    """
    Load a CSV file into a DataFrame.

    Parameters
    ----------
    filepath : str | Path
        Absolute or relative path to the CSV file.

    Returns
    -------
    pd.DataFrame

    Raises
    ------
    FileNotFoundError
        If the file does not exist.
    ValueError
        If required columns are missing.
    """
    filepath = Path(filepath)
    if not filepath.exists():
        raise FileNotFoundError(f"Dataset not found: {filepath.resolve()}")

    logger.info("Loading data from: %s", filepath.resolve())
    df = pd.read_csv(filepath)
    logger.info("Loaded %d rows × %d columns", *df.shape)

    _validate_columns(df)
    return df


def clean_data(df: pd.DataFrame, *, verbose: bool = True) -> pd.DataFrame:
    """
    Run the complete cleaning pipeline on a raw DataFrame.

    Operations performed (in order):
    1. Drop duplicate rows
    2. Validate & fix data types
    3. Handle missing values (numeric imputation)
    4. Validate geographic coordinates
    5. Validate numeric ranges (clamp obviously wrong values)
    6. Detect and flag extreme outliers (IQR-based, logged only)

    Parameters
    ----------
    df       : Input DataFrame (not modified in-place).
    verbose  : If True, log a summary report.

    Returns
    -------
    Cleaned pd.DataFrame
    """
    df = df.copy()
    report = {}

    # ── 1. Duplicates ──────────────────────────────────────────
    n_before = len(df)
    df = df.drop_duplicates()
    n_removed = n_before - len(df)
    report["duplicates_removed"] = n_removed
    if n_removed:
        logger.info("Removed %d duplicate rows.", n_removed)

    # ── 2. Type coercion ──────────────────────────────────────
    df = _coerce_types(df)

    # ── 3. Missing values ─────────────────────────────────────
    missing_before = df.isnull().sum()
    total_missing = missing_before.sum()
    report["missing_values_before"] = total_missing

    if total_missing:
        logger.info("Missing values detected:\n%s", missing_before[missing_before > 0])
        df = _impute_missing(df)
        logger.info("Imputation complete. Remaining nulls: %d", df.isnull().sum().sum())
    else:
        logger.info("No missing values detected.")

    # ── 4. Geographic coordinate validation ───────────────────
    n_invalid_coords = _validate_coordinates(df)
    report["invalid_coords_flagged"] = n_invalid_coords

    # ── 5. Numeric range validation ───────────────────────────
    n_clamped = _validate_ranges(df)
    report["values_clamped"] = n_clamped

    # ── 6. Outlier detection ──────────────────────────────────
    outlier_cols = ["rainfall_mm", "soil_moisture", "slope_degree", "elevation_m"]
    outlier_info = _detect_outliers(df, outlier_cols)
    report["outlier_info"] = outlier_info

    if verbose:
        _print_report(report, df)

    logger.info("Cleaning complete. Final dataset: %d rows × %d columns", *df.shape)
    return df


# ──────────────────────────────────────────────────────────────
# Private helpers
# ──────────────────────────────────────────────────────────────

def _validate_columns(df: pd.DataFrame) -> None:
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(
            f"Dataset is missing required columns: {missing}\n"
            f"Found columns: {list(df.columns)}"
        )
    logger.info("Column validation passed. All required columns present.")


def _coerce_types(df: pd.DataFrame) -> pd.DataFrame:
    """Cast columns to expected dtypes where possible."""
    int_cols = ["location_id", "historical_landslide_count", "landslide_occurred"]
    float_cols = [
        "latitude", "longitude", "rainfall_mm", "soil_moisture",
        "slope_degree", "elevation_m", "terrain_roughness",
    ]
    for col in int_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
    for col in float_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def _impute_missing(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fill missing numerical values with column medians.
    Medians are robust to outliers vs means.
    """
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        n_missing = df[col].isnull().sum()
        if n_missing:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            logger.info(
                "  Imputed %d missing values in '%s' with median=%.4f",
                n_missing, col, median_val,
            )
    return df


def _validate_coordinates(df: pd.DataFrame) -> int:
    """Log rows with coordinates outside NER bounding box."""
    lat_min, lat_max = COLUMN_RANGES["latitude"]
    lon_min, lon_max = COLUMN_RANGES["longitude"]
    mask = (
        (df["latitude"] < lat_min) | (df["latitude"] > lat_max) |
        (df["longitude"] < lon_min) | (df["longitude"] > lon_max)
    )
    n_invalid = mask.sum()
    if n_invalid:
        logger.warning(
            "%d rows have coordinates outside NER bounds "
            "(lat %.1f–%.1f, lon %.1f–%.1f). "
            "These rows are kept but flagged for review.",
            n_invalid, lat_min, lat_max, lon_min, lon_max,
        )
    return int(n_invalid)


def _validate_ranges(df: pd.DataFrame) -> int:
    """Clamp numeric columns to valid physical ranges."""
    total_clamped = 0
    for col, (lo, hi) in COLUMN_RANGES.items():
        if col not in df.columns:
            continue
        out_of_range = ((df[col] < lo) | (df[col] > hi)).sum()
        if out_of_range:
            logger.warning(
                "  Clamping %d out-of-range values in '%s' to [%.2f, %.2f].",
                out_of_range, col, lo, hi,
            )
            df[col] = df[col].clip(lower=lo, upper=hi)
            total_clamped += int(out_of_range)
    return total_clamped


def _detect_outliers(df: pd.DataFrame, columns: list[str]) -> dict:
    """
    IQR-based outlier detection. Outliers are LOGGED but NOT removed.
    Removing landslide data points without domain expert review is risky.
    """
    info = {}
    for col in columns:
        if col not in df.columns:
            continue
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lo = q1 - 1.5 * iqr
        hi = q3 + 1.5 * iqr
        n_outliers = ((df[col] < lo) | (df[col] > hi)).sum()
        info[col] = {"outliers_detected": int(n_outliers), "lower_fence": lo, "upper_fence": hi}
        if n_outliers:
            logger.info(
                "  Outlier check '%s': %d potential outliers detected "
                "(fence [%.2f, %.2f]). Kept — review with domain expert.",
                col, n_outliers, lo, hi,
            )
    return info


def _print_report(report: dict, df: pd.DataFrame) -> None:
    """Print a cleaning summary report."""
    logger.info("=" * 60)
    logger.info("DATA CLEANING REPORT")
    logger.info("=" * 60)
    logger.info("  Duplicates removed    : %d", report.get("duplicates_removed", 0))
    logger.info("  Missing values (pre)  : %d", report.get("missing_values_before", 0))
    logger.info("  Invalid coords flagged: %d", report.get("invalid_coords_flagged", 0))
    logger.info("  Values clamped        : %d", report.get("values_clamped", 0))
    logger.info("  Final shape           : %d rows × %d cols", *df.shape)
    logger.info("=" * 60)
