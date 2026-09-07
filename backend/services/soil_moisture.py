from datetime import datetime, timedelta, timezone

import ee

from services.earth_engine import (
    initialize_earth_engine,
    point_geometry,
)


SOIL_COLLECTION = (
    "NASA/SMAP/SPL3SMP_E/006"
)


def get_soil_moisture(
    lat: float,
    lng: float,
):
    """
    Get latest available SMAP surface soil moisture.

    Returns percentage, e.g. 31.4%.
    """

    initialize_earth_engine()

    point = point_geometry(lat, lng)

    end = datetime.now(timezone.utc)
    start = end - timedelta(days=14)

    collection = (
        ee.ImageCollection(SOIL_COLLECTION)
        .filterDate(
            start.strftime("%Y-%m-%d"),
            end.strftime("%Y-%m-%d"),
        )
        .filterBounds(point)
        .select("soil_moisture_am")
        .sort("system:time_start", False)
    )

    count = collection.size().getInfo()

    if count == 0:
        raise RuntimeError(
            f"No soil-moisture data available "
            f"for {lat}, {lng}"
        )

    latest = collection.first()

    result = latest.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=point.buffer(5000),
        scale=9000,
        maxPixels=10000,
    )

    value = result.get(
        "soil_moisture_am"
    ).getInfo()

    if value is None:
        raise RuntimeError(
            f"Soil-moisture value unavailable "
            f"for {lat}, {lng}"
        )

    # Convert volumetric fraction to percentage.
    percentage = float(value) * 100

    return round(percentage, 2)