// components/TotalExpenses.tsx
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

interface TotalExpensesProps {
  expenses: Expense[];
}

export default function TotalExpenses({ expenses }: TotalExpensesProps) {
  // Compute total spending per user
  const userTotals = useMemo(() => {
    const map: { [key: string]: { name: string; sum: number } } = {};
    expenses.forEach((exp) => {
      const name = exp.userName || exp.userId;
      if (!map[name]) map[name] = { name, sum: 0 };
      map[name].sum += exp.total || 0;
    });
    // Convert to array & sort by sum
    return Object.values(map).sort((a, b) => a.sum - b.sum);
  }, [expenses]);

  const data = {
    labels: userTotals.map((u) => u.name),
    datasets: [
      {
        label: "Total Spending",
        data: userTotals.map((u) => u.sum),
        backgroundColor: "#f59e42",
      },
    ],
  };

  return (
    <div className="w-[500] max-w-2xl">
      <h2 className="text-lg font-bold mb-2 text-center">Total Spending per User</h2>
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