import { Link, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", icon: "ti-home", label: "Dashboard" },
  { to: "/analytics", icon: "ti-map-pin", label: "State Analytics" },
  { to: "/comparison", icon: "ti-arrows-diff", label: "State Comparison" },
  { to: "/filter", icon: "ti-adjustments-horizontal", label: "Filter Explorer" },
  { to: "/query-lab", icon: "ti-terminal-2", label: "Query Lab" },
  { to: "/data-sources", icon: "ti-database", label: "Data Sources" },
];

function Sidebar() {
  const location = useLocation();

  return (
    <>
      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 14px;
          border-radius: 9px;
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 400;
          transition: background 0.15s, color 0.15s;
        }
        .sidebar-link:hover {
          background: rgba(56,189,248,0.08);
          color: #e2e8f0;
        }
        .sidebar-link.active {
          background: rgba(56,189,248,0.13);
          color: #38bdf8;
          font-weight: 500;
        }
        .sidebar-link i {
          font-size: 17px;
          flex-shrink: 0;
        }
        .sidebar-divider {
          height: 0.5px;
          background: #1e3a5f;
          margin: 18px 0;
        }
      `}</style>

      <div style={{
        width: "240px",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        background: "#0b1525",
        padding: "28px 18px",
        color: "white",
        borderRight: "0.5px solid #1e3a5f",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: "0 6px", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "rgba(56,189,248,0.15)",
              border: "0.5px solid rgba(56,189,248,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <i className="ti ti-car-crash" style={{ color: "#38bdf8", fontSize: "17px" }} />
            </div>
            <span style={{ fontSize: "15px", fontWeight: "500", color: "#e2e8f0", letterSpacing: "-0.01em" }}>
              AccidentAtlas
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "#475569", paddingLeft: "42px" }}>
            Germany Open Data
          </span>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1 }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 14px", marginBottom: "6px" }}>
            Navigation
          </div>
          {navItems.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`sidebar-link${location.pathname === to ? " active" : ""}`}
            >
              <i className={`ti ${icon}`} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          borderTop: "0.5px solid #1e3a5f",
          paddingTop: "18px",
          fontSize: "11px",
          color: "#334155",
          lineHeight: "1.6"
        }}>
          <div style={{ color: "#475569", marginBottom: "2px" }}>Data sources</div>
          <div>Unfallatlas · Destatis</div>
          <div>GENESIS · Regionalatlas</div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;