import { useEffect, useState, FormEvent } from 'react';
import { API_BASE } from '../api';

// ============================================================
// TYPES
// ============================================================

type IncidentReport = {
  id: number;
  title: string;
  incident_type: string;
  severity: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  reporter_name: string | null;
  reporter_phone: string | null;
  flagged: boolean;
  status: string;
  created_at: string;
};

type FormState = {
  title: string;
  incident_type: string;
  severity: string;
  location_name: string;
  latitude: string;
  longitude: string;
  description: string;
  reporter_name: string;
  reporter_phone: string;
};

const EMPTY_FORM: FormState = {
  title: '',
  incident_type: 'landslide',
  severity: 'moderate',
  location_name: '',
  latitude: '',
  longitude: '',
  description: '',
  reporter_name: '',
  reporter_phone: '',
};

const severityColor = (severity: string) => {
  if (severity === 'critical') return '#ff1717';
  if (severity === 'high') return '#ff9f00';
  if (severity === 'moderate') return '#fff000';
  return '#51e800';
};

// ============================================================
// PAGE
// ============================================================

function Reports() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/reports`);
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }
      const data = await response.json();
      setReports(data.reports ?? []);
      setError('');
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Unable to reach the reports API. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField('latitude', position.coords.latitude.toFixed(5));
        updateField('longitude', position.coords.longitude.toFixed(5));
      },
      () => {
        setSubmitError('Could not fetch GPS location. Enter it manually.');
      }
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitted(false);

    if (!form.title || !form.location_name || !form.description) {
      setSubmitError('Title, location and description are required.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: form.title,
        incident_type: form.incident_type,
        severity: form.severity,
        location_name: form.location_name,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        description: form.description,
        reporter_name: form.reporter_name || null,
        reporter_phone: form.reporter_phone || null,
      };

      const response = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ? JSON.stringify(body.detail) : `Backend returned ${response.status}`);
      }

      setForm(EMPTY_FORM);
      setSubmitted(true);
      await loadReports();
    } catch (err) {
      console.error('Failed to submit report:', err);
      setSubmitError('Could not submit the report. Check the fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Field Incident Report</h1>
        <p>Report active landslides, cracks, slope failures, or road blockages directly to emergency responders.</p>
      </header>

      <div className="reports-layout">
        {/* ================= FORM ================= */}
        <form className="report-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Incident Title *
              <input
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="e.g. Mudslide near NH-6 Highway"
              />
            </label>
          </div>

          <div className="form-row form-row-split">
            <label>
              Incident Type
              <select
                value={form.incident_type}
                onChange={(event) => updateField('incident_type', event.target.value)}
              >
                <option value="landslide">Landslide</option>
                <option value="rockfall">Rockfall</option>
                <option value="road_blockage">Road blockage</option>
                <option value="crack">Ground crack</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              Severity Level
              <select
                value={form.severity}
                onChange={(event) => updateField('severity', event.target.value)}
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High - Serious danger</option>
                <option value="critical">Critical</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Location / Landmark *
              <input
                value={form.location_name}
                onChange={(event) => updateField('location_name', event.target.value)}
                placeholder="e.g. East Khasi Hills, Meghalaya"
              />
            </label>
          </div>

          <div className="form-row form-row-split">
            <label>
              Latitude
              <input
                value={form.latitude}
                onChange={(event) => updateField('latitude', event.target.value)}
                placeholder="25.50"
              />
            </label>
            <label>
              Longitude
              <input
                value={form.longitude}
                onChange={(event) => updateField('longitude', event.target.value)}
                placeholder="91.80"
              />
            </label>
            <button type="button" className="ghost-btn" onClick={useMyLocation}>
              📍 Get My Location
            </button>
          </div>

          <div className="form-row">
            <label>
              Detailed Description *
              <textarea
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Describe soil stability, active movements, weather conditions, or immediate risks..."
                rows={4}
              />
            </label>
          </div>

          <div className="form-row form-row-split">
            <label>
              Your Name (Optional)
              <input
                value={form.reporter_name}
                onChange={(event) => updateField('reporter_name', event.target.value)}
              />
            </label>
            <label>
              Phone Number (Optional)
              <input
                value={form.reporter_phone}
                onChange={(event) => updateField('reporter_phone', event.target.value)}
              />
            </label>
          </div>

          {submitError && <div className="form-error">{submitError}</div>}
          {submitted && <div className="form-success">Report submitted. Thank you.</div>}

          <button type="submit" className="primary-btn" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>

        {/* ================= LIST ================= */}
        <div className="reports-list">
          <div className="reports-list-header">
            <h2>Recent Submissions</h2>
            <button className="ghost-btn small" onClick={loadReports}>
              ↻ Refresh
            </button>
          </div>

          {loading && <p className="muted">Loading reports…</p>}
          {error && <p className="form-error">{error}</p>}
          {!loading && !error && reports.length === 0 && (
            <p className="muted">No reports submitted yet.</p>
          )}

          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-card-top">
                <strong>{report.title}</strong>
                <span
                  className="severity-pill"
                  style={{ background: severityColor(report.severity) }}
                >
                  {report.severity.toUpperCase()}
                </span>
              </div>
              <div className="muted">{report.location_name}</div>
              <p>{report.description}</p>
              <div className="report-card-meta">
                <span>{report.status}</span>
                {report.flagged && <span className="flagged-pill">FLAGGED</span>}
                <span>{new Date(report.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Reports;