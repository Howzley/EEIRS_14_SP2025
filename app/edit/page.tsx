// app/edit/page.tsx
"use client"; // Ensures this code runs only on the client-side in Next.js.

// Import necessary React hooks and Firebase utilities
import { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Import Firebase database and authentication instance
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
  getDoc
} from "firebase/firestore"; // Import Firestore functions
import Link from "next/link"; // Import Next.js Link for navigation
import { Slabo_13px } from "next/font/google"; // Import a Google font (not used in this snippet)

// Define the Expense type to ensure type safety in TypeScript
interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string; // Added category field
  timestamp: any; // Timestamp of the expense entry
}

// Define the main component
export default function EditPage() {
  // State variables to store expenses, user role, and user ID
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch the logged-in user's role when the component mounts
  useEffect(() => {
    const fetchUserRole = async () => {
      const currentUser = auth.currentUser; // Get currently logged-in user
      if (currentUser) {
        setUserId(currentUser.uid); // Store user ID
        const userRef = doc(db, "users", currentUser.uid); // Reference to the user's document in Firestore
        const userSnap = await getDoc(userRef); // Fetch user document

        if (userSnap.exists()) {
          setUserRole(userSnap.data().role); // Set user role from Firestore data
        }
      }
    };
    fetchUserRole();
  }, []); // Runs only once when component mounts

  // Fetch expenses based on user role
  useEffect(() => {
    if (userRole === null) return; // Ensure role is loaded before proceeding

    let expenseQuery;
    if (userRole === "supervisor") {
      // Supervisors can access all expenses
      expenseQuery = collection(db, "expenses");
    } else if (userRole === "employee" && userId) {
      // Employees can only access their own expenses
      expenseQuery = query(collection(db, "expenses"), where("userId", "==", userId));
    } else {
      return;
    }
    
    // Listen for changes in expenses collection and update state
    const unsubscribe = onSnapshot(expenseQuery, (snapshot) => {
      const updatedExpenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];
      setExpenses(updatedExpenses);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [userRole, userId]);

  // Function to handle expense deletion
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "expenses", id)); // Delete the expense document from Firestore
      alert("Expense deleted successfully.");
    } catch (err) {
      alert("Error deleting expense: " + err);
    }
  };

  // Function to handle expense updates
  const handleUpdate = async (
    id: string,
    updatedDescription: string,
    updatedAmount: number,
    updatedCategory: string // Added category to update
  ) => {
    try {
      const expenseRef = doc(db, "expenses", id);
      await updateDoc(expenseRef, {
        description: updatedDescription,
        amount: updatedAmount,
        category: updatedCategory, // Updating category
      });
      alert("Expense updated successfully.");
    } catch (err) {
      alert("Error updating expense: " + err);
    }
  };

  // Group expenses by category for better display
  const groupedExpenses = expenses.reduce((groups: { [key: string]: Expense[] }, expense) => {
    const { category } = expense;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(expense);
    return groups;
  }, {});

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">Edit Expenses</h1>

      {/* If the user is not authenticated, show a message */}
      {!userId ? (
        <div className="text-red-500">You need to be logged in to view this page.</div>
      ) : (
        <>
          {/* Displaying Expenses by Category */}
          {Object.keys(groupedExpenses).map((category) => (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{category}</h2>

              <ul className="space-y-4">
                {groupedExpenses[category].map((expense) => (
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
                    <select
                      value={expense.category}
                      onChange={(e) => (expense.category = e.target.value)} // Handle category change
                      className="border p-2 text-black"
                    >
                      <option value="travel">Travel</option>
                      <option value="meals">Meals</option>
                      <option value="office supplies">Office Supplies</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="training">Training</option>
                      <option value="transportation">Transportation</option>
                    </select>

                    <button
                      onClick={() =>
                        handleUpdate(
                          expense.id,
                          expense.description,
                          expense.amount,
                          expense.category
                        )
                      }
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
            </div>
          ))}
        </>
      )}

      {/* Back button to navigate to the homepage */}
      <Link href="/">
        <button className="bg-gray-500 text-white p-2 rounded mt-4">
          Back to Home
        </button>
      </Link>
    </div>
  );
}
