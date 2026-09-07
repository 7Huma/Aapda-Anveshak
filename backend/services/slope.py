import ee

from services.earth_engine import point_geometry
from services.elevation import get_dem_image


def get_slope(lat: float, lng: float):
    dem = get_dem_image()

    slope = ee.Terrain.slope(dem)

    point = point_geometry(lat, lng)

    result = slope.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=point.buffer(100),
        scale=30,
        maxPixels=10000,
    )

    value = result.get("slope").getInfo()

    if value is None:
        raise RuntimeError(
            f"No slope data available for {lat}, {lng}"
        )

    return round(float(value), 2)