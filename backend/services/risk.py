from services.rainfall import get_rainfall
from services.soil_moisture import get_soil_moisture
from services.elevation import get_elevation
from services.slope import get_slope
from services.snow import get_snow_cover
from services.earth_engine import initialize_earth_engine

from ml.prediction.predict import predict_risk


def calculate_location_risk(location):
    """
    Fetch live/latest available environmental data
    and run the existing ML model.
    """

    initialize_earth_engine()

    lat = float(location["lat"])
    lng = float(location["lng"])

    # -----------------------------------------
    # 1. LIVE ENVIRONMENTAL DATA
    # -----------------------------------------

    rainfall = get_rainfall(
        lat,
        lng,
        days=7,
    )

    soil_moisture = get_soil_moisture(
        lat,
        lng,
    )

    elevation = get_elevation(
        lat,
        lng,
    )

    slope = get_slope(
        lat,
        lng,
    )

    snow = get_snow_cover(
        lat,
        lng,
    )

    # -----------------------------------------
    # 2. HISTORICAL STATIC FEATURES
    # -----------------------------------------

    terrain_roughness = float(
        location.get(
            "terrain_roughness",
            0.5,
        )
    )

    historical_landslide_count = int(
        location.get(
            "historical_landslide_count",
            1,
        )
    )

    # -----------------------------------------
    # 3. ML PREDICTION
    # -----------------------------------------

    prediction = predict_risk(
        {
            "rainfall_mm": rainfall,
            "soil_moisture": soil_moisture,
            "slope_degree": slope,
            "terrain_roughness": terrain_roughness,
            "historical_landslide_count":
                historical_landslide_count,
            "elevation_m": elevation,
        }
    )

    # -----------------------------------------
    # 4. RESPONSE FOR REACT
    # -----------------------------------------

    return {
        "id": location["id"],
        "name": location["name"],
        "lat": lat,
        "lng": lng,

        "risk": prediction["risk_score"],
        "level": prediction["risk_level"],
        "confidence": prediction["confidence"],

        "rainfall": rainfall,
        "soil": soil_moisture,
        "slope": slope,
        "elevation": elevation,
        "snow": snow,

        "terrain_roughness":
            terrain_roughness,

        "historical_landslide_count":
            historical_landslide_count,

        "risk_factors":
            prediction["risk_factors"],
    }