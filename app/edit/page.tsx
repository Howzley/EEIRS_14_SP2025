// app/edit/page.tsx
"use client"; // Ensures this code runs only on the client-side in Next.js.

// Import necessary React hooks and Firebase utilities
import { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Import Firebase database and authentication instance
import {
  collection,
  collectionGroup,
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
  total: number;
  category: string; // Added category field
  timestamp: any; // Timestamp of the expense entry
  refPath: string;
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
    if (userRole === null) return;
  
    let expenseQuery;
    if (userRole === "supervisor") {
      // Supervisors can access all receipts from all users
      expenseQuery = collectionGroup(db, "receipts");
    } else if (userRole === "employee" && userId) {
      // Employees can only access their own receipts subcollection
      expenseQuery = collection(db, "users", userId, "receipts");
    } else {
      return;
    }
  
    const unsubscribe = onSnapshot(expenseQuery, (snapshot) => {
      const updatedExpenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        // Save the full path for supervisor actions
        refPath: doc.ref.path, 
        ...doc.data(),
      })) as Expense[];
      setExpenses(updatedExpenses);
    });
  
    return () => unsubscribe();
  }, [userRole, userId]);

  // Function to handle expense deletion
  const handleDelete = async (id: string, refPath?: string) => {
    try {
      let docRef;
      if (userRole === "supervisor" && refPath) {
        // For supervisor, use the document's full path
        docRef = doc(db, refPath);
      } else if (userRole === "employee" && userId) {
        // For employee, use user's receipts subcollection
        docRef = doc(db, "users", userId, "receipts", id);
      } else {
        throw new Error("No permission or path info.");
      }
  
      await deleteDoc(docRef);
      alert("Expense deleted successfully.");
    } catch (err) {
      alert("Error deleting expense: " + err);
    }
  };

  // Function to handle expense updates
  const handleUpdate = async (
    id: string,
    updatedDescription: string,
    updatedTotal: number,
    updatedCategory: string,
    refPath?: string
  ) => {
    try {
      let expenseRef;
      if (userRole === "supervisor" && refPath) {
        expenseRef = doc(db, refPath);
      } else if (userRole === "employee" && userId) {
        expenseRef = doc(db, "users", userId, "receipts", id);
      } else {
        throw new Error("No permission or path info.");
      }
  
      await updateDoc(expenseRef, {
        description: updatedDescription,
        total: updatedTotal,
        category: updatedCategory,
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

// ------------------------------------------------------------------------------------------------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">Manage Expenses</h1>

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
                      <strong>{expense.description}</strong>: ${expense.total}
                    </div>

                    {/* Form to edit expense */}
                    <input
                      type="text"
                      defaultValue={expense.description}
                      className="border p-2 text-black dark:text-white"
                      onChange={(e) => (expense.description = e.target.value)} // Handle description change
                    />
                    <input
                      type="number"
                      defaultValue={expense.total}
                      className="border p-2 text-black dark:text-white"
                      onChange={(e) => (expense.total = parseFloat(e.target.value))} // Handle amount change
                    />
                    <select
                      value={expense.category}
                      onChange={(e) => (expense.category = e.target.value)} // Handle category change
                      className="border p-2 text-black dark:text-white"
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
                          expense.total,
                          expense.category,
                          expense.refPath
                        )
                      }
                      className="bg-blue-500 text-white p-2 rounded"
                    >
                      Update Expense
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(expense.id, expense.refPath)}
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
