import { useEffect, useState } from "react";
import germanySvgUrl from "../assets/de.svg";

const svgToState = {
  DESH: "01", // Schleswig-Holstein
  DEHH: "02", // Hamburg
  DENI: "03", // Lower Saxony
  DEHB: "04", // Bremen
  DENW: "05", // North Rhine-Westphalia
  DEHE: "06", // Hesse
  DERP: "07", // Rhineland-Palatinate
  DEBW: "08", // Baden-Württemberg
  DEBY: "09", // Bavaria
  DESL: "10", // Saarland
  DEBE: "11", // Berlin
  DEBB: "12", // Brandenburg
  DEMV: "13", // Mecklenburg-Western Pomerania
  DESN: "14", // Saxony
  DEST: "15", // Saxony-Anhalt
  DETH: "16"  // Thuringia
};

const stateLabels = {
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


function GermanyMap({ selectedState, setSelectedState, loadAnalytics }) {
  const [svgText, setSvgText] = useState("");

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
  }, []);

  const handleClick = (event) => {
    const clickedElement = event.target.closest("[id]");
    if (!clickedElement) return;

    const svgId = clickedElement.id;
    const stateCode = svgToState[svgId];

    if (!stateCode) return;

    setSelectedState(stateCode);
    loadAnalytics(stateCode);
  };

const handleMouseMove = (event) => {

  const clickedElement =
    event.target.closest("[id]");

  if (!clickedElement) {
    setTooltip((prev) => ({
      ...prev,
      visible: false
    }));
    return;
  }

  const stateCode =
    svgToState[clickedElement.id];

  if (!stateCode) return;

  setTooltip({
    visible: true,
    text: stateLabels[stateCode],
    x: event.clientX,
    y: event.clientY
  });
};

const handleMouseLeave = () => {
  setTooltip((prev) => ({
    ...prev,
    visible: false
  }));
};



  
  return (
  <div
    onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    style={{
      maxWidth: "550px",
      margin: "0 auto",
      cursor: "pointer"
    }}
  >
    <style>
      {`
        .germany-map svg {
          width: 100%;
          height: auto;
        }

        .germany-map svg path {
          fill: #cbd5e1;
          stroke: white;
          stroke-width: 1;
          transition: 0.2s;
        }

        .germany-map svg path:hover {
          fill: #38bdf8;
        }

        .germany-map #DESH,
        .germany-map #DEHH,
        .germany-map #DENI,
        .germany-map #DEHB,
        .germany-map #DENW,
        .germany-map #DEHE,
        .germany-map #DERP,
        .germany-map #DEBW,
        .germany-map #DEBY,
        .germany-map #DESL,
        .germany-map #DEBE,
        .germany-map #DEBB,
        .germany-map #DEMV,
        .germany-map #DESN,
        .germany-map #DEST,
        .germany-map #DETH {
          cursor: pointer;
        }

        .germany-map #${Object.keys(svgToState).find(
          (key) => svgToState[key] === selectedState
        )} {
          fill: #2563eb !important;
        }
      `}
    </style>

    <div
      className="germany-map"
      dangerouslySetInnerHTML={{ __html: svgText }}
    />

{tooltip.visible && (
  <div
    style={{
      position: "fixed",
      left: tooltip.x + 15,
      top: tooltip.y + 15,
      background: "#2563eb",
      color: "white",
      padding: "8px 14px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      pointerEvents: "none",
      zIndex: 9999,
      boxShadow:
        "0 4px 12px rgba(0,0,0,0.2)"
    }}
  >
    {tooltip.text}
  </div>
)}

  </div>
);
}

export default GermanyMap;