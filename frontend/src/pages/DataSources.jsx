import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const SIDEBAR_W = "240px";
const API_ACC  = "http://localhost:8000/api";
const API_META = "http://localhost:8000/metadata";

const css = `
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  .ds-row {
    display: grid; grid-template-columns: 2fr 1fr 1.2fr 1.3fr;
    gap: 0; align-items: center; padding: 14px 18px;
    border-bottom: 0.5px solid #111827; transition: background 0.12s;
  }
  .ds-row:hover { background: rgba(56,189,248,0.03); }
  .ds-row:last-child { border-bottom: none; }
  .ds-head { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.07em; font-weight:500; }
  .ds-source-card { background:#1e293b; border:0.5px solid #1e3a5f; border-radius:12px; padding:20px; transition:border-color 0.15s; }
  .ds-source-card:hover { border-color:rgba(56,189,248,0.3); }
  .pulse { animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
`;

const PORTALS = [
  { icon:"ti-car-crash", color:"#f87171", bg:"rgba(248,113,113,0.1)",
    title:"Unfallatlas / OpenGeoData NRW",
    url:"https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/",
    desc:"Official accident atlas — point data per year, CSV & Shapefile downloads.",
    license:"Datenlizenz Deutschland – Namensnennung – Version 2.0" },
  { icon:"ti-database", color:"#38bdf8", bg:"rgba(56,189,248,0.1)",
    title:"GENESIS / Regionalstatistik",
    url:"https://www.regionalstatistik.de/genesis/online",
    desc:"RESTful API — population, regional indicators and accident statistics per state.",
    license:"dl-de/by-2-0" },
  { icon:"ti-map-pin", color:"#a78bfa", bg:"rgba(167,139,250,0.1)",
    title:"Regionalatlas Deutschland",
    url:"https://regionalatlas.statistikportal.de/",
    desc:"GeoJSON / Shapefile geometry and thematic demographic indicators.",
    license:"dl-de/by-2-0" },
  { icon:"ti-building", color:"#4ade80", bg:"rgba(74,222,128,0.1)",
    title:"AGS / GV-ISys (Destatis)",
    url:"https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/",
    desc:"Official 8-digit region keys (AGS) used to join all datasets.",
    license:"dl-de/by-2-0" },
];

function Skeleton({ w="100%", h=14 }) {
  return <div className="pulse" style={{ width:w, height:h, borderRadius:4, background:"rgba(255,255,255,0.06)" }} />;
}

export default function DataSources() {
  const [summary,   setSummary]   = useState(null);
  const [sources,   setSources]   = useState([]);
  const [minYear,   setMinYear]   = useState(null);
  const [maxYear,   setMaxYear]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [updating,  setUpdating]  = useState(false);
  const [error,     setError]     = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [sumRes, srcRes, minRes, maxRes] = await Promise.all([
        fetch(`${API_ACC}/summary`),
        fetch(`${API_META}/sources`),
        fetch(`${API_ACC}/queries/earliest-year`),
        fetch(`${API_ACC}/queries/latest-year`),
      ]);

      if (!sumRes.ok) throw new Error(`/api/summary: ${sumRes.status}`);
      if (!srcRes.ok) throw new Error(`/metadata/sources: ${srcRes.status}`);

      setSummary(await sumRes.json());
      setSources(await srcRes.json());

      if (minRes.ok) { const d = await minRes.json(); setMinYear(d.earliest_year); }
      if (maxRes.ok) { const d = await maxRes.json(); setMaxYear(d.latest_year); }

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function triggerUpdate() {
    setUpdating(true);
    try {
      const res = await fetch(`${API_META}/update?source=all`, { method: "POST" });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      setTimeout(() => { loadAll(); setUpdating(false); }, 4000);
    } catch (e) {
      setError(e.message);
      setUpdating(false);
    }
  }

  const totalAccidents = summary ? Number(summary.total_accidents).toLocaleString() : null;
  const totalRegions   = summary ? Number(summary.total_regions).toLocaleString()   : null;
  const yearRange      = minYear && maxYear ? `${minYear}–${maxYear}` : null;
  const lastFetched    = sources.length
    ? (() => {
        const dates = sources.filter(s => s.last_fetched).map(s => new Date(s.last_fetched));
        return dates.length ? new Date(Math.max(...dates)).toLocaleDateString() : null;
      })()
    : null;

  const stats = [
    { icon:"ti-car-crash",    color:"#f87171", label:"Total accidents", value: totalAccidents },
    { icon:"ti-map-2",        color:"#a78bfa", label:"Total regions",   value: totalRegions },
    { icon:"ti-calendar",     color:"#fbbf24", label:"Years covered",   value: yearRange },
    { icon:"ti-clock-hour-4", color:"#38bdf8", label:"Last updated",    value: lastFetched },
  ];

  return (
    <>
      <style>{css}</style>
      <Sidebar />
      <div style={{ marginLeft:SIDEBAR_W, padding:"32px 36px", minHeight:"100vh", background:"#0f172a", color:"white" }}>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
          <div>
            <h1 style={{ fontSize:"22px", fontWeight:"500", color:"white", marginBottom:"4px" }}>Data sources</h1>
            <p style={{ fontSize:"13px", color:"#64748b" }}>All numbers are live from your database</p>
          </div>
          <button onClick={triggerUpdate} disabled={updating} style={{
            display:"flex", alignItems:"center", gap:"6px",
            background: updating ? "#1e3a5f" : "#1d4ed8",
            color:"white", border:"none", borderRadius:"8px",
            padding:"8px 16px", fontSize:"13px", cursor: updating ? "not-allowed" : "pointer",
          }}>
            <i className={`ti ti-refresh ${updating ? "pulse" : ""}`} style={{ fontSize:"14px" }} aria-hidden="true" />
            {updating ? "Updating…" : "Refresh live data"}
          </button>
        </div>

        {error && (
          <div style={{ background:"rgba(248,113,113,0.1)", border:"0.5px solid #f87171", borderRadius:"8px", padding:"12px 16px", marginBottom:"16px", fontSize:"13px", color:"#f87171" }}>
            <i className="ti ti-alert-circle" aria-hidden="true" /> {error}
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"24px" }}>
          {stats.map(({ icon, color, label, value }) => (
            <div key={label} style={{ background:"#1e293b", border:"0.5px solid #1e3a5f", borderRadius:"12px", padding:"18px 20px" }}>
              <i className={`ti ${icon}`} style={{ color, fontSize:"18px" }} aria-hidden="true" />
              <div style={{ fontSize:"11px", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em", marginTop:"10px", marginBottom:"4px" }}>{label}</div>
              {loading || value === null
                ? <Skeleton w="60%" h={22} />
                : <div style={{ fontSize:"18px", fontWeight:"500", color:"white" }}>{value ?? "—"}</div>
              }
            </div>
          ))}
        </div>

        {/* Registered sources */}
        <div style={{ background:"#1e293b", border:"0.5px solid #1e3a5f", borderRadius:"14px", overflow:"hidden", marginBottom:"22px" }}>
          <div style={{ padding:"18px 18px 0", display:"flex", alignItems:"center", gap:"8px", marginBottom:"14px" }}>
            <i className="ti ti-database" style={{ color:"#38bdf8", fontSize:"15px" }} aria-hidden="true" />
            <span style={{ fontSize:"14px", fontWeight:"500", color:"#e2e8f0" }}>Registered data sources</span>
            <span style={{ marginLeft:"auto", fontSize:"11px", color:"#475569" }}>provenance from sources table</span>
          </div>
          <div className="ds-row" style={{ background:"#111827", borderBottom:"0.5px solid #1e3a5f" }}>
            <span className="ds-head">Source</span>
            <span className="ds-head">Last fetched</span>
            <span className="ds-head">License</span>
            <span className="ds-head">URL</span>
          </div>
          {loading
            ? [1,2,3].map(i => (
              <div className="ds-row" key={i}>
                <Skeleton w="70%" /><Skeleton w="50%" /><Skeleton w="80%" /><Skeleton w="60%" />
              </div>
            ))
            : sources.length === 0
              ? <div style={{ padding:"24px 18px", color:"#475569", fontSize:"13px" }}>No sources yet — run <code>python etl/update.py</code></div>
              : sources.map(s => (
                <div className="ds-row" key={s.source_id}>
                  <div style={{ fontSize:"13px", fontWeight:"500", color:"#e2e8f0" }}>{s.name}</div>
                  <div style={{ fontSize:"12px", color:"#64748b" }}>
                    {s.last_fetched ? new Date(s.last_fetched).toLocaleString() : "—"}
                  </div>
                  <div style={{ fontSize:"11px", color:"#475569" }}>{s.license || "—"}</div>
                  <a href={s.url} target="_blank" rel="noreferrer"
                    style={{ fontSize:"11px", color:"#38bdf8", textDecoration:"none", display:"flex", alignItems:"center", gap:"3px" }}>
                    <i className="ti ti-external-link" style={{ fontSize:"11px" }} aria-hidden="true" />
                    {s.url ? (() => { try { return new URL(s.url).hostname; } catch { return s.url; } })() : "—"}
                  </a>
                </div>
              ))
          }
        </div>

        {/* Portal cards */}
        <div style={{ fontSize:"11px", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"14px" }}>
          External portals &amp; licences
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"14px", marginBottom:"24px" }}>
          {PORTALS.map(s => (
            <div key={s.title} className="ds-source-card">
              <div style={{ display:"flex", alignItems:"flex-start", gap:"12px" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:s.bg, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <i className={`ti ${s.icon}`} style={{ color:s.color, fontSize:"18px" }} aria-hidden="true" />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"5px" }}>
                    <span style={{ fontSize:"14px", fontWeight:"500", color:"#e2e8f0" }}>{s.title}</span>
                    <a href={s.url} target="_blank" rel="noreferrer"
                      style={{ color:"#38bdf8", fontSize:"12px", textDecoration:"none", display:"flex", alignItems:"center", gap:"3px" }}>
                      <i className="ti ti-external-link" style={{ fontSize:"12px" }} aria-hidden="true" />Visit
                    </a>
                  </div>
                  <p style={{ fontSize:"12px", color:"#64748b", lineHeight:"1.6", marginBottom:"10px" }}>{s.desc}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                    <i className="ti ti-license" style={{ fontSize:"12px", color:"#475569" }} aria-hidden="true" />
                    <span style={{ fontSize:"11px", color:"#475569" }}>{s.license}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div style={{ background:"rgba(56,189,248,0.05)", border:"0.5px solid rgba(56,189,248,0.2)", borderRadius:"10px", padding:"16px 20px", display:"flex", alignItems:"flex-start", gap:"10px" }}>
          <i className="ti ti-info-circle" style={{ color:"#38bdf8", fontSize:"16px", flexShrink:0, marginTop:"1px" }} aria-hidden="true" />
          <p style={{ fontSize:"13px", color:"#64748b", lineHeight:"1.7", margin:0 }}>
            All numbers are fetched live from your PostgreSQL database. Provenance — source URL, retrieval date and licence — is stored in the <code style={{ color:"#94a3b8" }}>sources</code> table and transmitted with every API response.
          </p>
        </div>
      </div>
    </>
  );
}