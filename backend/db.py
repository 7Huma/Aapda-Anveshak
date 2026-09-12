"""
db.py
Landslide Risk Monitoring — Lightweight SQLite persistence
SIH 26001

Backs the citizen / field-officer incident reporting feature
(backlog item #2: "Citizen/field-officer report submission (backend, SQLite)").

Deliberately dependency-free (stdlib sqlite3) so it needs no extra
services to run locally or on a small deployment.
"""

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).resolve().parent / "data" / "app.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Enforce foreign keys / sane defaults for concurrent FastAPI requests.
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_db() -> None:
    """
    Create tables if they don't exist yet. Safe to call on every
    app startup.
    """
    conn = get_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS incident_reports (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                title               TEXT NOT NULL,
                incident_type       TEXT NOT NULL DEFAULT 'landslide',
                severity            TEXT NOT NULL DEFAULT 'moderate',
                location_name       TEXT NOT NULL,
                latitude            REAL,
                longitude           REAL,
                description         TEXT NOT NULL,
                reporter_name       TEXT,
                reporter_phone      TEXT,
                media_urls          TEXT,       -- JSON-encoded list of stored file paths/URLs
                flagged             INTEGER NOT NULL DEFAULT 0,
                status              TEXT NOT NULL DEFAULT 'unreviewed',
                created_at          TEXT NOT NULL
            );
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS alert_dispatch_log (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id         INTEGER,
                location_name       TEXT NOT NULL,
                risk_score          INTEGER NOT NULL,
                risk_level          TEXT NOT NULL,
                channel             TEXT NOT NULL DEFAULT 'log',
                message             TEXT NOT NULL,
                created_at          TEXT NOT NULL
            );
            """
        )
        conn.commit()
    finally:
        conn.close()


# ──────────────────────────────────────────────────────────────
# Incident reports
# ──────────────────────────────────────────────────────────────

def create_incident_report(data: dict) -> dict:
    conn = get_connection()
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = conn.execute(
            """
            INSERT INTO incident_reports (
                title, incident_type, severity, location_name,
                latitude, longitude, description,
                reporter_name, reporter_phone, media_urls,
                flagged, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'unreviewed', ?)
            """,
            (
                data["title"],
                data.get("incident_type", "landslide"),
                data.get("severity", "moderate"),
                data["location_name"],
                data.get("latitude"),
                data.get("longitude"),
                data["description"],
                data.get("reporter_name"),
                data.get("reporter_phone"),
                data.get("media_urls"),
                now,
            ),
        )
        conn.commit()
        return get_incident_report(cursor.lastrowid, conn=conn)
    finally:
        conn.close()


def get_incident_report(report_id: int, conn: Optional[sqlite3.Connection] = None) -> Optional[dict]:
    owns_conn = conn is None
    conn = conn or get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM incident_reports WHERE id = ?", (report_id,)
        ).fetchone()
        return dict(row) if row else None
    finally:
        if owns_conn:
            conn.close()


def list_incident_reports(flagged: Optional[bool] = None) -> list[dict]:
    conn = get_connection()
    try:
        if flagged is None:
            rows = conn.execute(
                "SELECT * FROM incident_reports ORDER BY created_at DESC"
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM incident_reports WHERE flagged = ? ORDER BY created_at DESC",
                (1 if flagged else 0,),
            ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def set_report_flag(report_id: int, flagged: bool) -> Optional[dict]:
    conn = get_connection()
    try:
        conn.execute(
            "UPDATE incident_reports SET flagged = ? WHERE id = ?",
            (1 if flagged else 0, report_id),
        )
        conn.commit()
        return get_incident_report(report_id, conn=conn)
    finally:
        conn.close()


def set_report_status(report_id: int, status: str) -> Optional[dict]:
    conn = get_connection()
    try:
        conn.execute(
            "UPDATE incident_reports SET status = ? WHERE id = ?",
            (status, report_id),
        )
        conn.commit()
        return get_incident_report(report_id, conn=conn)
    finally:
        conn.close()


# ──────────────────────────────────────────────────────────────
# Alert dispatch log
# ──────────────────────────────────────────────────────────────

def log_alert_dispatch(
    location_id: Optional[int],
    location_name: str,
    risk_score: int,
    risk_level: str,
    message: str,
    channel: str = "log",
) -> dict:
    conn = get_connection()
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = conn.execute(
            """
            INSERT INTO alert_dispatch_log (
                location_id, location_name, risk_score, risk_level,
                channel, message, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (location_id, location_name, risk_score, risk_level, channel, message, now),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM alert_dispatch_log WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return dict(row)
    finally:
        conn.close()


def list_alert_dispatch_log(limit: int = 100) -> list[dict]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM alert_dispatch_log ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def was_recently_dispatched(location_id: int, within_minutes: int = 60) -> bool:
    """
    Basic de-duplication so the same CRITICAL location doesn't spam
    the alert log on every poll of /api/risk/live.
    """
    conn = get_connection()
    try:
        row = conn.execute(
            """
            SELECT created_at FROM alert_dispatch_log
            WHERE location_id = ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (location_id,),
        ).fetchone()
        if row is None:
            return False

        last_dispatched = datetime.fromisoformat(row["created_at"])
        elapsed_minutes = (
            datetime.now(timezone.utc) - last_dispatched
        ).total_seconds() / 60.0
        return elapsed_minutes < within_minutes
    finally:
        conn.close()