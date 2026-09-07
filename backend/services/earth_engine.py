import os
import ee
from dotenv import load_dotenv

load_dotenv()

EE_PROJECT_ID = os.getenv("EE_PROJECT_ID")

_initialized = False


def initialize_earth_engine():
    """
    Initialize Google Earth Engine once for the backend process.

    Local development:
        Run `earthengine authenticate` once in PowerShell.

    Then put the Google Cloud / Earth Engine project ID in .env:
        EE_PROJECT_ID=your-project-id
    """
    global _initialized

    if _initialized:
        return

    if not EE_PROJECT_ID:
        raise RuntimeError(
            "EE_PROJECT_ID is missing from backend/.env"
        )

    try:
        ee.Initialize(project=EE_PROJECT_ID)
        _initialized = True
    except Exception as exc:
        raise RuntimeError(
            "Google Earth Engine initialization failed. "
            "Run `earthengine authenticate` and verify EE_PROJECT_ID."
        ) from exc


def point_geometry(lat: float, lng: float):
    initialize_earth_engine()
    return ee.Geometry.Point([lng, lat])