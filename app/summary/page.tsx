// app/summary/page.tsx
"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase"; // Adjust the import path based on your project structure
import { collection, onSnapshot } from "firebase/firestore";
import Link from "next/link";

// Define Expense type
interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  timestamp: any;
}

export default function SummaryPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<{ [key: string]: number }>({});
  const [totalExpense, setTotalExpense] = useState<number>(0);

  useEffect(() => {
    const expensesRef = collection(db, "expenses");

    // Remove the query for the current month for debugging
    const unsubscribe = onSnapshot(expensesRef, (snapshot) => {
      const updatedExpenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];

      console.log("Updated Expenses:", updatedExpenses); // Log expenses data

      setExpenses(updatedExpenses);

      // Calculate total monthly expense
      const total = updatedExpenses.reduce((acc, expense) => acc + expense.amount, 0);
      setTotalExpense(total);

      // Calculate total per category
      const categoryTotals: { [key: string]: number } = {};
      updatedExpenses.forEach((expense) => {
        if (expense.category) {
          if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += expense.amount;
          } else {
            categoryTotals[expense.category] = expense.amount;
          }
        }
      });

      console.log("Category Totals:", categoryTotals); // Log category totals
      setCategoryTotals(categoryTotals);
    });

    // Cleanup: Unsubscribe when component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-3xl font-bold mb-4">Monthly Expense Summary</h1>

      {/* Display overall total expense */}
      <div className="text-xl mb-4">
        <p>Total Monthly Expense: ${totalExpense.toFixed(2)}</p>
      </div>

      {/* Display total expense per category */}
      <h2 className="text-xl mb-4">Total Expense Per Category:</h2>
      <ul className="w-full max-w-md mb-4">
        {Object.entries(categoryTotals).map(([category, total]) => (
          <li key={category} className="flex justify-between mb-2 p-2 border-b">
            <span>{category}</span>
            <span>${total.toFixed(2)}</span>
          </li>
        ))}
      </ul>

      {/* Display all expenses */}
      <h2 className="text-xl mb-4">Expenses for this Month:</h2>
      <ul className="w-full max-w-md">
        {expenses.map((expense) => (
          <li key={expense.id} className="flex justify-between mb-2 p-2 border-b">
            <span>{expense.description}</span>
            <span>${expense.amount.toFixed(2)}</span>
          </li>
        ))}
      </ul>

      {/* Link to go back to the Menu */}
      <Link href="/">
        <button className="bg-gray-500 text-white p-2 rounded mt-4">
          Back to Home
        </button>
      </Link>
    </div>
  );
}
