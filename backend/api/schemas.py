"""
api/schemas.py
Landslide Risk Monitoring — Request/response schemas
SIH 26001
"""

from typing import Optional

from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────────
# Incident reports (citizen / field-officer submissions)
# ──────────────────────────────────────────────────────────────

class IncidentReportCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    incident_type: str = Field(default="landslide")
    severity: str = Field(default="moderate")  # low | moderate | high | critical
    location_name: str = Field(..., min_length=2, max_length=200)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: str = Field(..., min_length=5, max_length=2000)
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None
    media_urls: Optional[str] = None  # JSON-encoded list, uploaded separately


class IncidentReportOut(BaseModel):
    id: int
    title: str
    incident_type: str
    severity: str
    location_name: str
    latitude: Optional[float]
    longitude: Optional[float]
    description: str
    reporter_name: Optional[str]
    reporter_phone: Optional[str]
    media_urls: Optional[str]
    flagged: bool
    status: str
    created_at: str


class ReportFlagUpdate(BaseModel):
    flagged: bool


class ReportStatusUpdate(BaseModel):
    status: str  # unreviewed | verified | dismissed


# ──────────────────────────────────────────────────────────────
# Alert dispatch
# ──────────────────────────────────────────────────────────────

class AlertDispatchOut(BaseModel):
    id: int
    location_id: Optional[int]
    location_name: str
    risk_score: int
    risk_level: str
    channel: str
    message: str
    created_at: str