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
  "#f59e0b",
  "#ef4444"
];

function RoadUserChart({ data }) {

  const chartData = [
    {
      name: "Bicycle",
      value: data.bicycle || 0
    },
    {
      name: "Car",
      value: data.car || 0
    },
    {
      name: "Pedestrian",
      value: data.pedestrian || 0
    },
    {
      name: "Motorcycle",
      value: data.motorcycle || 0
    }
  ];
  console.log(chartData);

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
        Road User Distribution
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius={130}
            label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(1)}%`
}
          >
            {chartData.map((entry, index) => (
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

export default RoadUserChart;