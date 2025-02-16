// app/edit/page.tsx
"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase"; // Adjust the path to your firebase.js or firebase.ts
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";

// Define Expense type
interface Expense {
  id: string;
  description: string;
  amount: number;
  timestamp: any;
}

export default function EditPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Fetch expenses from Firestore
  useEffect(() => {
    const expensesRef = collection(db, "expenses");

    const unsubscribe = onSnapshot(expensesRef, (snapshot) => {
      const updatedExpenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];

      setExpenses(updatedExpenses);
    });

    return () => unsubscribe();
  }, []);

  // Handle expense deletion
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "expenses", id));
      alert("Expense deleted successfully.");
    } catch (err) {
      alert("Error deleting expense: " + err);
    }
  };

  // Handle expense modification
  const handleUpdate = async (id: string, updatedDescription: string, updatedAmount: number) => {
    try {
      const expenseRef = doc(db, "expenses", id);
      await updateDoc(expenseRef, {
        description: updatedDescription,
        amount: updatedAmount,
      });
      alert("Expense updated successfully.");
    } catch (err) {
      alert("Error updating expense: " + err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">Edit Expenses</h1>

      {/* Displaying Expenses */}
      <ul className="space-y-4">
        {expenses.map((expense) => (
          <li key={expense.id} className="flex flex-col gap-2">
            <div>
              <strong>{expense.description}</strong>: ${expense.amount}
            </div>

            {/* Form to edit expense */}
            <input
              type="text"
              defaultValue={expense.description}
              className="border p-2 text-black"
              onChange={(e) => (expense.description = e.target.value)} // Handle description change
            />
            <input
              type="number"
              defaultValue={expense.amount}
              className="border p-2 text-black"
              onChange={(e) => (expense.amount = parseFloat(e.target.value))} // Handle amount change
            />
            <button
              onClick={() => handleUpdate(expense.id, expense.description, expense.amount)}
              className="bg-blue-500 text-white p-2 rounded"
            >
              Update Expense
            </button>

            {/* Delete Button */}
            <button
              onClick={() => handleDelete(expense.id)}
              className="bg-red-500 text-white p-2 rounded"
            >
              Delete Expense
            </button>
          </li>
        ))}
      </ul>

      {/* Back to Main Page */}
      <Link href="/">
        <button className="bg-gray-500 text-white p-2 rounded mt-4">
          Back to Home
        </button>
      </Link>
    </div>
  );
}
