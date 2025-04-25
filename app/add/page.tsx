"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import { addDoc, collection } from "firebase/firestore";
import Link from "next/link";

export default function ExpenseForm() {
  const [amount, setAmount] = useState<string>("");  
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("travel");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Optional: prefill from URL “data” param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get("data");
    if (encodedData) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(encodedData)));
        if (decoded.Total) setAmount(String(decoded.Total));
        if (decoded.Store) setDescription(decoded.Store);
      } catch (err) {
        console.error("Error decoding data: ", err);
      }
    }
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [router]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError("You must be logged in to add a receipt.");
      return;
    }

    try {
      await addDoc(collection(db, "expenses"), {
        description,
        amount: Number(amount),
        category,
        userId: auth.currentUser.uid,
        date: new Date(),
      });

      // Reset form
      setDescription("");
      setAmount("");
      setCategory("travel");
      setError("");

      alert("Receipt added successfully!");
      router.push("/add"); // or wherever you want to go next
    } catch (err) {
      console.error("Error adding receipt:", err);
      setError("Failed to add receipt. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">Add a New Receipt</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleAddExpense} className="space-y-4 w-full max-w-md">
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full text-black"
          required
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 w-full text-black"
          required
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 w-full text-black"
        >
          <option value="travel">Travel</option>
          <option value="meals">Meals</option>
          <option value="office supplies">Office Supplies</option>
          <option value="entertainment">Entertainment</option>
          <option value="training">Training</option>
          <option value="transportation">Transportation</option>
        </select>

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
          Add Receipt
        </button>
      </form>

      <div className="flex space-x-4 mt-6">
        <Link href="/upload">
          <button className="bg-gray-500 text-white p-2 rounded">
            Return to Upload
          </button>
        </Link>
        <Link href="/">
          <button className="bg-gray-500 text-white p-2 rounded">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
