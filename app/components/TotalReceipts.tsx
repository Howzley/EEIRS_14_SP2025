// components/TotalReceipts.tsx
"use client";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from "chart.js";
import { useMemo } from "react";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

interface Expense {
  id: string;
  description: string;
  total: number;
  category: string;
  timestamp: any;
  receiptName: string;
  day: string;
  userId: string;
  userName?: string;
}

interface TotalReceiptsProps {
  expenses: Expense[];
}

export default function TotalReceipts({ expenses }: TotalReceiptsProps) {
  // Compute receipts per user
  const userCounts = useMemo(() => {
    const map: { [key: string]: { name: string; count: number } } = {};
    expenses.forEach((exp) => {
      const name = exp.userName || exp.userId;
      if (!map[name]) map[name] = { name, count: 0 };
      map[name].count += 1;
    });
    // Convert to array & sort by count
    return Object.values(map).sort((a, b) => a.count - b.count);
  }, [expenses]);

  const data = {
    labels: userCounts.map((u) => u.name),
    datasets: [
      {
        label: "Approved Receipts",
        data: userCounts.map((u) => u.count),
        backgroundColor: "#6366F1",
      },
    ],
  };

  return (
    <div className="w-[500] max-w-2xl">
      <h2 className="text-lg font-bold mb-2 text-center">Approved Receipts per User</h2>
      <Bar
        data={data}
        options={{
          indexAxis: "x",
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
          responsive: true,
          scales: {
            x: { grid: { color: "#d1d5db" } },
            y: { beginAtZero: true, grid: { color: "#d1d5db" } },
          },
        }}
      />
    </div>
  );
}