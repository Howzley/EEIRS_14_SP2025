"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import useRouter from next/navigation
import { auth } from "../firebase"; // Firebase authentication
import { onAuthStateChanged } from "firebase/auth"; // Firebase Auth function
import { db } from "../firebase"; // Firebase Firestore
import { addDoc, collection } from "firebase/firestore"; // Firestore functions
import Link from "next/link";

const ExpenseForm = () => {
  const [amount, setAmount] = useState<number | "">(""); // Allow number or empty string
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null); // User state for authentication
  const router = useRouter(); // Initialize router for navigation

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login"); // Redirect to login if not logged in
      } else {
        setUser(user);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup the subscription when component unmounts
  }, [router]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser; // Get the currently logged-in user

    if (!user) {
      setError("You must be logged in to add a receipt.");
      return;
    }

    try {
      // 🔹 Add receipt with userId field
      await addDoc(collection(db, "expenses"), {
        description,
        amount: Number(amount),
        category,
        userId: user.uid, // Store the user's UID for filtering later
        timestamp: new Date(),
      });

      alert("Receipt added successfully!");

      // Reset form details
      setDescription("");
      setAmount("");
      setCategory("");

      // Stay on the same page
      router.push("/add");
    } catch (err) {
      setError("Failed to add receipt. Please try again.");
      console.error("Error adding receipt:", err);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Show loading state until authentication is checked
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">Add a New Receipt</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleAddExpense} className="space-y-4">
        {/* 🔹 Description Input */}
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 text-black w-full"
        />

        {/* 🔹 Amount Input */}
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : "")}
          className="border p-2 text-black w-full"
        />

        {/* 🔹 Category Dropdown */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 text-black w-full"
        >
          <option value="travel">Travel</option>
          <option value="meals">Meals</option>
          <option value="office supplies">Office Supplies</option>
          <option value="entertainment">Entertainment</option>
          <option value="training">Training</option>
          <option value="transportation">Transportation</option>
        </select>

        {/* 🔹 Submit Button */}
        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
          Add Expense
        </button>
      </form>
      
      {/* Back to Main Page */}
      <Link href="/">
        <button className="bg-gray-500 text-white p-2 rounded mt-4">
          Back to Home
        </button>
      </Link>
    </div>
  );
};

export default ExpenseForm;