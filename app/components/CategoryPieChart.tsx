"use client";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryPieChart({ data }: { data: { category: string; total: number }[] }) {
  const chartData = {
    labels: data.map((d) => d.category),
    datasets: [
      {
        label: "Total Spent",
        data: data.map((d) => d.total),
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#2ecc71", "#e17055", "#6c5ce7", "#00b894",
        ],
        borderColor: "#d1d5db", // Only border color for chart segments
        borderWidth: 2,
      },
    ],
  };

  // Leave out custom legend label color
  const options = {
    plugins: {
      legend: {
        labels: {
          // No color property, use default (auto adjusts for theme)
        },
      },
    },
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}