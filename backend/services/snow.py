from datetime import datetime, timedelta, timezone

import ee

from services.earth_engine import (
    initialize_earth_engine,
    point_geometry,
)


SNOW_COLLECTION = "MODIS/061/MOD10A1"


def get_snow_cover(
    lat: float,
    lng: float,
):
    """
    Get latest available snow-cover percentage.

    Returns 0-100.
    """

    initialize_earth_engine()

    point = point_geometry(lat, lng)

    end = datetime.now(timezone.utc)
    start = end - timedelta(days=7)

    collection = (
        ee.ImageCollection(SNOW_COLLECTION)
        .filterDate(
            start.strftime("%Y-%m-%d"),
            end.strftime("%Y-%m-%d"),
        )
        .filterBounds(point)
        .select("NDSI_Snow_Cover")
        .sort("system:time_start", False)
    )

    count = collection.size().getInfo()

    if count == 0:
        return 0.0

    latest = collection.first()

    result = latest.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=point.buffer(500),
        scale=500,
        maxPixels=10000,
    )

    value = result.get(
        "NDSI_Snow_Cover"
    ).getInfo()

    if value is None:
        return 0.0

    return round(float(value), 2)