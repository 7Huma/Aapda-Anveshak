"""
models/landslide_model.py
Landslide Risk Monitoring — Model Training, Evaluation & Persistence
SIH 26001

Algorithm priority:
  1. XGBoost (if installed)
  2. Random Forest (scikit-learn fallback)

No data leakage: preprocessing is fitted only on training data.
"""

import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

from ml.preprocessing.feature_engineering import get_feature_columns

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────
RANDOM_SEED = 42
TEST_SIZE = 0.20
TARGET_COL = "landslide_occurred"

# Default save directory (relative to repo root)
DEFAULT_MODEL_DIR = Path(__file__).resolve().parent / "saved"


# ──────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────

def train_model(
    df: pd.DataFrame,
    feature_cols: Optional[list[str]] = None,
    random_seed: int = RANDOM_SEED,
) -> Tuple[Any, dict]:
    """
    Train a landslide risk classifier.

    Parameters
    ----------
    df           : Feature-engineered DataFrame (output of engineer_features()).
    feature_cols : List of feature column names. Defaults to ENGINEERED_FEATURE_COLS.
    random_seed  : Random seed for reproducibility.

    Returns
    -------
    model   : Fitted sklearn-compatible pipeline (scaler + classifier).
    metrics : Evaluation metrics dict.
    """
    if feature_cols is None:
        feature_cols = get_feature_columns()

    _validate_training_data(df, feature_cols)

    X = df[feature_cols].values.astype(np.float32)
    y = df[TARGET_COL].astype(int).values

    # ── Train/test split (stratified to preserve class balance) ──
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=TEST_SIZE,
        random_state=random_seed,
        stratify=y,
    )
    logger.info(
        "Train/test split: %d train, %d test (%.0f%% / %.0f%%)",
        len(X_train), len(X_test),
        (1 - TEST_SIZE) * 100, TEST_SIZE * 100,
    )

    # ── Build pipeline ──────────────────────────────────────────
    classifier = _get_classifier(random_seed)
    model = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", classifier),
    ])

    logger.info("Training model: %s", type(classifier).__name__)
    model.fit(X_train, y_train)
    logger.info("Training complete.")

    # ── Evaluate ────────────────────────────────────────────────
    metrics = evaluate_model(model, X_test, y_test, feature_cols=feature_cols)

    return model, metrics


def evaluate_model(
    model: Any,
    X_test: np.ndarray,
    y_test: np.ndarray,
    feature_cols: Optional[list[str]] = None,
) -> dict:
    """
    Evaluate a trained model on test data.

    Parameters
    ----------
    model        : Fitted pipeline.
    X_test       : Test feature matrix.
    y_test       : True labels.
    feature_cols : Feature names (for importance logging).

    Returns
    -------
    metrics : dict with accuracy, precision, recall, f1, roc_auc,
              confusion_matrix, and feature_importance.
    """
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy":  round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall":    round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1":        round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "roc_auc":   round(float(roc_auc_score(y_test, y_prob)), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "test_samples": int(len(y_test)),
        "class_distribution": {
            "positive": int(y_test.sum()),
            "negative": int((1 - y_test).sum()),
        },
    }

    # Feature importance (works for tree-based models)
    clf = model.named_steps.get("classifier")
    if clf is not None and hasattr(clf, "feature_importances_"):
        cols = feature_cols or [f"feature_{i}" for i in range(len(clf.feature_importances_))]
        importance = dict(zip(cols, [round(float(v), 4) for v in clf.feature_importances_]))
        # Sort descending
        metrics["feature_importance"] = dict(
            sorted(importance.items(), key=lambda x: x[1], reverse=True)
        )

    # Log results
    logger.info("=" * 55)
    logger.info("MODEL EVALUATION RESULTS")
    logger.info("=" * 55)
    logger.info("  Accuracy  : %.4f", metrics["accuracy"])
    logger.info("  Precision : %.4f", metrics["precision"])
    logger.info("  Recall    : %.4f", metrics["recall"])
    logger.info("  F1 Score  : %.4f", metrics["f1"])
    logger.info("  ROC-AUC   : %.4f", metrics["roc_auc"])
    logger.info("  Confusion Matrix:\n%s", np.array(metrics["confusion_matrix"]))
    if "feature_importance" in metrics:
        logger.info("  Feature Importance:")
        for feat, imp in metrics["feature_importance"].items():
            logger.info("    %-35s %.4f", feat, imp)
    logger.info("=" * 55)

    return metrics


def save_model(
    model: Any,
    metrics: dict,
    model_dir: Optional[Path] = None,
    model_name: str = "landslide_model",
) -> Path:
    """
    Save the trained model and its metadata.

    Parameters
    ----------
    model      : Fitted sklearn pipeline.
    metrics    : Evaluation metrics dict.
    model_dir  : Directory to save into. Defaults to ml/models/saved/.
    model_name : Base filename for the model.

    Returns
    -------
    model_path : Path to the saved .joblib file.
    """
    if model_dir is None:
        model_dir = DEFAULT_MODEL_DIR

    model_dir = Path(model_dir)
    model_dir.mkdir(parents=True, exist_ok=True)

    model_path = model_dir / f"{model_name}.joblib"
    meta_path  = model_dir / f"{model_name}_metadata.json"

    joblib.dump(model, model_path)
    logger.info("Model saved to: %s", model_path)

    # Save metadata alongside model
    metadata = {
        "model_name": model_name,
        "algorithm": type(model.named_steps["classifier"]).__name__,
        "feature_columns": get_feature_columns(),
        "target_column": TARGET_COL,
        "random_seed": RANDOM_SEED,
        "test_size": TEST_SIZE,
        "metrics": metrics,
        "risk_thresholds": {
            "LOW":      [0, 24],
            "MEDIUM":   [25, 49],
            "HIGH":     [50, 74],
            "CRITICAL": [75, 100],
        },
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    logger.info("Model metadata saved to: %s", meta_path)

    return model_path


def load_model(
    model_dir: Optional[Path] = None,
    model_name: str = "landslide_model",
) -> Any:
    """
    Load a previously saved model.

    Parameters
    ----------
    model_dir  : Directory containing saved model. Defaults to ml/models/saved/.
    model_name : Base filename (without extension).

    Returns
    -------
    model : Fitted sklearn pipeline.

    Raises
    ------
    FileNotFoundError : If the model file does not exist.
    """
    if model_dir is None:
        model_dir = DEFAULT_MODEL_DIR

    model_path = Path(model_dir) / f"{model_name}.joblib"
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found at: {model_path.resolve()}\n"
            f"Run the training pipeline first: python -m ml.pipeline.run_pipeline"
        )

    model = joblib.load(model_path)
    logger.info("Model loaded from: %s", model_path)
    return model


# ──────────────────────────────────────────────────────────────
# Private helpers
# ──────────────────────────────────────────────────────────────

def _get_classifier(random_seed: int):
    """Return XGBoost if available, otherwise Random Forest."""
    try:
        from xgboost import XGBClassifier
        logger.info("XGBoost available — using XGBClassifier.")
        return XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=random_seed,
            verbosity=0,
        )
    except ImportError:
        logger.warning(
            "XGBoost not installed — falling back to RandomForestClassifier. "
            "Install with: pip install xgboost"
        )
        return RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            class_weight="balanced",
            random_state=random_seed,
            n_jobs=-1,
        )


def _validate_training_data(df: pd.DataFrame, feature_cols: list[str]) -> None:
    missing_feats = [c for c in feature_cols if c not in df.columns]
    if missing_feats:
        raise ValueError(f"Missing feature columns: {missing_feats}")
    if TARGET_COL not in df.columns:
        raise ValueError(f"Target column '{TARGET_COL}' not found in DataFrame.")
    n_pos = df[TARGET_COL].sum()
    n_neg = len(df) - n_pos
    logger.info(
        "Class distribution — positive (landslide=1): %d, negative (no landslide=0): %d",
        n_pos, n_neg,
    )
    if n_pos < 10 or n_neg < 10:
        logger.warning(
            "Very few samples in one class (%d pos, %d neg). "
            "Model may not generalize well.",
            n_pos, n_neg,
        )
