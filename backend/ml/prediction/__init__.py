"""
prediction/__init__.py
Landslide Risk Monitoring — Prediction Package
SIH 26001
"""
from .predict import predict_risk, predict_batch, load_model

__all__ = ["predict_risk", "predict_batch", "load_model"]
