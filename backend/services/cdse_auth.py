"""
CDSE authentication is currently not required.

The dashboard data pipeline uses Google Earth Engine
for Sentinel/Copernicus and environmental datasets.

Keep this file so existing imports do not break.
"""

def get_cdse_token():
    raise RuntimeError(
        "CDSE OAuth is not used in the current "
        "Google Earth Engine data pipeline."
    )