"""
services/eonet.py
Landslide Risk Monitoring — NASA EONET proxy
SIH 26001

Backs backlog item #9: "Small 'Global Landslide Activity via NASA EONET'
panel". EONET (Earth Observatory Natural Event Tracker) is a free, public,
no-API-key NASA feed of ongoing natural events worldwide.

The backend proxies this (rather than the frontend calling NASA directly)
so we can:
  - avoid the frontend depending on an external host's availability/CORS,
  - apply a short in-memory cache (EONET updates infrequently),
  - normalize the shape to only what the dashboard needs.

Docs: https://eonet.gsfc.nasa.gov/docs/v3
"""

import time
from typing import Optional

import requests

EONET_EVENTS_URL = "https://eonet.gsfc.nasa.gov/api/v3/events"
LANDSLIDE_CATEGORY_ID = "landslides"

_CACHE_TTL_SECONDS = 15 * 60  # EONET events don't need to be polled hard
_cache: dict = {"fetched_at": 0.0, "events": None}


def get_global_landslide_events(
    status: str = "all",
    limit: int = 20,
    force_refresh: bool = False,
) -> list[dict]:
    """
    Return recent/ongoing landslide events worldwide, normalized for the
    frontend's "Global Landslide Activity" panel.

    Parameters
    ----------
    status : "open" (ongoing) | "closed" | "all"
    limit  : max number of events to return
    """
    now = time.time()

    if (
        not force_refresh
        and _cache["events"] is not None
        and (now - _cache["fetched_at"]) < _CACHE_TTL_SECONDS
    ):
        return _cache["events"][:limit]

    params = {
        "category": LANDSLIDE_CATEGORY_ID,
        "status": status,
        "limit": limit,
    }

    try:
        response = requests.get(EONET_EVENTS_URL, params=params, timeout=8)
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        # Fall back to whatever we had cached, if anything, rather than
        # breaking the whole dashboard because an external API is down.
        if _cache["events"] is not None:
            return _cache["events"][:limit]
        raise RuntimeError(f"Unable to reach NASA EONET: {exc}") from exc

    events = [_normalize_event(event) for event in payload.get("events", [])]

    _cache["events"] = events
    _cache["fetched_at"] = now

    return events[:limit]


def _normalize_event(event: dict) -> dict:
    geometries = event.get("geometry", [])
    latest_geometry = geometries[-1] if geometries else None

    coordinates: Optional[list[float]] = None
    observed_at: Optional[str] = None

    if latest_geometry:
        coordinates = latest_geometry.get("coordinates")
        observed_at = latest_geometry.get("date")

    sources = event.get("sources", [])

    return {
        "id": event.get("id"),
        "title": event.get("title"),
        "link": event.get("link"),
        "closed": event.get("closed"),
        "latitude": coordinates[1] if coordinates else None,
        "longitude": coordinates[0] if coordinates else None,
        "observed_at": observed_at,
        "source_url": sources[0]["url"] if sources else None,
        "source_name": sources[0]["id"] if sources else None,
    }