function SummaryCard({ title, value }) {
  return (
    <div
      style={{
        background:
          "rgba(255,255,255,0.05)",

        backdropFilter: "blur(12px)",

        border:
          "1px solid rgba(255,255,255,0.1)",

        borderRadius: "20px",

        padding: "25px",

        minWidth: "250px",

        color: "white",

        boxShadow:
          "0 8px 30px rgba(0,0,0,0.3)"
      }}
    >
      <h3
        style={{
          color: "#94a3b8",
          marginBottom: "15px"
        }}
      >
        {title}
      </h3>

      <h1
        style={{
          color: "#38bdf8"
        }}
      >
        {value}
      </h1>
    </div>
  );
}

export default SummaryCard;