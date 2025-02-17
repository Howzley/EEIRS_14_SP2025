// app/menu/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter from next/navigation
import { db } from "../firebase"; // Assuming you have firebase initialized in firebase.js
import { addDoc, collection } from "firebase/firestore"; // Firebase Firestore functions
import Link from "next/link";

const ExpenseForm = () => {
  const [amount, setAmount] = useState<string>(""); // Set initial state to empty string
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [error, setError] = useState<string>("");
  const router = useRouter(); // Initialize router for navigation

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !category) {
      setError("Please fill out all fields.");
      return;
    }

    try {
      // Add expense to Firestore
      await addDoc(collection(db, "expenses"), {
        amount: Number(amount), // Convert amount to number before storing
        description,
        category,
        date: new Date(),
      });
      // Clear the form after successful submission
      setAmount(""); // Reset amount to empty string
      setDescription("");
      setCategory("");
      setError(""); // Clear error
      alert(`Expense added: \nDescription: ${description}\nAmount: $${amount}\nCategory: ${category}`); // Show data in alert
    } catch (err) {
      console.error("Error adding expense: ", err);
      setError("There was an error adding the expense. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Show alert with the entered data when Enter key is pressed
    if (e.key === "Enter") {
      alert(`Data entered: \nDescription: ${description}\nAmount: $${amount}\nCategory: ${category}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Add New Expense</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleAddExpense} className="space-y-4">
        <div>
          <label htmlFor="category" className="block mb-2">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-2 border border-gray-300 rounded text-black"
            required
          >
            <option value="">Select Category</option>
            <option value="travel">Travel</option>
            <option value="meals">Meals</option>
            <option value="office supplies">Office Supplies</option>
            <option value="entertainment">Entertainment</option>
            <option value="training">Training</option>
            <option value="transportation">Transportation</option>
            <option value="others">Others</option>
          </select>
        </div>
        <div>
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-2 border border-gray-300 rounded text-black"
            required
            onKeyDown={handleKeyDown} // Add onKeyDown event to show alert
          />
        </div>
        <div>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)} // Allow free input
            className="p-2 border border-gray-300 rounded text-black"
            required
            onKeyDown={handleKeyDown} // Add onKeyDown event to show alert
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
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
