"use client"; // This makes sure the file is a client-side component

import { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Import Firebase database and authentication instance
import { collection, collectionGroup, query, where, onSnapshot, updateDoc, doc, getDoc, getDocs } from "firebase/firestore"; // Firestore functions
import Link from "next/link"; // Import Link for navigation

// Define the Expense type to ensure type safety in TypeScript
interface Expense {
  id: string;
  description: string;
  total: number;
  category: string;
  subcategory: string;
  timestamp: any; // Timestamp
  refPath: string; // Firestore document path reference
  status: string; // Pending, Approved, Denied
  receiptUID: string; // The user ID associated with this receipt (submitted by)
  userName: string; // User name directly from the receipt
  comments?: string; // Optional comments for denied receipts
}

export default function ReviewPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loggedUID, setLoggedUID] = useState<string | null>(null); // Logged-in user's UID
  const [comments, setComments] = useState<{ [id: string]: string }>({}); // Comment state for each expense
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null); // State to manage expanded expenses

  // Fetch user role and logged-in user UID
  useEffect(() => {
    const fetchUserRole = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setLoggedUID(currentUser.uid); // Store the logged-in user's UID
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserRole(userSnap.data().role);
        }
      }
    };
    fetchUserRole();
  }, []);

  // Fetch pending expenses for supervisor
  useEffect(() => {
    if (userRole === "supervisor") {
      const q = query(collectionGroup(db, "receipts"), where("status", "==", "Pending"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedExpenses = snapshot.docs.map(doc => {
          const expenseData = doc.data();
          const expense: Expense = {
            id: doc.id,
            description: expenseData.description,
            total: expenseData.total,
            category: expenseData.category,
            subcategory: expenseData.subcategory,
            timestamp: expenseData.timestamp,
            refPath: doc.ref.path,
            status: expenseData.status,
            receiptUID: expenseData.userId, // receiptUID is the userId of the person who submitted the receipt
            userName: expenseData.userName, // Directly use the userName from the receipt
            comments: expenseData.comments || "",
          };
          return expense;
        });
        setExpenses(fetchedExpenses); // Set expenses
      });
      return () => unsubscribe();
    }
  }, [userRole]);

  const handleReview = async (expenseId: string, newStatus: string) => {
    const comment = comments[expenseId] || ""; // Get the comment for the current expense
  
    if (newStatus === "Denied" && !comment) {
      alert("You must provide a comment for denied receipts.");
      return;
    }
  
    // Ensure you pass the correct userId (reviewer's user ID, not the one associated with the expense)
    if (!loggedUID) {
      alert("User ID is not available.");
      return;
    }
  
    try {
      // Step 1: Fetch the expense document using the expenseId and the receiptUID (the UID of the user who submitted the receipt)
      const expense = expenses.find((exp) => exp.id === expenseId);
      if (!expense) {
        console.error("Expense not found.");
        alert("Expense not found.");
        return;
      }
  
      const { receiptUID } = expense; // This is the userId of the person who submitted the receipt
  
      if (!receiptUID) {
        alert("Receipt user ID not found.");
        return;
      }
  
      // Now that we have the correct receiptUID, we can fetch the document from the correct user collection
      const expenseRef = doc(db, "users", receiptUID, "receipts", expenseId);
      const expenseDoc = await getDoc(expenseRef);
  
      // Step 2: Check if the document exists
      if (!expenseDoc.exists()) {
        console.error("No document found:", expenseRef.path);
        alert(`No document found for ID: ${expenseId}`);
        return;
      }
  
      // Step 3: Update the receipt document
      const updatedData: any = {
        status: newStatus,
      };
  
      // If the status is denied, include the comment
      if (newStatus === "Denied" && comment) {
        updatedData.comments = comment;
      }
  
      // If the status is approved, only update the comment if it's not empty or null
      if (newStatus === "Approved" && comment.trim() !== "") {
        updatedData.comments = comment;
      }
  
      // Proceed with the update
      await updateDoc(expenseRef, updatedData);
  
      alert(`Expense successfully ${newStatus.toLowerCase()}.`);
    } catch (err) {
      console.error("Error changing expense status:", err);
      alert("Error changing expense status: " + err);
    }
  };
  

  // Handle comment change for denied receipts
  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>, expenseId: string) => {
    setComments(prevComments => ({
      ...prevComments,
      [expenseId]: e.target.value,
    }));
  };

  // Toggle the expanded state for each expense
  const toggleExpand = (expenseId: string) => {
    setExpandedExpense(prev => (prev === expenseId ? null : expenseId));
  };

  if (userRole !== "supervisor") {
    return (
      <div>
        <p>You do not have permission to access this page.</p>
        <Link href="/">Go back to Home</Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Review Pending Expenses</h2>
      {expenses.length === 0 ? (
        <p>No pending expenses to review.</p>
      ) : (
        <ul>
          {expenses.map((expense) => (
            <li key={expense.id} className="border-b py-4">
              <div>
                {/* Display description and associated user name before clicking */}
                <div onClick={() => toggleExpand(expense.id)} className="cursor-pointer text-blue-600">
                  <strong>{expense.description}</strong>
                  <p className="text-sm text-gray-500">Submitted by: {expense.userName}</p>
                </div>

                {/* If expanded, show the full details */}
                {expandedExpense === expense.id && (
                  <div className="mt-2">
                    <p>Total: ${expense.total}</p>
                    <p>Category: {expense.category}</p>
                    <p>Subcategory: {expense.subcategory}</p>
                    <p>Status: {expense.status}</p>
                    {expense.comments && <p>Comments: {expense.comments}</p>}

                    {/* Show approve/deny options if status is "Pending" */}
                    {expense.status === "Pending" && (
                      <div className="mt-2">
                        <button
                          onClick={() => handleReview(expense.id, "Approved")}
                          className="bg-green-500 text-white p-2 rounded mr-2"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(expense.id, "Denied")}
                          className="bg-red-500 text-white p-2 rounded mr-2"
                        >
                          Deny
                        </button>

                        {/* Show a comment input only for Denied expenses */}
                        {expense.status === "Pending" && (
                          <div className="mt-2">
                            <label htmlFor={`comment-${expense.id}`} className="block text-sm font-medium text-gray-700">
                              Add a comment:
                            </label>
                            <input
                              type="text"
                              id={`comment-${expense.id}`}
                              placeholder="Enter comment"
                              value={comments[expense.id] || ""}
                              onChange={(e) => handleCommentChange(e, expense.id)}
                              className="mt-2 p-2 border border-gray-300 rounded w-full"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-center min-h-screen">
      {/* Back button to navigate to the homepage */}
      <Link href="/">
        <button className="bg-gray-500 text-white p-2 rounded mt-4">
          Back to Home
        </button>
      </Link>
      </div>
    </div>
  );
}
