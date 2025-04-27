"use client";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from "chart.js";
import { useMemo } from "react";

// Register chart components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

interface Expense {
  id: string;
  total: number;
  day: string; // MM/DD/YYYY
}

interface YearlyExpenseBarProps {
  expenses: Expense[];
}

const getMonthLabels = () => {
  const labels: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString("default", { month: "short", year: "2-digit" }));
  }
  return labels;
};

function parseMMDDYYYY(str: string): Date | null {
  if (!str) return null;
  const [mm, dd, yyyy] = str.split("/");
  if (mm && dd && yyyy) {
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export default function YearlyExpenseBar({ expenses }: YearlyExpenseBarProps) {
  // Prepare month labels and data
  const monthLabels = getMonthLabels();
  const now = new Date();
  const expenseTotals = useMemo(() => {
    // Array of 12 totals (one per month, starting 11 months ago to current)
    const totals = Array(12).fill(0);
    expenses.forEach((expense) => {
      const date = parseMMDDYYYY(expense.day);
      if (!date) return; // Skip if date invalid
      // Find index of the month relative to now (0 = 11 months ago, 11 = this month)
      const monthDiff =
        (now.getFullYear() - date.getFullYear()) * 12 +
        (now.getMonth() - date.getMonth());
      if (monthDiff >= 0 && monthDiff < 12) {
        totals[11 - monthDiff] += Number(expense.total) || 0;
      }
    });
    return totals;
  }, [expenses]);

  const data = {
    labels: monthLabels,
    datasets: [
      {
        label: "Monthly Expenses",
        data: expenseTotals,
        backgroundColor: "#ff6384",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      x: {
        grid: {
          color: "#d1d5db",
        }
      },
      y: {
        grid: {
          color: "#d1d5db",
        }
      }
    }
  };

  return (
    <div className="w-[550]">
      <h2 className="text-lg font-bold mb-2 text-center">Monthly Expenses (Last 12 Months)</h2>
      <Bar data={data} options={options} />
    </div>
  );
}