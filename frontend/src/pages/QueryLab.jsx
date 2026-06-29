import { useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

const W = "240px";

const css = `
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');

  .qcat-label {
    font-size:10px; font-weight:600; color:#475569;
    text-transform:uppercase; letter-spacing:0.09em;
    margin:18px 0 8px; padding-left:2px;
  }

  .qcard {
    background:#111827;
    border:0.5px solid #1e3a5f;
    border-radius:11px;
    padding:14px 16px;
    cursor:pointer;
    text-align:left;
    width:100%;
    transition:border-color 0.15s, background 0.15s;
    display:flex;
    align-items:flex-start;
    gap:12px;
  }
  .qcard:hover  { border-color:rgba(56,189,248,0.4); background:#0f1f36; }
  .qcard.active { border-color:#38bdf8; background:rgba(56,189,248,0.07); }

  .qcard-icon {
    width:34px; height:34px; border-radius:8px;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; margin-top:1px;
  }
  .qcard-icon i { font-size:17px; }

  .qcard-title {
    font-size:13px; font-weight:500; color:#e2e8f0;
    line-height:1.45; margin-bottom:4px;
  }
  .qcard.active .qcard-title { color:#38bdf8; }

  .qcard-desc {
    font-size:12px; color:#475569; line-height:1.55;
  }

  .run-btn {
    background:#2563eb; color:white; border:none; border-radius:9px;
    padding:11px 22px; font-size:13px; font-weight:500;
    cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px;
    transition:background 0.15s; width:100%;
  }
  .run-btn:hover   { background:#1d4ed8; }
  .run-btn:disabled { opacity:0.35; cursor:not-allowed; }

  .rtable { width:100%; border-collapse:collapse; }
  .rtable th {
    font-size:11px; color:#64748b; text-transform:uppercase;
    letter-spacing:0.07em; padding:10px 14px; text-align:left;
    border-bottom:0.5px solid #1e3a5f;
  }
  .rtable td {
    padding:12px 14px; font-size:13px; color:#e2e8f0;
    border-bottom:0.5px solid #111827;
  }
  .rtable tr:last-child td { border-bottom:none; }
  .rtable tr:hover td { background:rgba(56,189,248,0.03); }

  .rbadge {
    display:inline-flex; align-items:center; justify-content:center;
    width:22px; height:22px; border-radius:50%;
    background:#1e3a5f; color:#94a3b8;
    font-size:11px; font-weight:500;
  }
  .rbadge.g { background:rgba(251,191,36,0.15); color:#fbbf24; }
  .rbadge.s { background:rgba(148,163,184,0.15); color:#94a3b8; }
  .rbadge.b { background:rgba(180,120,80,0.15);  color:#cd7f32; }
`;

const MONTH_NAMES = {
  1:"January",2:"February",3:"March",4:"April",5:"May",6:"June",
  7:"July",8:"August",9:"September",10:"October",11:"November",12:"December",
};

const CATEGORIES = [
  {
    id: "counts",
    label: "Counts & filters",
    queries: [
      {
        id: "saxony_injury",
        title: "Personal injury accidents in Saxony (2023)",
        desc: "How many accidents involving personal injury occurred in Saxony in 2023?",
        icon: "ti-map-pin", iconBg:"rgba(251,191,36,0.12)", iconColor:"#fbbf24",
        endpoint: "/queries/personal-injury-saxony",
        crossSource: false,
      },
      {
        id: "pedestrian_berlin",
        title: "Pedestrian accidents in Berlin (2023)",
        desc: "How many accidents involving pedestrians occurred in Berlin in 2023?",
        icon: "ti-walk", iconBg:"rgba(74,222,128,0.12)", iconColor:"#4ade80",
        endpoint: "/queries/pedestrian-berlin",
        crossSource: false,
      },
    ],
  },
  {
    id: "time",
    label: "Time questions",
    queries: [
      {
        id: "earliest_year",
        title: "Earliest accident year in dataset",
        desc: "What is the earliest accident year in the complete dataset?",
        icon: "ti-calendar-time", iconBg:"rgba(167,139,250,0.12)", iconColor:"#a78bfa",
        endpoint: "/queries/earliest-year",
        crossSource: false,
      },
      {
        id: "earliest_nrw",
        title: "Data availability — North Rhine-Westphalia",
        desc: "From which year onwards is data available for North Rhine-Westphalia?",
        icon: "ti-calendar-event", iconBg:"rgba(56,189,248,0.12)", iconColor:"#38bdf8",
        endpoint: "/queries/earliest-year-state?land_code=05",
        crossSource: false,
      },
      {
        id: "earliest_mv",
        title: "Data availability — Mecklenburg-W. Pomerania",
        desc: "From which year onwards is data available for Mecklenburg-Western Pomerania?",
        icon: "ti-calendar-event", iconBg:"rgba(56,189,248,0.12)", iconColor:"#38bdf8",
        endpoint: "/queries/earliest-year-state?land_code=13",
        crossSource: false,
      },
      {
        id: "highest_month",
        title: "Highest accident month overall",
        desc: "Which month recorded the most accidents across all years and states?",
        icon: "ti-chart-line", iconBg:"rgba(56,189,248,0.12)", iconColor:"#38bdf8",
        endpoint: "/queries/highest-accident-month",
        crossSource: false,
      },
    ],
  },
  {
    id: "rates",
    label: "Rates & rankings",
    queries: [
      {
        id: "top10_rates",
        title: "Top 10 districts by accident rate per 100k",
        desc: "Accident rate per 100,000 inhabitants — combines accident counts with population data.",
        icon: "ti-chart-bar", iconBg:"rgba(248,113,113,0.12)", iconColor:"#f87171",
        endpoint: "/rates/top10",
        crossSource: true,
      },
      {
        id: "top_fatal_districts",
        title: "Top 5 districts by fatal accidents (2024)",
        desc: "Which five districts recorded the highest number of fatal accidents in 2024?",
        icon: "ti-skull", iconBg:"rgba(248,113,113,0.12)", iconColor:"#f87171",
        endpoint: "/top-fatal-districts",
        crossSource: false,
      },
    ],
  },
];

const ALL_QUERIES = CATEGORIES.flatMap(c => c.queries);

function badgeClass(i) {
  if (i === 0) return "rbadge g";
  if (i === 1) return "rbadge s";
  if (i === 2) return "rbadge b";
  return "rbadge";
}

function QueryLab() {
  const [selectedId, setSelectedId] = useState("");
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(false);

  const activeQ = ALL_QUERIES.find(q => q.id === selectedId);

  const select = (id) => {
    setSelectedId(id);
    setResult(null);
    setError(false);
  };

  const runQuery = () => {
    if (!activeQ) return;
    setResult(null);
    setError(false);
    setLoading(true);
    api.get(activeQ.endpoint)
      .then(r => { setResult(r.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  };

  return (
    <>
      <style>{css}</style>
      <Sidebar />

      <div style={{
        marginLeft: W,
        padding: "32px 36px",
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
      }}>

        {/* Header */}
        <div style={{ marginBottom:"24px" }}>
          <h1 style={{ fontSize:"22px", fontWeight:"500", color:"white", marginBottom:"4px" }}>Query lab</h1>
          <p style={{ fontSize:"13px", color:"#64748b" }}>
            Run analytical queries across all 4 official categories
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:"20px", alignItems:"start" }}>

          {/* LEFT — query list + sticky run button */}
          <div style={{ position:"sticky", top:"24px" }}>

            {/* Scrollable query list */}
            <div style={{
              background:"#1e293b",
              border:"0.5px solid #1e3a5f",
              borderRadius:"14px",
              padding:"18px 16px",
              maxHeight:"calc(100vh - 200px)",
              overflowY:"auto",
              marginBottom:"12px",
            }}>
              {/* cross-source legend */}
              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"12px", paddingBottom:"12px", borderBottom:"0.5px solid #1e3a5f" }}>
                <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#fbbf24", display:"inline-block" }} />
                <span style={{ fontSize:"11px", color:"#475569" }}>Cross-source query</span>
              </div>

              {CATEGORIES.map(cat => (
                <div key={cat.id}>
                  <div className="qcat-label">{cat.label}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
                    {cat.queries.map(q => (
                      <button
                        key={q.id}
                        className={`qcard${selectedId === q.id ? " active" : ""}`}
                        onClick={() => select(q.id)}
                      >
                        <div className="qcard-icon" style={{ background: q.iconBg }}>
                          <i className={`ti ${q.icon}`} style={{ color: q.iconColor }} aria-hidden="true" />
                        </div>
                        <div>
                          <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                            {q.crossSource && (
                              <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#fbbf24", flexShrink:0, display:"inline-block" }} />
                            )}
                            <span className="qcard-title">{q.title}</span>
                          </div>
                          <div className="qcard-desc">{q.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Run button always visible below the list */}
            <button
              className="run-btn"
              onClick={runQuery}
              disabled={!selectedId || loading}
            >
              {loading
                ? <><i className="ti ti-loader-2" style={{ fontSize:"15px" }} aria-hidden="true" />Running…</>
                : <><i className="ti ti-player-play" style={{ fontSize:"15px" }} aria-hidden="true" />Run query</>
              }
            </button>
          </div>

          {/* RIGHT — result panel */}
          <div>

            {/* Empty — nothing selected */}
            {!selectedId && (
              <div style={{ background:"#1e293b", border:"0.5px dashed #334155", borderRadius:"14px", padding:"80px 24px", textAlign:"center" }}>
                <i className="ti ti-terminal-2" style={{ fontSize:"38px", color:"#334155", display:"block", marginBottom:"14px" }} aria-hidden="true" />
                <p style={{ fontSize:"14px", color:"#475569" }}>
                  Select a query on the left, then click <strong style={{ color:"#64748b" }}>Run query</strong>
                </p>
              </div>
            )}

            {/* Selected but not yet run */}
            {selectedId && !result && !loading && !error && (
              <div style={{ background:"#1e293b", border:"0.5px solid #1e3a5f", borderRadius:"14px", padding:"60px 24px", textAlign:"center" }}>
                <div style={{ width:"52px", height:"52px", borderRadius:"12px", background: activeQ?.iconBg, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                  <i className={`ti ${activeQ?.icon}`} style={{ color: activeQ?.iconColor, fontSize:"26px" }} aria-hidden="true" />
                </div>
                <div style={{ fontSize:"15px", fontWeight:"500", color:"#e2e8f0", marginBottom:"6px" }}>{activeQ?.title}</div>
                <p style={{ fontSize:"13px", color:"#475569", maxWidth:"360px", margin:"0 auto 6px", lineHeight:"1.6" }}>{activeQ?.desc}</p>
                <p style={{ fontSize:"11px", color:"#334155", marginTop:"12px", fontFamily:"monospace" }}>{activeQ?.endpoint}</p>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ background:"#1e293b", border:"0.5px solid #1e3a5f", borderRadius:"14px", padding:"80px 24px", textAlign:"center" }}>
                <i className="ti ti-loader-2" style={{ fontSize:"32px", color:"#38bdf8", display:"block", marginBottom:"12px" }} aria-hidden="true" />
                <p style={{ fontSize:"13px", color:"#64748b" }}>Querying database…</p>
              </div>
            )}

            {/* API error */}
            {error && (
              <div style={{ background:"#1e293b", border:"0.5px solid rgba(248,113,113,0.3)", borderRadius:"14px", padding:"28px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"9px", marginBottom:"10px" }}>
                  <i className="ti ti-alert-circle" style={{ color:"#f87171", fontSize:"18px" }} aria-hidden="true" />
                  <span style={{ fontSize:"14px", fontWeight:"500", color:"#f87171" }}>Query failed</span>
                </div>
                <p style={{ fontSize:"13px", color:"#64748b", lineHeight:"1.7", marginBottom:"10px" }}>
                  The endpoint returned an error. Check that your backend has this route:
                </p>
                <code style={{ display:"block", background:"#111827", border:"0.5px solid #1e3a5f", borderRadius:"8px", padding:"12px 16px", fontSize:"12px", color:"#94a3b8", wordBreak:"break-all" }}>
                  {activeQ?.endpoint}
                </code>
              </div>
            )}

            {/* ─── RESULT RENDERERS ─── */}

            {selectedId === "saxony_injury" && result && !Array.isArray(result) && result.total_accidents && (
              <ResultCard title={activeQ.title} icon={activeQ.icon} iconColor={activeQ.iconColor} iconBg={activeQ.iconBg} crossSource={false}>
                <BigStat label="Region" value={result.region} />
                <BigStat label="Year" value={result.year} />
                <BigStat label="Total accidents" value={result.total_accidents?.toLocaleString()} accent />
              </ResultCard>
            )}

            {selectedId === "pedestrian_berlin" && result && !Array.isArray(result) && (
              <ResultCard title={activeQ.title} icon={activeQ.icon} iconColor={activeQ.iconColor} iconBg={activeQ.iconBg} crossSource={false}>
                <BigStat label="Region" value={result.region} />
                <BigStat label="Total accidents" value={result.total_accidents?.toLocaleString()} accent />
              </ResultCard>
            )}

            {selectedId === "earliest_year" && result && result.earliest_year && (
              <ResultCard title={activeQ.title} icon={activeQ.icon} iconColor={activeQ.iconColor} iconBg={activeQ.iconBg} crossSource={false}>
                <BigStat label="First year in complete dataset" value={result.earliest_year} accent />
              </ResultCard>
            )}

            {selectedId === "earliest_nrw" && result && (result.earliest_year ?? result.first_year) && (
              <ResultCard title={activeQ.title} icon={activeQ.icon} iconColor={activeQ.iconColor} iconBg={activeQ.iconBg} crossSource={false}>
                <BigStat label="State" value="North Rhine-Westphalia" />
                <BigStat label="Data available from" value={result.earliest_year ?? result.first_year} accent />
              </ResultCard>
            )}

            {selectedId === "earliest_mv" && result && (result.earliest_year ?? result.first_year) && (
              <ResultCard title={activeQ.title} icon={activeQ.icon} iconColor={activeQ.iconColor} iconBg={activeQ.iconBg} crossSource={false}>
                <BigStat label="State" value="Mecklenburg-Western Pomerania" />
                <BigStat label="Data available from" value={result.earliest_year ?? result.first_year} accent />
              </ResultCard>
            )}

            {selectedId === "highest_month" && result && !Array.isArray(result) && result.total_accidents && (
              <ResultCard title={activeQ.title} icon={activeQ.icon} iconColor={activeQ.iconColor} iconBg={activeQ.iconBg} crossSource={false}>
                <BigStat label="Month" value={MONTH_NAMES[result.month]} />
                <BigStat label="Total accidents" value={result.total_accidents?.toLocaleString()} accent />
              </ResultCard>
            )}

            {selectedId === "top10_rates" && result && Array.isArray(result) && (
              <ResultCard title={activeQ.title} icon={activeQ.icon} iconColor={activeQ.iconColor} iconBg={activeQ.iconBg} crossSource>
                <p style={{ fontSize:"12px", color:"#64748b", marginBottom:"16px", lineHeight:"1.6" }}>
                  Combines accident counts (Unfallatlas) with population data (Destatis / GENESIS).
                </p>
                <table className="rtable">
                  <thead><tr><th>#</th><th>District</th><th>Rate per 100k</th></tr></thead>
                  <tbody>
                    {result.map((item, i) => (
                      <tr key={i}>
                        <td><span className={badgeClass(i)}>{i+1}</span></td>
                        <td>{item.region}</td>
                        <td style={{ color:"#f87171", fontWeight:"500" }}>{item.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ResultCard>
            )}

            {selectedId === "top_fatal_districts" && result && Array.isArray(result) && (
              <ResultCard title={activeQ.title} icon={activeQ.icon} iconColor={activeQ.iconColor} iconBg={activeQ.iconBg} crossSource={false}>
                <table className="rtable">
                  <thead><tr><th>#</th><th>District</th><th>Fatal accidents</th></tr></thead>
                  <tbody>
                    {result.map((item, i) => (
                      <tr key={i}>
                        <td><span className={badgeClass(i)}>{i+1}</span></td>
                        <td>{item.district}</td>
                        <td style={{ color:"#f87171", fontWeight:"500" }}>{item.fatal_accidents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ResultCard>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

function ResultCard({ title, icon, iconColor, iconBg, crossSource, children }) {
  return (
    <div style={{ background:"#1e293b", border:"0.5px solid #1e3a5f", borderRadius:"14px", padding:"26px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
        <div style={{ width:"34px", height:"34px", borderRadius:"8px", background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <i className={`ti ${icon}`} style={{ color:iconColor, fontSize:"17px" }} aria-hidden="true" />
        </div>
        <span style={{ fontSize:"15px", fontWeight:"500", color:"#e2e8f0" }}>{title}</span>
      </div>
      {crossSource && (
        <div style={{ marginBottom:"16px" }}>
          <span style={{ background:"rgba(251,191,36,0.1)", border:"0.5px solid rgba(251,191,36,0.25)", color:"#fbbf24", fontSize:"11px", padding:"2px 9px", borderRadius:"99px" }}>
            Cross-source
          </span>
        </div>
      )}
      <div style={{ marginTop:"16px" }}>{children}</div>
    </div>
  );
}

function BigStat({ label, value, accent }) {
  return (
    <div style={{ background:"#111827", border:"0.5px solid #1e3a5f", borderRadius:"10px", padding:"18px 20px", marginBottom:"12px" }}>
      <div style={{ fontSize:"11px", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"6px" }}>{label}</div>
      <div style={{
        fontSize: accent ? "36px" : "18px",
        fontWeight: "500",
        color: accent ? "#38bdf8" : "#e2e8f0",
        letterSpacing: accent ? "-0.02em" : "0",
        lineHeight: "1.1",
      }}>
        {value}
      </div>
    </div>
  );
}

export default QueryLab;