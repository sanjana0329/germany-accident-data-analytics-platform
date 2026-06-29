import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b"
];

function CategoryChart({ data }) {

  const formattedData = data.map(item => ({
    name:
      item.category === 1
        ? "Fatal"
        : item.category === 2
        ? "Serious Injury"
        : "Minor Injury",

    value: item.count
  }));

  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        height: "500px",
        width: "100%"
      }}
    >
      <h2
        style={{
          color: "#334155",
          marginBottom: "20px"
        }}
      >
        Accident Category Distribution
      </h2>

      <ResponsiveContainer width="100%" height={350}>
      
        <PieChart>
          <Pie
            data={formattedData}
            dataKey="value"
            nameKey="name"
            outerRadius={140}
            label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(1)}%`
}
          >
            {formattedData.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CategoryChart;