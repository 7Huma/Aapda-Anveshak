from datetime import datetime, timezone
from services.risk import calculate_location_risk

import logging

logger = logging.getLogger(__name__)

from api.routes import router as api_router
from db import init_db
from services.alerts import maybe_dispatch_alert

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from fastapi import FastAPI

app = FastAPI()

support_units = [
    {"name": "Emergency Admin", "available": 12},
    {"name": "Fire & Rescue", "available": 18},
    {"name": "Armed Forces", "available": 27},
    {"name": "Police", "available": 30},
]


@app.get("/api/support-units")
def get_support_units():
    return {
        "units": support_units,
        "updated_at": datetime.utcnow().isoformat()
    }

app = FastAPI(
    title="Landslide Risk Monitoring API"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.on_event("startup")
def on_startup():
    init_db()

MONITORING_LOCATIONS = [
    {
        "id": 101,
        "name": "Sikkim North",
        "lat": 27.62,
        "lng": 88.71,
        "terrain_roughness": 0.70,
        "historical_landslide_count": 12,
    },
    {
        "id": 102,
        "name": "Gangtok East",
        "lat": 27.33,
        "lng": 88.61,
        "terrain_roughness": 0.65,
        "historical_landslide_count": 10,
    },
    {
        "id": 103,
        "name": "Darjeeling Hills",
        "lat": 27.04,
        "lng": 88.26,
        "terrain_roughness": 0.60,
        "historical_landslide_count": 9,
    },
    {
        "id": 104,
        "name": "West Sikkim",
        "lat": 27.25,
        "lng": 88.22,
        "terrain_roughness": 0.55,
        "historical_landslide_count": 6,
    },
    {
        "id": 105,
        "name": "Kalimpong",
        "lat": 27.07,
        "lng": 88.47,
        "terrain_roughness": 0.50,
        "historical_landslide_count": 5,
    },
    {
        "id": 106,
        "name": "South Sikkim",
        "lat": 27.17,
        "lng": 88.43,
        "terrain_roughness": 0.40,
        "historical_landslide_count": 3,
    },
    {
        "id": 107,
        "name": "Teesta Valley",
        "lat": 27.55,
        "lng": 88.65,
        "terrain_roughness": 0.68,
        "historical_landslide_count": 11,
    },
    {
        "id": 108,
        "name": "Rangpo",
        "lat": 27.18,
        "lng": 88.53,
        "terrain_roughness": 0.48,
        "historical_landslide_count": 4,
    },
]


@app.get("/api/health")
def health():

    return {
        "status": "ok",
        "service": "landslide-risk-api",
        "earth_engine": True,
    }


@app.get("/api/risk/live")
def live_risk():
    locations = []

    for location in MONITORING_LOCATIONS:
        try:
            result = calculate_location_risk(location)

            locations.append(result)

            try:
                maybe_dispatch_alert(result)
            except Exception:
                logger.exception(
                    "Alert dispatch failed for location %s",
                    location.get("id"),
                )

        except Exception as exc:
            # Don't crash the entire dashboard
            # because one location failed.
            locations.append(
                {
                    **location,
                    "risk": None,
                    "level": "UNKNOWN",
                    "error": str(exc),
                }
            )

    return {
        "source": "Google Earth Engine",
        "updated_at": datetime.now(
            timezone.utc
        ).isoformat(),

        "locations": locations,
    }


@app.get("/api/dashboard/summary")
def dashboard_summary():
    return {
        "source": "Operational Dashboard API",

        "updated_at": datetime.now(
            timezone.utc
        ).isoformat(),

        "infrastructure": {
            "severe": 18,
            "moderate": 7,
            "minor": 6,
            "no_damage": 12,
        },

        "evacuation": {
            "people_evacuated": 330,
            "capacity": 820,
        },

        "support_units": [
            {
                "name": "Emergency Admin",
                "available": 12,
            },
            {
                "name": "Fire & Rescue",
                "available": 18,
            },
            {
                "name": "Armed Forces",
                "available": 27,
            },
            {
                "name": "Police",
                "available": 30,
            },
        ],

        "affected_people": {
            "critical": 1240,
            "high": 3820,
            "medium": 6180,
            "low": 12450,
        },
    }