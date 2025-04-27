// app/summary/page.tsx
"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase"; // Adjust the import path based on your project structure
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter for redirection
import dynamic from "next/dynamic";

const CategoryPieChart = dynamic(() => import("../components/CategoryPieChart"), { ssr: false });
const YearlyExpenseBar = dynamic(() => import("../components/YearlyExpensesBar"), { ssr: false });

// Define Expense type
interface Expense {
  id: string;
  description: string;
  total: number;
  category: string;
  timestamp: any;
  receiptName: string;
  day: string;
}

export default function SummaryPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<{ [key: string]: number }>({});
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [user, setUser] = useState<any>(null); // Store the user state for auth check
  const router = useRouter(); // Router to redirect to login if needed
  const [chartData, setChartData] = useState<{category: string, total: number}[]>([]);

  useEffect(() => {
    // Check the authentication state
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user); // If authenticated, set user state
      } else {
        setUser(null); // If not authenticated, set user to null
        router.push("/login"); // Redirect to login page
      }
    });

    return () => unsubscribeAuth(); // Cleanup auth state listener
  }, [router]);

  useEffect(() => {
    if (!user) return; // Don't fetch expenses if no user is logged in

    const expensesRef = collection(db, "users", user.uid, "receipts");
    const approvedQuery = query(expensesRef, where("status", "==", "Approved"));

    // Listen to Firestore updates
    const unsubscribe = onSnapshot(approvedQuery, (snapshot) => {
      const updatedExpenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];

      console.log("Updated Expenses:", updatedExpenses); // Log expenses data

      setExpenses(updatedExpenses);

      // Calculate total monthly expense
      const total = updatedExpenses.reduce((acc, expense) => acc + expense.total, 0);
      setTotalExpense(total);

      // Calculate total per category
      const categoryTotals: { [key: string]: number } = {};
      updatedExpenses.forEach((expense) => {
        if (expense.category) {
          if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += expense.total;
          } else {
            categoryTotals[expense.category] = expense.total;
          }
        }
      });
      
      setCategoryTotals(categoryTotals);

      // Prepare data for chart
      const chartData = Object.entries(categoryTotals).map(([category, total]) => ({
        category,
        total,
      }));

      setChartData(chartData);
    });

    return () => unsubscribe(); // Cleanup Firestore listener
  }, [user]); // Re-run the effect when the user state changes

  if (!user) {
    return null; // Or a loading spinner if you'd like to show something while checking auth
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 pb-20 gap-6 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-5xl font-bold">
        Monthly Expense Summary
      </h1>
      <h1 className="text-3xl font-bold mb-10">
        Total Monthly Expense: ${totalExpense.toFixed(2)}
      </h1>
      
      {/* Flex Row: Left is summary, right is chart */}
      <div className="flex w-full max-w-5xl gap-12 items-start justify-between">
        {/* --- LEFT: Summary Content --- */}
        <div className="flex-1">
          <div className="w-full max-w-md p-4 bg-gray-900 border-2 border-gray-300 rounded-lg shadow-lg mb-10">
            <h2 className="text-xl font-bold text-gray-300 mb-4">Total Expense Per Category:</h2>
            <ul>
              {Object.entries(categoryTotals).map(([category, total]) => (
                <li key={category} className="flex text-gray-300 justify-between mb-2 p-2 border-b">
                  <span>{category}</span>
                  <span>${(total ?? 0).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
  
          <div className="w-full max-w-md p-4 bg-gray-900 border-2 border-gray-300 rounded-lg shadow-lg mb-4">
            <h2 className="text-gray-300 font-bold text-xl mb-4">Expenses for this Month:</h2>
            <ul>
              {expenses.map((expense) => (
                <li key={expense.id} className="flex text-gray-300 justify-between mb-2 p-2 border-b">
                  <span>{expense.description}</span>
                  <span>${(expense.total ?? 0).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* --- RIGHT: Chart + Bar Graph --- */}
        <div className="w-[350px] min-w-[300px] flex flex-col items-center gap-8">
          {chartData.length > 0 && (
            <CategoryPieChart data={chartData} />
          )}
          {/* Bar graph always appears below pie graph */}
          <YearlyExpenseBar expenses={expenses} />
        </div>
      </div>
  
      {/* Back to Home Button */}
      <Link href="/">
        <button className="bg-gray-500 text-white p-2 rounded mt-4">
          Back to Home
        </button>
      </Link>
    </div>
  );
}
