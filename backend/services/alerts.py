"""
services/alerts.py
Landslide Risk Monitoring — Alert dispatch stub
SIH 26001

Backs backlog item #8: "Alert dispatch stub (log/queue when risk crosses
CRITICAL)".

This intentionally does NOT integrate a real SMS/email/push provider yet —
that's a separate, provider-specific piece of work (Twilio, MSG91, FCM,
etc). What it does do is give the rest of the system (and demo judges) a
real, working seam: every time a location's live risk crosses into
CRITICAL, an alert record is written to the dispatch log, de-duplicated so
the same location doesn't re-alert every poll cycle.

Swap `_send` for a real provider call later without touching callers.
"""

import logging

from db import log_alert_dispatch, was_recently_dispatched

logger = logging.getLogger(__name__)

CRITICAL_LEVEL = "CRITICAL"
DEDUP_WINDOW_MINUTES = 60


def maybe_dispatch_alert(location_result: dict) -> dict | None:
    """
    Given one location's live risk result (the dict returned by
    `calculate_location_risk`), dispatch an alert if its level is
    CRITICAL and one hasn't already gone out recently for this location.

    Returns the dispatch log entry if an alert was sent, else None.
    """
    if location_result.get("level") != CRITICAL_LEVEL:
        return None

    location_id = location_result.get("id")

    if location_id is not None and was_recently_dispatched(
        location_id, within_minutes=DEDUP_WINDOW_MINUTES
    ):
        return None

    message = (
        f"CRITICAL landslide risk detected at "
        f"{location_result.get('name', 'unknown location')} "
        f"(risk score {location_result.get('risk')}/100). "
        f"Immediate advisory recommended."
    )

    return _send(location_result, message)


def _send(location_result: dict, message: str) -> dict:
    """
    Stub "send". Currently just logs + persists to the dispatch log table
    so the queue is visible via GET /api/alerts. Replace the body of this
    function with a real provider integration when ready.
    """
    logger.warning("ALERT DISPATCH: %s", message)

    return log_alert_dispatch(
        location_id=location_result.get("id"),
        location_name=location_result.get("name", "unknown"),
        risk_score=location_result.get("risk") or 0,
        risk_level=location_result.get("level", CRITICAL_LEVEL),
        message=message,
        channel="log",
    )