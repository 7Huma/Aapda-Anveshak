"""
datasets/generate_sample.py
Landslide Risk Monitoring — Synthetic Sample Dataset Generator
SIH 26001

⚠️  IMPORTANT — SYNTHETIC DATA DISCLAIMER ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This script generates a SYNTHETICALLY CREATED dataset for:
  - MVP development
  - Hackathon demonstration
  - Pipeline testing

This data does NOT represent real NER (North Eastern Region) historical
landslide records and MUST NOT be used for actual risk assessment decisions.

For production deployment, replace with authoritative data from:
  - GSI (Geological Survey of India) landslide inventory
  - IMD (India Meteorological Department) rainfall data
  - ISRO Bhuvan / NASA SRTM elevation/slope data
  - NDMA landslide hazard atlas
  - State disaster management authority records
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run:
    python -m ml.datasets.generate_sample
"""

from pathlib import Path
import logging
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# NER Geographic Bounds (approximate)
# ──────────────────────────────────────────────────────────────
NER_LAT_RANGE = (24.0, 29.5)   # Meghalaya to Arunachal Pradesh
NER_LON_RANGE = (88.0, 97.5)   # Tripura to Arunachal Pradesh


def generate_sample_dataset(
    n_samples: int = 1000,
    output_dir: Path | None = None,
    random_seed: int = 42,
    filename: str = "landslide_sample.csv",
) -> pd.DataFrame:
    """
    Generate a synthetic landslide dataset with realistic statistical properties.

    The generation uses a physics-informed approach:
      - High rainfall + high soil moisture + steep slope → high landslide probability
      - Class imbalance is realistic (~30% positive class, matching typical databases)

    Parameters
    ----------
    n_samples   : Number of rows to generate.
    output_dir  : Directory to save CSV. Defaults to ml/datasets/sample/.
    random_seed : For reproducibility.
    filename    : Output CSV filename.

    Returns
    -------
    pd.DataFrame
    """
    rng = np.random.default_rng(random_seed)

    logger.info("Generating %d synthetic samples (seed=%d)...", n_samples, random_seed)

    # ── Location IDs ────────────────────────────────────────
    location_ids = np.arange(1001, 1001 + n_samples)

    # ── Geographic coordinates (NER bounding box) ───────────
    latitudes  = rng.uniform(*NER_LAT_RANGE, n_samples).round(4)
    longitudes = rng.uniform(*NER_LON_RANGE, n_samples).round(4)

    # ── Rainfall (mm/day) — right-skewed, monsoon-influenced ─
    # Mix: 60% low-moderate rain, 40% heavy monsoon rain
    rainfall_low  = rng.exponential(scale=40,  size=int(n_samples * 0.60))
    rainfall_high = rng.exponential(scale=180, size=n_samples - len(rainfall_low))
    rainfall_mm   = np.concatenate([rainfall_low, rainfall_high])
    rng.shuffle(rainfall_mm)
    rainfall_mm = np.clip(rainfall_mm, 0, 500).round(1)

    # ── Soil Moisture (%) ────────────────────────────────────
    # Correlated with rainfall (r ~0.6) + independent noise
    soil_moisture = (
        0.55 * (rainfall_mm / 500 * 100)
        + 0.45 * rng.uniform(10, 80, n_samples)
    ).clip(5, 100).round(1)

    # ── Slope (degrees) ─────────────────────────────────────
    # NER is hilly/mountainous — bimodal distribution
    slope_flat       = rng.uniform(2, 20, int(n_samples * 0.30))
    slope_hilly      = rng.uniform(15, 45, int(n_samples * 0.50))
    slope_steep      = rng.uniform(40, 70, n_samples - len(slope_flat) - len(slope_hilly))
    slope_degree     = np.concatenate([slope_flat, slope_hilly, slope_steep])
    rng.shuffle(slope_degree)
    slope_degree = np.clip(slope_degree, 0, 85).round(1)

    # ── Elevation (m) — correlated with slope ───────────────
    elevation_m = (
        300 + slope_degree * 40 + rng.uniform(-200, 500, n_samples)
    ).clip(10, 4500).round(0).astype(int)

    # ── Terrain Roughness [0–1] ──────────────────────────────
    terrain_roughness = (
        slope_degree / 90 * 0.6 + rng.uniform(0, 0.4, n_samples)
    ).clip(0.0, 1.0).round(3)

    # ── Historical Landslide Count ──────────────────────────
    # Areas with high slope & high terrain roughness more likely to have history
    base_count = (slope_degree / 30 + terrain_roughness * 5).clip(0)
    historical_landslide_count = rng.poisson(lam=base_count).astype(int)
    historical_landslide_count = np.clip(historical_landslide_count, 0, 50)

    # ── Target: landslide_occurred ──────────────────────────
    # Physics-informed probability model (NOT a real model — for demo generation only)
    p_landslide = _compute_landslide_probability(
        rainfall_mm, soil_moisture, slope_degree,
        terrain_roughness, historical_landslide_count, rng,
    )
    landslide_occurred = rng.binomial(1, p=p_landslide).astype(int)

    # ── Assemble DataFrame ───────────────────────────────────
    df = pd.DataFrame({
        "location_id":               location_ids,
        "latitude":                  latitudes,
        "longitude":                 longitudes,
        "rainfall_mm":               rainfall_mm,
        "soil_moisture":             soil_moisture,
        "slope_degree":              slope_degree,
        "elevation_m":               elevation_m,
        "terrain_roughness":         terrain_roughness,
        "historical_landslide_count": historical_landslide_count,
        "landslide_occurred":        landslide_occurred,
    })

    # ── Introduce small % of realistic messiness ────────────
    df = _introduce_realistic_noise(df, rng)

    # ── Stats ────────────────────────────────────────────────
    pos_rate = df["landslide_occurred"].mean()
    logger.info("Generated %d rows | Positive rate (landslide=1): %.1f%%", len(df), pos_rate * 100)
    logger.info("Feature stats:\n%s", df.describe().to_string())

    # ── Save ────────────────────────────────────────────────
    if output_dir is None:
        output_dir = Path(__file__).resolve().parent / "sample"

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / filename
    df.to_csv(out_path, index=False)
    logger.info("✓ Synthetic sample dataset saved to: %s", out_path)

    return df


def _compute_landslide_probability(
    rainfall, soil_moisture, slope, terrain, hist_count, rng
):
    """
    Compute synthetic landslide probability using a weighted risk formula.
    This is used ONLY for generating synthetic labels — not a real model.
    """
    r_risk   = np.clip(rainfall / 300, 0, 1)
    s_risk   = np.clip(soil_moisture / 100, 0, 1)
    sl_risk  = np.clip(slope / 60, 0, 1)
    t_risk   = terrain
    h_risk   = np.clip(np.log1p(hist_count) / np.log1p(50), 0, 1)

    # Weighted linear combination
    raw_p = (
        0.30 * r_risk
        + 0.25 * s_risk
        + 0.25 * sl_risk
        + 0.10 * t_risk
        + 0.10 * h_risk
    )

    # Add non-linear interaction: compound effect of rain + steep slope
    interaction = r_risk * sl_risk * 0.20
    raw_p = raw_p + interaction

    # Add small noise
    noise = rng.normal(0, 0.05, len(rainfall))
    p = np.clip(raw_p + noise, 0.01, 0.99)

    return p


def _introduce_realistic_noise(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    """Introduce a small fraction of missing values and one duplicate batch."""
    n = len(df)

    # ~2% missing rainfall values
    missing_idx = rng.choice(n, size=int(n * 0.02), replace=False)
    df.loc[missing_idx, "rainfall_mm"] = np.nan

    # ~1% missing soil moisture
    missing_idx2 = rng.choice(n, size=int(n * 0.01), replace=False)
    df.loc[missing_idx2, "soil_moisture"] = np.nan

    # ~0.5% duplicate rows (to test deduplication)
    dup_idx = rng.choice(n, size=max(1, int(n * 0.005)), replace=False)
    duplicates = df.iloc[dup_idx].copy()
    df = pd.concat([df, duplicates], ignore_index=True)

    logger.info(
        "Introduced %.0f missing rainfall, %.0f missing soil moisture, %d duplicate rows.",
        int(n * 0.02), int(n * 0.01), len(dup_idx),
    )
    return df


if __name__ == "__main__":
    generate_sample_dataset(n_samples=1000)
