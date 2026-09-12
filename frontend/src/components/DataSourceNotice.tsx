
function DataSourceNotice() {
  return (
    <div className="dsn-card">
      <div className="dsn-header">
        <span className="dsn-icon">ⓘ</span>
        <h3>Where this data actually comes from</h3>
      </div>

      <div className="dsn-grid">
        <div className="dsn-source dsn-source--live">
          <div className="dsn-source-label">
            <span className="dsn-dot dsn-dot--live" />
            Earth Engine + ML
            <span className="dsn-badge dsn-badge--live">LIVE</span>
          </div>
          <p className="dsn-source-desc">
            Rainfall, soil moisture, slope, elevation, and risk scores are
            computed continuously per location from satellite and terrain
            data, then scored by the trained model.
          </p>
          <div className="dsn-example">
            e.g. <strong>Gangtok East</strong> — 180&nbsp;mm rainfall ·
            82% soil moisture · 42° slope · 1850&nbsp;m elevation
          </div>
        </div>

        <div className="dsn-source dsn-source--eonet">
          <div className="dsn-source-label">
            <span className="dsn-dot dsn-dot--eonet" />
            NASA EONET
            <span className="dsn-badge dsn-badge--eonet">SUPPLEMENTARY</span>
          </div>
          <p className="dsn-source-desc">
            A global, self-reported event tracker — occasional landslide
            reports pulled from news sources. No rainfall, soil, slope, or
            elevation data, and no continuous per-location risk scoring.
          </p>
          <div className="dsn-example dsn-example--muted">
            Used only for global context, not for NER risk numbers.
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataSourceNotice;