// app/edit/page.tsx
"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase"; // Adjust the path to your firebase.js or firebase.ts
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Define Expense type
interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string; // Added category to the Expense type
  timestamp: any;
}

export default function EditPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [user, setUser] = useState<any>(null); // To track authenticated user
  const router = useRouter();

  // Firebase Auth check
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user); // Set the user object if authenticated
      } else {
        setUser(null); // Set to null if not authenticated
        router.push("/login"); // Redirect to login page if not authenticated
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch expenses from Firestore (only if user is authenticated)
  useEffect(() => {
    if (!user) return; // Don't fetch expenses if not authenticated

    const expensesRef = collection(db, "expenses");
    const unsubscribe = onSnapshot(expensesRef, (snapshot) => {
      const updatedExpenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];

      setExpenses(updatedExpenses);
    });

    return () => unsubscribe();
  }, [user]);

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

  // Group expenses by category
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
      {!user ? (
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

      {/* Back to Main Page */}
      <Link href="/">
        <button className="bg-gray-500 text-white p-2 rounded mt-4">
          Back to Home
        </button>
      </Link>
    </div>
  );
}
