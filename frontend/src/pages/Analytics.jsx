import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import GermanyMap from "../components/GermanyMap";

const W = "240px";

const css = `
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  .sc-blue  { border-left:3px solid #38bdf8; }
  .sc-red   { border-left:3px solid #f87171; }
  .sc-amber { border-left:3px solid #fbbf24; }
  .sc-green { border-left:3px solid #4ade80; }
  .cp {
    background:#111827;
    border:0.5px solid #1e3a5f;
    border-radius:12px;
    padding:22px;
  }
  .cp-title {
    font-size:13px; font-weight:500; color:#94a3b8;
    text-transform:uppercase; letter-spacing:0.07em;
    margin-bottom:18px; display:flex; align-items:center; gap:7px;
  }
  .cp-title i { color:#38bdf8; font-size:15px; }
`;

const COLORS = ["#38bdf8","#fbbf24","#4ade80","#f87171","#a78bfa","#fb923c"];

const STATE_NAMES = {
  "01":"Schleswig-Holstein","02":"Hamburg","03":"Lower Saxony","04":"Bremen",
  "05":"North Rhine-Westphalia","06":"Hesse","07":"Rhineland-Palatinate",
  "08":"Baden-Württemberg","09":"Bavaria","10":"Saarland","11":"Berlin",
  "12":"Brandenburg","13":"Mecklenburg-Western Pomerania","14":"Saxony",
  "15":"Saxony-Anhalt","16":"Thuringia",
};

const MO = {1:"Jan",2:"Feb",3:"Mar",4:"Apr",5:"May",6:"Jun",
            7:"Jul",8:"Aug",9:"Sep",10:"Oct",11:"Nov",12:"Dec"};
const WD = {1:"Mon",2:"Tue",3:"Wed",4:"Thu",5:"Fri",6:"Sat",7:"Sun"};

const TT = {
  background:"#1e293b",
  border:"0.5px solid #334155",
  borderRadius:"8px",
  fontSize:"12px",
  color:"#e2e8f0",
};

function Analytics() {
  const [stateData,    setStateData]    = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData,  setMonthlyData]  = useState([]);
  const [roadUserData, setRoadUserData] = useState([]);
  const [weekdayData,  setWeekdayData]  = useState([]);

  // yearly: try dedicated endpoint first, fall back to deriving from allYearsMonthly
  const [yearlyData,        setYearlyData]        = useState([]);
  const [allYearsMonthly,   setAllYearsMonthly]   = useState([]);

  const [selectedState, setSelectedState] = useState("");

  useEffect(() => {
    if (selectedState) loadAnalytics(selectedState);
  }, [selectedState]);

  const loadAnalytics = (code = selectedState) => {
    const p = { params: { land_code: code } };

    api.get("/state-summary",                p).then(r => setStateData(r.data));
    api.get("/state-category-distribution",  p).then(r => setCategoryData(r.data));
    api.get("/state-monthly-trend",          p).then(r => setMonthlyData(r.data));
    api.get("/state-road-user-distribution", p).then(r => setRoadUserData(r.data));
    api.get("/state-weekday-distribution",   p).then(r => setWeekdayData(r.data));

    // try dedicated yearly endpoint
    setYearlyData([]);
    api.get("/state-yearly-trend", p)
      .then(r => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          setYearlyData(r.data);
        } else {
          // fallback: load all-years monthly and aggregate on frontend
          loadYearlyFallback(code);
        }
      })
      .catch(() => loadYearlyFallback(code));
  };

  // Fallback: call monthly trend for each known year and sum totals
  const loadYearlyFallback = (code) => {
    const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
    const promises = years.map(yr =>
      api.get("/state-monthly-trend", { params: { land_code: code, year: yr } })
        .then(r => ({
          year: yr,
          total: Array.isArray(r.data)
            ? r.data.reduce((sum, d) => sum + (d.total || 0), 0)
            : 0,
        }))
        .catch(() => ({ year: yr, total: 0 }))
    );

    Promise.all(promises).then(results => {
      // only keep years that have data (total > 0)
      const withData = results.filter(d => d.total > 0);
      setYearlyData(withData);
    });
  };

  const chartMonthly = monthlyData.map(d => ({ month:   MO[d.month],   total: d.total }));
  const chartWeekday = weekdayData.map(d => ({ weekday: WD[d.weekday], total: d.total }));
  const chartYearly  = [...yearlyData].sort((a, b) => a.year - b.year);
  const maxYearVal   = chartYearly.length ? Math.max(...chartYearly.map(d => d.total)) : 0;

  const statName = selectedState ? STATE_NAMES[selectedState] : "";

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
          <h1 style={{ fontSize:"22px", fontWeight:"500", color:"white", marginBottom:"4px" }}>
            State accident explorer
          </h1>
          <p style={{ fontSize:"13px", color:"#64748b" }}>
            Click a state on the map to load detailed accident statistics
          </p>
        </div>

        {/* Map + info panel */}
        <div style={{
          background:"#1e293b", border:"0.5px solid #1e3a5f",
          borderRadius:"14px", padding:"26px", marginBottom:"22px",
        }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:"40px", alignItems:"center" }}>

            <GermanyMap
              selectedState={selectedState}
              setSelectedState={setSelectedState}
              loadAnalytics={loadAnalytics}
            />

            <div>
              {!selectedState ? (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:"9px", marginBottom:"16px" }}>
                    <i className="ti ti-map-pin" style={{ color:"#38bdf8", fontSize:"18px" }} aria-hidden="true" />
                    <span style={{ fontSize:"15px", fontWeight:"500", color:"#e2e8f0" }}>
                      Interactive Germany map
                    </span>
                  </div>
                  <p style={{ fontSize:"13px", color:"#64748b", lineHeight:"1.75", marginBottom:"24px" }}>
                    Click any federal state to explore its accident statistics across multiple dimensions.
                  </p>
                  {[
                    ["ti-chart-pie",     "Category distribution"],
                    ["ti-chart-line",    "Monthly accident trend"],
                    ["ti-car",           "Road user distribution"],
                    ["ti-calendar-week", "Weekday distribution"],
                    ["ti-chart-bar",     "Year-over-year trend"],
                  ].map(([icon, label]) => (
                    <div key={label} style={{
                      display:"flex", alignItems:"center", gap:"10px",
                      fontSize:"13px", color:"#64748b", marginBottom:"10px",
                    }}>
                      <i className={`ti ${icon}`} style={{ color:"#334155", fontSize:"15px" }} aria-hidden="true" />
                      {label}
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom:"20px" }}>
                    <div style={{ fontSize:"11px", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"4px" }}>
                      Selected state
                    </div>
                    <div style={{ fontSize:"18px", fontWeight:"500", color:"#38bdf8" }}>{statName}</div>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                    {[
                      { cls:"sc-blue",  icon:"ti-car-crash", label:"Total",   val: stateData?.total_accidents },
                      { cls:"sc-red",   icon:"ti-skull",     label:"Fatal",   val: stateData?.fatal },
                      { cls:"sc-amber", icon:"ti-ambulance", label:"Serious", val: stateData?.serious },
                      { cls:"sc-green", icon:"ti-shield",    label:"Minor",   val: stateData?.minor },
                    ].map(({ cls, icon, label, val }) => (
                      <div key={label} className={cls} style={{
                        background:"#111827", border:"0.5px solid #1e3a5f",
                        borderRadius:"10px", padding:"14px 16px",
                      }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"8px" }}>
                          <i className={`ti ${icon}`} style={{ fontSize:"13px", color:"#64748b" }} aria-hidden="true" />
                          <span style={{ fontSize:"11px", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.05em" }}>
                            {label}
                          </span>
                        </div>
                        <div style={{ fontSize:"22px", fontWeight:"500", color:"white" }}>
                          {val?.toLocaleString() ?? "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts row 1 — category + monthly */}
        {categoryData.length > 0 && monthlyData.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"18px", marginBottom:"18px" }}>

            <div className="cp">
              <div className="cp-title">
                <i className="ti ti-chart-pie" aria-hidden="true" />
                Category distribution
              </div>
              {/* key forces remount on state change → fixes stale pie bug */}
              <PieChart key={`cat-${selectedState}`} width={460} height={240}>
                <Pie
                  data={categoryData} dataKey="value" nameKey="name"
                  cx={220} cy={110} outerRadius={95}
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(1)}%`}
                  labelLine={{ stroke:"#334155" }}
                >
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TT} />
                <Legend wrapperStyle={{ fontSize:"12px", color:"#94a3b8" }} />
              </PieChart>
            </div>

            <div className="cp">
              <div className="cp-title">
                <i className="ti ti-chart-line" aria-hidden="true" />
                Monthly accident trend
              </div>
              <LineChart width={440} height={240} data={chartMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="month" tick={{ fill:"#64748b", fontSize:11 }} axisLine={{ stroke:"#1e3a5f" }} />
                <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={{ stroke:"#1e3a5f" }} />
                <Tooltip contentStyle={TT} />
                <Line type="monotone" dataKey="total" stroke="#38bdf8" strokeWidth={2.5} dot={{ r:3, fill:"#38bdf8" }} />
              </LineChart>
            </div>
          </div>
        )}

        {/* Charts row 2 — road user + weekday */}
        {roadUserData.length > 0 && weekdayData.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"18px", marginBottom:"18px" }}>

            <div className="cp">
              <div className="cp-title">
                <i className="ti ti-car" aria-hidden="true" />
                Road user distribution
              </div>
              <PieChart key={`road-${selectedState}`} width={460} height={240}>
                <Pie
                  data={roadUserData} dataKey="value" nameKey="name"
                  cx={220} cy={110} outerRadius={95}
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(1)}%`}
                  labelLine={{ stroke:"#334155" }}
                >
                  {roadUserData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TT} />
                <Legend wrapperStyle={{ fontSize:"12px", color:"#94a3b8" }} />
              </PieChart>
            </div>

            <div className="cp">
              <div className="cp-title">
                <i className="ti ti-calendar-week" aria-hidden="true" />
                {statName ? `${statName} — weekday distribution` : "Weekday distribution"}
              </div>
              <BarChart width={440} height={240} data={chartWeekday}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="weekday" tick={{ fill:"#64748b", fontSize:11 }} axisLine={{ stroke:"#1e3a5f" }} />
                <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={{ stroke:"#1e3a5f" }} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="total" fill="#38bdf8" radius={[4,4,0,0]} />
              </BarChart>
            </div>
          </div>
        )}

        {/* Chart row 3 — yearly (full width) */}
        {selectedState && (
          <div className="cp">
            <div className="cp-title">
              <i className="ti ti-chart-bar" aria-hidden="true" />
              {statName ? `${statName} — accidents by year` : "Accidents by year"}
              {yearlyData.length === 0 && (
                <span style={{ marginLeft:"auto", fontSize:"11px", color:"#334155", fontWeight:"400", textTransform:"none", letterSpacing:"0" }}>
                  Loading…
                </span>
              )}
            </div>

            {chartYearly.length > 0 ? (
              <>
                <BarChart
                  width={1060} height={260}
                  data={chartYearly}
                  margin={{ left:10, right:30, top:8, bottom:4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis
                    dataKey="year"
                    tick={{ fill:"#64748b", fontSize:12 }}
                    axisLine={{ stroke:"#1e3a5f" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill:"#64748b", fontSize:11 }}
                    axisLine={{ stroke:"#1e3a5f" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={TT}
                    cursor={{ fill:"rgba(56,189,248,0.05)" }}
                    formatter={(val) => [val.toLocaleString(), "Accidents"]}
                  />
                  <Bar dataKey="total" radius={[5,5,0,0]}>
                    {chartYearly.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.total === maxYearVal ? "#38bdf8" : "#1e3a5f"}
                      />
                    ))}
                  </Bar>
                </BarChart>
                <p style={{ fontSize:"11px", color:"#475569", marginTop:"8px", textAlign:"right" }}>
                  Highest year highlighted · source: Unfallatlas
                </p>
              </>
            ) : (
              <div style={{ height:"260px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ textAlign:"center" }}>
                  <i className="ti ti-loader-2" style={{ fontSize:"28px", color:"#334155", display:"block", marginBottom:"10px" }} aria-hidden="true" />
                  <p style={{ fontSize:"12px", color:"#334155" }}>Loading year data…</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!selectedState && (
          <div style={{
            background:"#1e293b", border:"0.5px solid #1e3a5f",
            borderRadius:"14px", padding:"60px 24px", textAlign:"center",
          }}>
            <i className="ti ti-map-2" style={{ fontSize:"40px", color:"#334155", display:"block", marginBottom:"14px" }} aria-hidden="true" />
            <p style={{ fontSize:"14px", color:"#475569" }}>Select a state on the map above to see charts</p>
          </div>
        )}

      </div>
    </>
  );
}

export default Analytics;