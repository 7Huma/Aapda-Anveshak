import { useState } from 'react';
import { NavLink } from 'react-router-dom';

// ============================================================
// SIDEBAR
// Overlay drawer triggered by a hamburger button, matching the
// NER-SAFE reference nav (Dashboard / Risk Map / Live Weather /
// Alerts / Reports / Settings). Fixed/overlay positioning means
// this never has to reflow the existing Dashboard page layout.
// ============================================================

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '▦', end: true },
  { to: '/risk-map', label: 'Risk Map', icon: '◈' },
  { to: '/live-weather', label: 'Live Weather', icon: '☀' },
  { to: '/alerts', label: 'Alerts', icon: '◉' },
  { to: '/reports', label: 'Reports', icon: '▤' },
  
];

function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="hamburger-btn"
        onClick={() => setOpen(true)}
        title="Menu"
        aria-label="Open navigation"
      >
        ☰
      </button>

      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)}>
          <nav
            className="sidebar-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sidebar-header">
              <div>
                <strong>Aapda Anveshak</strong>
                <small>landslideMonitoring</small>
              </div>
              <button
                className="sidebar-close"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>

            <ul className="sidebar-nav">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      isActive ? 'sidebar-link active' : 'sidebar-link'
                    }
                    onClick={() => setOpen(false)}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

export default Sidebar;