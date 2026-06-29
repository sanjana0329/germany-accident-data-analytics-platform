import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

const SIDEBAR_W = "240px";

const css = `
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');

  .filter-select {
    background: #111827;
    border: 0.5px solid #334155;
    border-radius: 8px;
    color: #e2e8f0;
    padding: 9px 14px;
    font-size: 13px;
    cursor: pointer;
    outline: none;
    appearance: none;
    min-width: 160px;
  }
  .filter-select:focus { border-color: #38bdf8; }
  .apply-btn {
    background: #2563eb;
    color: white;
    border: none;
    padding: 9px 20px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }
  .apply-btn:hover { background: #1d4ed8; }
`;

const ANALYSIS_OPTS = [
  { value: "total",      label: "Total accidents" },
  { value: "fatal",      label: "Fatal accidents" },
  { value: "serious",    label: "Serious injuries" },
  { value: "minor",      label: "Minor injuries" },
  { value: "bicycle",    label: "Bicycle accidents" },
  { value: "car",        label: "Car accidents" },
  { value: "motorcycle", label: "Motorcycle accidents" },
  { value: "pedestrian", label: "Pedestrian accidents" },
];

const YEARS = ["2020","2021","2022","2023","2024"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const customTooltipStyle = {
  background: "#1e293b",
  border: "0.5px solid #334155",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#e2e8f0",
};

function StateComparison() {
  const [data, setData]             = useState([]);
  const [analysisType, setAnalysis] = useState("total");
  const [year, setYear]             = useState("");
  const [month, setMonth]           = useState("");

  const loadComparison = () => {
    api.get("/state-comparison", {
      params: { analysis_type: analysisType, year: year || undefined, month: month || undefined }
    }).then(r => setData(r.data));
  };

  useEffect(() => { loadComparison(); }, []);

  const maxVal = data.length ? Math.max(...data.map(d => d.value)) : 1;
  const activeLabel = ANALYSIS_OPTS.find(o => o.value === analysisType)?.label ?? "";

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
            State comparison
          </h1>
          <p style={{ fontSize: "13px", color: "#64748b" }}>
            Compare accident statistics across all 16 German federal states
          </p>
        </div>

        {/* Filter bar */}
        <div style={{
          background: "#1e293b",
          border: "0.5px solid #1e3a5f",
          borderRadius: "12px",
          padding: "20px 24px",
          marginBottom: "20px",
        }}>
          <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "14px" }}>
            Filters
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <select className="filter-select" value={analysisType} onChange={e => setAnalysis(e.target.value)}>
              {ANALYSIS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <select className="filter-select" value={year} onChange={e => setYear(e.target.value)}>
              <option value="">All years</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select className="filter-select" value={month} onChange={e => setMonth(e.target.value)}>
              <option value="">All months</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>

            <button className="apply-btn" onClick={loadComparison}>
              Apply filters
            </button>
          </div>
        </div>

        {/* Chart card */}
        <div style={{
          background: "#1e293b",
          border: "0.5px solid #1e3a5f",
          borderRadius: "14px",
          padding: "26px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "22px" }}>
            <i className="ti ti-arrows-diff" style={{ color: "#38bdf8", fontSize: "16px" }} aria-hidden="true" />
            <span style={{ fontSize: "14px", fontWeight: "500", color: "#e2e8f0" }}>
              {activeLabel}
              {year ? ` · ${year}` : ""}
              {month ? ` · ${MONTHS[parseInt(month) - 1]}` : ""}
            </span>
          </div>

          {data.length > 0 ? (
            <BarChart
              width={1060}
              height={580}
              data={data}
              layout="vertical"
              margin={{ left: 10, right: 30, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={{ stroke: "#1e3a5f" }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="state"
                width={190}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={customTooltipStyle}
                cursor={{ fill: "rgba(56,189,248,0.05)" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.value === maxVal ? "#38bdf8" : "#1e3a5f"}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <i className="ti ti-chart-bar" style={{ fontSize: "36px", color: "#334155", display: "block", marginBottom: "12px" }} aria-hidden="true" />
              <p style={{ fontSize: "13px", color: "#475569" }}>No data loaded — click Apply filters</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default StateComparison;