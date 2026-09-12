import ee

from services.earth_engine import (
    initialize_earth_engine,
    point_geometry,
)


DEM_COLLECTION = "COPERNICUS/DEM/GLO30_2024_1"

# Cache the DEM mosaic — it's the same image regardless of
# which point you're querying, so build it once per process
# instead of once per location per request.
_DEM_IMAGE = None


def get_dem_image():
    global _DEM_IMAGE

    if _DEM_IMAGE is not None:
        return _DEM_IMAGE

    initialize_earth_engine()

    collection = ee.ImageCollection(DEM_COLLECTION)

    first = collection.first()

    dem = (
        collection
        .mosaic()
        .setDefaultProjection(first.projection())
        .select("DEM")
    )

    _DEM_IMAGE = dem
    return _DEM_IMAGE


def get_elevation(lat: float, lng: float):
    """
    Returns elevation in metres.
    """

    dem = get_dem_image()
    point = point_geometry(lat, lng)

    result = dem.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=point.buffer(100),
        scale=30,
        maxPixels=10000,
    )

    value = result.get("DEM").getInfo()

    if value is None:
        raise RuntimeError(
            f"No elevation data available for {lat}, {lng}"
        )

    return round(float(value), 2)