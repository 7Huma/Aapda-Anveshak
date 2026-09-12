"""
api/routes.py
Landslide Risk Monitoring — Reports, alerts & EONET routes
SIH 26001

Split out of app.py so the growing feature set (reports, alerts, global
activity feed) doesn't keep piling into one file.
"""

import logging

from fastapi import APIRouter, HTTPException, Query

from api.schemas import (
    IncidentReportCreate,
    ReportFlagUpdate,
    ReportStatusUpdate,
)
from db import (
    create_incident_report,
    get_incident_report,
    list_alert_dispatch_log,
    list_incident_reports,
    set_report_flag,
    set_report_status,
)
from services.eonet import get_global_landslide_events

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")


# ──────────────────────────────────────────────────────────────
# Incident reports (backlog #2: citizen/field-officer submissions)
# ──────────────────────────────────────────────────────────────

@router.post("/reports")
def submit_report(report: IncidentReportCreate):
    record = create_incident_report(report.model_dump())
    return record


@router.get("/reports")
def get_reports(flagged: bool | None = Query(default=None)):
    return {"reports": list_incident_reports(flagged=flagged)}


@router.get("/reports/{report_id}")
def get_report(report_id: int):
    record = get_incident_report(report_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return record


@router.patch("/reports/{report_id}/flag")
def flag_report(report_id: int, body: ReportFlagUpdate):
    record = set_report_flag(report_id, body.flagged)
    if record is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return record


@router.patch("/reports/{report_id}/status")
def update_report_status(report_id: int, body: ReportStatusUpdate):
    allowed = {"unreviewed", "verified", "dismissed"}
    if body.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"status must be one of {sorted(allowed)}",
        )
    record = set_report_status(report_id, body.status)
    if record is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return record


# ──────────────────────────────────────────────────────────────
# Alerts (backlog #8: dispatch stub / queue)
# ──────────────────────────────────────────────────────────────

@router.get("/alerts")
def get_alerts(limit: int = Query(default=100, le=500)):
    return {"alerts": list_alert_dispatch_log(limit=limit)}


# ──────────────────────────────────────────────────────────────
# Global landslide activity (backlog #9: NASA EONET panel)
# ──────────────────────────────────────────────────────────────

@router.get("/eonet/landslides")
def get_eonet_landslides(
    status: str = Query(default="open", pattern="^(open|closed|all)$"),
    limit: int = Query(default=20, le=100),
):
    try:
        events = get_global_landslide_events(status=status, limit=limit)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "source": "NASA EONET v3",
        "category": "landslides",
        "events": events,
    }