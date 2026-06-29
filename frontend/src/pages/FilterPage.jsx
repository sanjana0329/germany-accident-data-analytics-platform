import { useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

const SIDEBAR_W = "240px";

const css = `
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');

  .fp-select {
    width: 100%;
    background: #111827;
    border: 0.5px solid #334155;
    border-radius: 8px;
    color: #e2e8f0;
    padding: 10px 14px;
    font-size: 13px;
    cursor: pointer;
    outline: none;
    appearance: none;
  }
  .fp-select:focus { border-color: #38bdf8; }

  .fp-label {
    display: block;
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 7px;
  }

  .fp-apply-btn {
    background: #2563eb;
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: background 0.15s;
    margin-top: 22px;
  }
  .fp-apply-btn:hover { background: #1d4ed8; }

  .fp-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(56,189,248,0.1);
    border: 0.5px solid rgba(56,189,248,0.25);
    color: #38bdf8;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 99px;
  }
`;

const MONTHS = {
  "":"All months",1:"January",2:"February",3:"March",4:"April",5:"May",
  6:"June",7:"July",8:"August",9:"September",10:"October",11:"November",12:"December",
};
const CATEGORIES = { "":"All categories", 1:"Fatal accident", 2:"Serious injury", 3:"Minor injury" };
const STATES = {
  "":"All states","01":"Schleswig-Holstein","02":"Hamburg","03":"Lower Saxony",
  "04":"Bremen","05":"North Rhine-Westphalia","06":"Hesse","07":"Rhineland-Palatinate",
  "08":"Baden-Württemberg","09":"Bavaria","10":"Saarland","11":"Berlin",
  "12":"Brandenburg","13":"Mecklenburg-Western Pomerania","14":"Saxony",
  "15":"Saxony-Anhalt","16":"Thuringia",
};

const CAT_COLOR = { 1: "#f87171", 2: "#fbbf24", 3: "#4ade80" };
const CAT_ICON  = { 1: "ti-skull", 2: "ti-ambulance", 3: "ti-shield" };

function FilterPage() {
  const [month, setMonth]       = useState("");
  const [category, setCategory] = useState("");
  const [landCode, setLandCode] = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);

  const applyFilter = () => {
    setLoading(true);
    api.get("/accidents/filter", {
      params: {
        month: month || undefined,
        category: category || undefined,
        land_code: landCode || undefined,
      }
    })
    .then(r => { setResult(r.data); setLoading(false); })
    .catch(() => setLoading(false));
  };

  return (
    <>
      <style>{css}</style>
      <Sidebar />

      <div style={{
        marginLeft: SIDEBAR_W,
        padding: "32px 36px",
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
      }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "500", color: "white", marginBottom: "4px" }}>
            Filter explorer
          </h1>
          <p style={{ fontSize: "13px", color: "#64748b" }}>
            Slice the accident dataset by month, category and state
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", alignItems: "start" }}>

          {/* Filter panel */}
          <div style={{
            background: "#1e293b",
            border: "0.5px solid #1e3a5f",
            borderRadius: "14px",
            padding: "24px",
            position: "sticky",
            top: "24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "22px" }}>
              <i className="ti ti-adjustments-horizontal" style={{ color: "#38bdf8", fontSize: "16px" }} aria-hidden="true" />
              <span style={{ fontSize: "14px", fontWeight: "500", color: "#e2e8f0" }}>Filters</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="fp-label">Month</label>
                <select className="fp-select" value={month} onChange={e => setMonth(e.target.value)}>
                  {Object.entries(MONTHS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="fp-label">Accident category</label>
                <select className="fp-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="fp-label">Federal state</label>
                <select className="fp-select" value={landCode} onChange={e => setLandCode(e.target.value)}>
                  {Object.entries(STATES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            <button className="fp-apply-btn" onClick={applyFilter} disabled={loading}>
              {loading
                ? <><i className="ti ti-loader-2" style={{ fontSize: "15px" }} aria-hidden="true" /> Loading…</>
                : <><i className="ti ti-search" style={{ fontSize: "15px" }} aria-hidden="true" /> Apply filter</>
              }
            </button>
          </div>

          {/* Result panel */}
          <div>
            {!result ? (
              <div style={{
                background: "#1e293b",
                border: "0.5px dashed #334155",
                borderRadius: "14px",
                padding: "80px 24px",
                textAlign: "center",
              }}>
                <i className="ti ti-filter" style={{ fontSize: "38px", color: "#334155", display: "block", marginBottom: "14px" }} aria-hidden="true" />
                <p style={{ fontSize: "14px", color: "#475569" }}>
                  Set your filters and click <strong style={{ color: "#64748b" }}>Apply filter</strong>
                </p>
              </div>
            ) : (
              <div style={{
                background: "#1e293b",
                border: "0.5px solid #1e3a5f",
                borderRadius: "14px",
                padding: "28px",
              }}>
                {/* Active filters */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>
                    Active filters
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span className="fp-tag">
                      <i className="ti ti-calendar" style={{ fontSize: "13px" }} aria-hidden="true" />
                      {MONTHS[month] || "All months"}
                    </span>
                    <span className="fp-tag">
                      <i className="ti ti-car-crash" style={{ fontSize: "13px" }} aria-hidden="true" />
                      {CATEGORIES[category] || "All categories"}
                    </span>
                    <span className="fp-tag">
                      <i className="ti ti-map-pin" style={{ fontSize: "13px" }} aria-hidden="true" />
                      {STATES[landCode] || "All states"}
                    </span>
                  </div>
                </div>

                {/* Big number */}
                <div style={{
                  background: "#111827",
                  border: "0.5px solid #1e3a5f",
                  borderRadius: "12px",
                  padding: "32px",
                  textAlign: "center",
                  marginBottom: "20px",
                }}>
                  <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>
                    Total accidents matching filters
                  </div>
                  <div style={{ fontSize: "52px", fontWeight: "500", color: "#38bdf8", letterSpacing: "-0.02em", lineHeight: "1" }}>
                    {result.total_accidents?.toLocaleString()}
                  </div>
                </div>

                {/* Category breakdown if available */}
                {category && (
                  <div style={{
                    background: "#111827",
                    border: `0.5px solid ${CAT_COLOR[category] ?? "#1e3a5f"}22`,
                    borderLeft: `3px solid ${CAT_COLOR[category] ?? "#38bdf8"}`,
                    borderRadius: "10px",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                    <i className={`ti ${CAT_ICON[category] ?? "ti-car-crash"}`}
                       style={{ fontSize: "22px", color: CAT_COLOR[category] ?? "#38bdf8" }}
                       aria-hidden="true" />
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "2px" }}>Category</div>
                      <div style={{ fontSize: "14px", fontWeight: "500", color: "#e2e8f0" }}>{CATEGORIES[category]}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default FilterPage;