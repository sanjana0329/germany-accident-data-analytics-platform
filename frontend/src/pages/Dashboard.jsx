import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import GermanyHeatMap from "../components/GermanyHeatMap";

const W = "240px";

const css = `
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  .d-feat {
    background:#1e293b; border:0.5px solid #1e3a5f; border-radius:12px; padding:20px;
    transition:border-color 0.2s, transform 0.2s;
  }
  .d-feat:hover { border-color:rgba(56,189,248,0.35); transform:translateY(-2px); }
  .d-feat-icon {
    width:38px; height:38px; border-radius:9px;
    background:rgba(56,189,248,0.1);
    display:flex; align-items:center; justify-content:center; margin-bottom:13px;
  }
  .d-feat-icon i { color:#38bdf8; font-size:19px; }
  .d-source { background:#1e293b; border:0.5px solid #1e3a5f; border-radius:11px; padding:18px; }
  .d-step { background:#111827; border:0.5px solid #1e3a5f; border-radius:10px; padding:16px 12px; text-align:center; }
  .d-step-num {
    width:28px; height:28px; border-radius:50%;
    background:#2563eb; color:white; font-size:12px; font-weight:500;
    display:flex; align-items:center; justify-content:center; margin:0 auto 10px;
  }
  .d-fi {
    display:flex; align-items:center; gap:10px;
    padding:9px 0; border-bottom:0.5px solid #1e3a5f;
    color:#94a3b8; font-size:13px;
  }
  .d-fi:last-child { border-bottom:none; }
  .d-fi i { color:#22d3ee; font-size:14px; flex-shrink:0; }

  .d-quicklink {
    display:flex; align-items:center; gap:10px;
    background:#1e293b; border:0.5px solid #1e3a5f; border-radius:10px;
    padding:14px 18px; text-decoration:none;
    transition:border-color 0.15s, background 0.15s;
    cursor:pointer;
  }
  .d-quicklink:hover { border-color:rgba(56,189,248,0.4); background:rgba(56,189,248,0.05); }
  .d-quicklink-icon { width:32px; height:32px; border-radius:8px; background:rgba(56,189,248,0.1); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .d-quicklink-icon i { color:#38bdf8; font-size:16px; }
`;

const STATS = [
  { icon:"ti-car-crash", color:"#f87171", label:"Total accidents", value:"1.2M+",    sub:"across all states" },
  { icon:"ti-calendar",  color:"#38bdf8", label:"Years covered",   value:"2020–2024", sub:"5 years of data" },
  { icon:"ti-map-2",     color:"#4ade80", label:"Federal states",  value:"16",        sub:"all Bundesländer" },
  { icon:"ti-database",  color:"#a78bfa", label:"Data sources",    value:"4",         sub:"integrated & harmonised" },
];

const FEATURES = [
  { icon:"ti-chart-bar",            title:"State analytics",      text:"Accident totals, injury categories, monthly trends and weekday distributions per state." },
  { icon:"ti-map",                  title:"Interactive map",       text:"Click any state on the Germany map to instantly load state-specific insights." },
  { icon:"ti-terminal-2",           title:"Query lab",             text:"Run analytical questions — fatal districts, pedestrian hotspots and peak hours." },
  { icon:"ti-arrows-diff",          title:"State comparison",      text:"Compare all states by total accidents, fatalities, road users and injury severity." },
  { icon:"ti-bike",                 title:"Road user insights",    text:"Analyse cars, bicycles, motorcycles, pedestrians and goods vehicles." },
  { icon:"ti-shield-check",         title:"Official data sources", text:"Datasets from Unfallatlas, Destatis, GENESIS and Regionalatlas — verified and harmonised." },
];

const SOURCES = [
  { title:"Unfallatlas",   text:"Official accident location dataset with point data by year." },
  { title:"Destatis",      text:"Federal Statistical Office — population and regional figures." },
  { title:"GENESIS",       text:"Statistical database via RESTful JSON API." },
  { title:"Regionalatlas", text:"Regional demographic and infrastructure indicators." },
];

const QUICKLINKS = [
  { to:"/analytics",  icon:"ti-map-pin",      label:"State analytics",  desc:"Explore any federal state" },
  { to:"/query-lab",  icon:"ti-terminal-2",   label:"Query lab",        desc:"Run predefined queries" },
  { to:"/comparison", icon:"ti-arrows-diff",  label:"State comparison", desc:"Compare all 16 states" },
  { to:"/filter",     icon:"ti-adjustments-horizontal", label:"Filter explorer", desc:"Custom data slicing" },
];

function Dashboard() {
  return (
    <>
      <style>{css}</style>
      <Sidebar />

      <div style={{ marginLeft:W, minHeight:"100vh", padding:"32px 36px", background:"#0f172a", color:"white" }}>

        {/* ── HERO (no buttons) ── */}
        <div style={{
          background:"linear-gradient(135deg,#0c2340 0%,#0f172a 60%)",
          border:"0.5px solid #1e3a5f", borderRadius:"16px",
          padding:"40px 44px", marginBottom:"24px",
          position:"relative", overflow:"hidden",
        }}>
          <div style={{ position:"absolute", right:"-80px", top:"-80px", width:"320px", height:"320px", borderRadius:"50%", background:"rgba(56,189,248,0.05)", pointerEvents:"none" }} />
          <div style={{
            display:"inline-block",
            background:"rgba(56,189,248,0.12)", border:"0.5px solid rgba(56,189,248,0.3)",
            color:"#38bdf8", fontSize:"11px", padding:"4px 12px", borderRadius:"99px",
            marginBottom:"16px", letterSpacing:"0.06em", textTransform:"uppercase",
          }}>
            Germany Open Data Platform
          </div>
          <h1 style={{ fontSize:"30px", fontWeight:"500", marginBottom:"10px", color:"white", lineHeight:"1.3" }}>
            Accident Data Analytics
          </h1>
          <p style={{ color:"#64748b", fontSize:"15px", maxWidth:"560px", lineHeight:"1.8", marginBottom:"20px" }}>
            Explore German road accident data through interactive maps, visual analytics,
            state comparisons, and accident pattern discovery — powered by official open data.
          </p>
          {/* subtle data coverage line instead of buttons */}
          <div style={{ display:"flex", alignItems:"center", gap:"18px", flexWrap:"wrap" }}>
            {[
              ["ti-calendar-stats", "Data: 2020 – 2024"],
              ["ti-map-2",          "16 federal states"],
              ["ti-refresh",        "Official open data"],
            ].map(([icon, text]) => (
              <span key={text} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:"#475569" }}>
                <i className={`ti ${icon}`} style={{ fontSize:"13px", color:"#334155" }} aria-hidden="true" />
                {text}
              </span>
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"24px" }}>
          {STATS.map(({ icon, color, label, value, sub }) => (
            <div key={label} style={{ background:"#1e293b", border:"0.5px solid #1e3a5f", borderRadius:"12px", padding:"20px" }}>
              <i className={`ti ${icon}`} style={{ color, fontSize:"20px" }} aria-hidden="true" />
              <div style={{ fontSize:"11px", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em", marginTop:"10px", marginBottom:"5px" }}>{label}</div>
              <div style={{ fontSize:"20px", fontWeight:"500", color:"white" }}>{value}</div>
              <div style={{ fontSize:"12px", color:"#38bdf8", marginTop:"3px" }}>{sub}</div>
            </div>
          ))}
        </div>


        <div style={{ fontSize:"10px", color:"#475569", fontWeight:"500", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"14px" }}>
          Quick access
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"24px" }}>
          {QUICKLINKS.map(({ to, icon, label, desc }) => (
            <Link key={to} to={to} className="d-quicklink">
              <div className="d-quicklink-icon">
                <i className={`ti ${icon}`} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize:"13px", fontWeight:"500", color:"#e2e8f0", marginBottom:"2px" }}>{label}</div>
                <div style={{ fontSize:"11px", color:"#64748b" }}>{desc}</div>
              </div>
              <i className="ti ti-chevron-right" style={{ color:"#334155", fontSize:"14px", marginLeft:"auto" }} aria-hidden="true" />
            </Link>
          ))}
        </div>

        {/* ── MAP + CAPABILITIES ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1.3fr 1fr", gap:"18px", marginBottom:"24px" }}>
          <div style={{ background:"#1e293b", border:"0.5px solid #1e3a5f", borderRadius:"14px", padding:"24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
              <i className="ti ti-map-pin" style={{ color:"#38bdf8", fontSize:"16px" }} aria-hidden="true" />
              <span style={{ fontSize:"14px", fontWeight:"500", color:"#e2e8f0" }}>Germany accident explorer</span>
            </div>
            <p style={{ fontSize:"13px", color:"#64748b", marginBottom:"18px", lineHeight:"1.6" }}>
              Click any state to view detailed statistics and visual patterns.
            </p>
            <GermanyHeatMap />
            <div style={{ display:"flex", gap:"18px", marginTop:"14px", justifyContent:"center" }}>
              {[["#22c55e","Low"],["#eab308","Medium"],["#f97316","High"],["#ef4444","Very high"]].map(([c,l]) => (
                <span key={l} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"11px", color:"#64748b" }}>
                  <span style={{ width:"9px", height:"9px", borderRadius:"2px", background:c, display:"inline-block" }} />
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div style={{ background:"#1e293b", border:"0.5px solid #1e3a5f", borderRadius:"14px", padding:"24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"18px" }}>
              <i className="ti ti-list-check" style={{ color:"#38bdf8", fontSize:"16px" }} aria-hidden="true" />
              <span style={{ fontSize:"14px", fontWeight:"500", color:"#e2e8f0" }}>What you can do</span>
            </div>
            {[
              ["ti-chart-bar",             "Explore accident trends by German state"],
              ["ti-arrows-diff",           "Compare states by accident type"],
              ["ti-bike",                  "Analyse cars, bicycles, pedestrians & motorcycles"],
              ["ti-calendar",              "Study monthly and weekday accident patterns"],
              ["ti-terminal-2",            "Run predefined analytical queries"],
              ["ti-adjustments-horizontal","Filter data by category, month and state"],
            ].map(([icon, text]) => (
              <div key={text} className="d-fi">
                <i className={`ti ${icon}`} aria-hidden="true" />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* ── PLATFORM FEATURES ── */}
        <div style={{ fontSize:"10px", color:"#475569", fontWeight:"500", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"14px" }}>
          Platform features
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px", marginBottom:"24px" }}>
          {FEATURES.map(({ icon, title, text }) => (
            <div key={title} className="d-feat">
              <div className="d-feat-icon"><i className={`ti ${icon}`} aria-hidden="true" /></div>
              <h3 style={{ fontSize:"14px", fontWeight:"500", color:"#e2e8f0", marginBottom:"7px" }}>{title}</h3>
              <p style={{ fontSize:"13px", color:"#64748b", lineHeight:"1.65" }}>{text}</p>
            </div>
          ))}
        </div>

        {/* ── STEPS ── */}
        <div style={{ background:"#1e293b", border:"0.5px solid #1e3a5f", borderRadius:"14px", padding:"24px", marginBottom:"24px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"20px" }}>
            <i className="ti ti-route" style={{ color:"#38bdf8", fontSize:"16px" }} aria-hidden="true" />
            <span style={{ fontSize:"14px", fontWeight:"500", color:"#e2e8f0" }}>How to use the platform</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"12px" }}>
            {["Open dashboard","Choose analytics","Select a state","Explore charts","Compare states"].map((t, i) => (
              <div key={t} className="d-step">
                <div className="d-step-num">{i + 1}</div>
                <p style={{ fontSize:"12px", color:"#94a3b8", lineHeight:"1.5" }}>{t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SOURCES ── */}
        <div style={{ fontSize:"10px", color:"#475569", fontWeight:"500", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"14px" }}>
          Official data sources
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"24px" }}>
          {SOURCES.map(({ title, text }) => (
            <div key={title} className="d-source">
              <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#38bdf8", marginBottom:"10px" }} />
              <h4 style={{ fontSize:"13px", fontWeight:"500", color:"#e2e8f0", marginBottom:"5px" }}>{title}</h4>
              <p style={{ fontSize:"12px", color:"#64748b", lineHeight:"1.55" }}>{text}</p>
            </div>
          ))}
        </div>

        {/* ── DISCLAIMER ── */}
        <div style={{
          background:"rgba(251,191,36,0.07)", border:"0.5px solid rgba(251,191,36,0.25)",
          borderRadius:"12px", padding:"20px 24px", marginBottom:"24px",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
            <i className="ti ti-alert-triangle" style={{ color:"#fbbf24", fontSize:"16px" }} aria-hidden="true" />
            <span style={{ fontSize:"13px", fontWeight:"500", color:"#fde68a" }}>Academic disclaimer</span>
          </div>
          <p style={{ fontSize:"13px", color:"#d97706", lineHeight:"1.75" }}>
            This platform was developed for educational purposes using publicly available German Open Data
            (Unfallatlas, Destatis, GENESIS, Regionalatlas). It is not an official government reporting system.
            For authoritative statistics, consult the original data providers.
          </p>
        </div>

        <p style={{ textAlign:"center", fontSize:"12px", color:"#334155", paddingTop:"10px", borderTop:"0.5px solid #1e293b" }}>
          Built with React · FastAPI · Python · PostgreSQL — Web Engineering Project, TU Chemnitz
        </p>
      </div>
    </>
  );
}

export default Dashboard;