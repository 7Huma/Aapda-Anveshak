# ml/datasets/raw/

This folder is for **raw, authoritative data** from real sources.

## ⚠️ NOT committed to Git (see .gitignore)

Large datasets must NOT be committed to Git. Use one of:
- **Git LFS** for versioned large files
- **DVC** (Data Version Control)
- Shared cloud storage (Google Drive, S3, etc.)

## Expected Data Sources (Real Deployment)

| Source | Data Type | Format |
|--------|-----------|--------|
| IMD (India Meteorological Department) | Rainfall | CSV / NetCDF |
| ISRO Bhuvan / NASA SRTM | Elevation, Slope | GeoTIFF / CSV |
| GSI Landslide Inventory | Historical Events | Shapefile / CSV |
| NDMA Hazard Atlas | Hazard Zones | Shapefile |
| State DMA Sensor Networks | Soil Moisture | JSON / CSV |

## File Naming Convention

```
raw/
├── imd_rainfall_ner_YYYY.csv
├── srtm_slope_ner.csv
├── gsi_landslide_inventory.csv
└── ndma_hazard_zones.shp
```
