// app/menu/page.tsx
"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase"; // Adjust path to your firebase.js or firebase.ts
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import Link from "next/link";

// Define Expense type
interface Expense {
  id: string;
  description: string;
  amount: number;
  timestamp: any;
}

export default function MenuPage() {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const expensesRef = collection(db, "expenses");

    // Real-time Firestore listener
    const unsubscribe = onSnapshot(expensesRef, (snapshot) => {
      const updatedExpenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];

      setExpenses(updatedExpenses);
    });

    // Cleanup: Unsubscribe when component unmounts
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isNaN(parseFloat(amount)) || amount.trim() === "") {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      // Add the expense to Firestore
      await addDoc(collection(db, "expenses"), {
        description,
        amount: parseFloat(amount),
        timestamp: new Date(),
      });

      // Show an alert that the expense was added
      alert(`${description} added with amount: $${amount}`);

      // Clear the form
      setDescription("");
      setAmount("");
    } catch (err) {
      alert("Error adding expense: " + err);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1>Add an Expense</h1>

        {/* Expense Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 text-black"
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border p-2 text-black"
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Add Expense
          </button>
        </form>

        {/* Link to go back to the main page */}
        <Link href="/">
          <button className="bg-blue-500 text-white p-2 rounded">
            Back to Home
          </button>
        </Link>
      </main>
    </div>
  );
}
