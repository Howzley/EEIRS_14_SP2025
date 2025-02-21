// app/summary/page.tsx
"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase"; // Adjust the import path based on your project structure
import { collection, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter for redirection

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
  const [user, setUser] = useState<any>(null); // Store the user state for auth check
  const router = useRouter(); // Router to redirect to login if needed

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

    const expensesRef = collection(db, "expenses");

    // Listen to Firestore updates
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

    return () => unsubscribe(); // Cleanup Firestore listener
  }, [user]); // Re-run the effect when the user state changes

  if (!user) {
    return null; // Or a loading spinner if you'd like to show something while checking auth
  }

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
