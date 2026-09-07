from datetime import datetime, timedelta, timezone

import ee

from services.earth_engine import (
    initialize_earth_engine,
    point_geometry,
)


# GSMaP v8 provides near-real-time hourly precipitation.
# hourlyPrecipRateGC is the gauge-corrected precipitation rate.
RAINFALL_COLLECTION = "JAXA/GPM_L3/GSMaP/v8/operational"
RAINFALL_BAND = "hourlyPrecipRateGC"


def get_rainfall(
    lat: float,
    lng: float,
    days: int = 7,
):
    initialize_earth_engine()

    point = point_geometry(lat, lng)

    now = datetime.now(timezone.utc)

    # Search a wider window because satellite products can
    # have a short processing delay.
    search_start = now - timedelta(days=14)

    collection = (
        ee.ImageCollection(RAINFALL_COLLECTION)
        .filterDate(
            search_start.strftime("%Y-%m-%d"),
            now.strftime("%Y-%m-%d"),
        )
        .filterBounds(point)
        .select(RAINFALL_BAND)
    )

    count = collection.size().getInfo()

    if count == 0:
        raise RuntimeError(
            f"No GSMaP rainfall data available for {lat}, {lng}"
        )

    # Find the latest available observation instead of assuming
    # that Earth Engine has data for the current UTC day.
    latest_time = collection.aggregate_max(
        "system:time_start"
    ).getInfo()

    if latest_time is None:
        raise RuntimeError(
            f"Unable to determine latest rainfall observation "
            f"for {lat}, {lng}"
        )

    latest_date = ee.Date(latest_time)

    # Calculate the 7-day period ending at the latest
    # observation actually available in Earth Engine.
    start_date = latest_date.advance(-days, "day")
    end_date = latest_date.advance(1, "hour")

    recent_collection = (
        collection
        .filterDate(start_date, end_date)
        .select(RAINFALL_BAND)
    )

    recent_count = recent_collection.size().getInfo()

    if recent_count == 0:
        raise RuntimeError(
            f"No recent GSMaP rainfall data available "
            f"for {lat}, {lng}"
        )

    # hourlyPrecipRateGC is mm/hour.
    # Summing hourly images gives accumulated rainfall in mm.
    rainfall_image = recent_collection.sum()

    result = rainfall_image.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=point.buffer(5000),
        scale=11132,
        maxPixels=10000,
    )

    value = result.get(RAINFALL_BAND).getInfo()

    if value is None:
        raise RuntimeError(
            f"Rainfall value unavailable for {lat}, {lng}"
        )

    return round(float(value), 2)

