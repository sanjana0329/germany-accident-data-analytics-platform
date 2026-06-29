import { useEffect, useState } from "react";
import germanySvgUrl from "../assets/de.svg";
import api from "../services/api";

const svgToState = {
  DESH: "01",
  DEHH: "02",
  DENI: "03",
  DEHB: "04",
  DENW: "05",
  DEHE: "06",
  DERP: "07",
  DEBW: "08",
  DEBY: "09",
  DESL: "10",
  DEBE: "11",
  DEBB: "12",
  DEMV: "13",
  DESN: "14",
  DEST: "15",
  DETH: "16"
};

const stateNames = {
  "01": "Schleswig-Holstein",
  "02": "Hamburg",
  "03": "Lower Saxony",
  "04": "Bremen",
  "05": "North Rhine-Westphalia",
  "06": "Hesse",
  "07": "Rhineland-Palatinate",
  "08": "Baden-Württemberg",
  "09": "Bavaria",
  "10": "Saarland",
  "11": "Berlin",
  "12": "Brandenburg",
  "13": "Mecklenburg-Western Pomerania",
  "14": "Saxony",
  "15": "Saxony-Anhalt",
  "16": "Thuringia"
};

function GermanyHeatMap() {
  const [svgText, setSvgText] = useState("");
  const [totals, setTotals] = useState({});
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: "",
    x: 0,
    y: 0
  });

  useEffect(() => {
    fetch(germanySvgUrl)
      .then((res) => res.text())
      .then((data) => setSvgText(data));

    api.get("/state-comparison", {
      params: {
        analysis_type: "total"
      }
    }).then((res) => {
      const obj = {};

      res.data.forEach((item) => {
        const code = Object.keys(stateNames).find(
          (key) => stateNames[key] === item.state
        );

        if (code) {
          obj[code] = item.value;
        }
      });

      setTotals(obj);
    });
  }, []);

  const maxValue = Math.max(...Object.values(totals), 1);

  const getColor = (code) => {
    const value = totals[code] || 0;
    const ratio = value / maxValue;

    if (ratio > 0.8) return "#b91c1c";
    if (ratio > 0.6) return "#ef4444";
    if (ratio > 0.4) return "#f97316";
    if (ratio > 0.2) return "#facc15";
    return "#bbf7d0";
  };

  const handleMouseMove = (event) => {
    const element = event.target.closest("[id]");
    if (!element) return;

    const stateCode = svgToState[element.id];
    if (!stateCode) return;

    setTooltip({
      visible: true,
      text: `${stateNames[stateCode]}: ${(totals[stateCode] || 0).toLocaleString()} accidents`,
      x: event.clientX,
      y: event.clientY
    });
  };

  const handleMouseLeave = () => {
    setTooltip({
      visible: false,
      text: "",
      x: 0,
      y: 0
    });
  };

  const styleText = Object.entries(svgToState)
    .map(([svgId, code]) => {
      return `.heat-map #${svgId} { fill: ${getColor(code)} !important; }`;
    })
    .join("\n");

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        maxWidth: "620px",
        margin: "0 auto"
      }}
    >
      <style>
        {`
          .heat-map svg {
            width: 100%;
            height: auto;
          }

          .heat-map svg path {
            stroke: white;
            stroke-width: 1;
            transition: 0.2s;
            cursor: pointer;
          }

          .heat-map svg path:hover {
            stroke: #0f172a;
            stroke-width: 2;
            filter: brightness(1.08);
          }

          ${styleText}
        `}
      </style>

      <div
        className="heat-map"
        dangerouslySetInnerHTML={{ __html: svgText }}
      />

      {tooltip.visible && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 15,
            top: tooltip.y + 15,
            background: "#0f172a",
            color: "white",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            zIndex: 9999,
            pointerEvents: "none"
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

export default GermanyHeatMap;