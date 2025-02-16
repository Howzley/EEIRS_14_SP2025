// app/summary/page.tsx
"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase"; // Adjust the import path based on your project structure
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";

// Define Expense type
interface Expense {
  id: string;
  description: string;
  amount: number;
  timestamp: any;
}

export default function SummaryPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpense, setTotalExpense] = useState<number>(0);

  useEffect(() => {
    const expensesRef = collection(db, "expenses");

    // Query for expenses in the current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const expensesQuery = query(
      expensesRef,
      where("timestamp", ">=", new Date(currentYear, currentMonth, 1)),
      where("timestamp", "<=", new Date(currentYear, currentMonth + 1, 0))
    );

    // Real-time Firestore listener for expenses in the current month
    const unsubscribe = onSnapshot(expensesQuery, (snapshot) => {
      const updatedExpenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];

      setExpenses(updatedExpenses);
      // Calculate total monthly expense
      const total = updatedExpenses.reduce((acc, expense) => acc + expense.amount, 0);
      setTotalExpense(total);
    });

    // Cleanup: Unsubscribe when component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-3xl font-bold mb-4">Monthly Expense Summary</h1>

      {/* Display total expense */}
      <div className="text-xl mb-4">
        <p>Total Monthly Expense: ${totalExpense.toFixed(2)}</p>
      </div>

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
        <button className="bg-blue-500 text-white p-2 rounded mt-4">
          Back to Menu
        </button>
      </Link>
    </div>
  );
}
