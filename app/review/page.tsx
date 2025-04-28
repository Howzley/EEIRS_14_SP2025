"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collectionGroup, query, where, onSnapshot, updateDoc, doc, getDoc } from "firebase/firestore";
import Link from "next/link";

interface Expense {
  id: string;
  description: string;
  total: number;
  category: string;
  subcategory: string;
  timestamp: any;
  refPath: string;
  status: string;
  receiptUID: string;
  userName: string;
  comments?: string;
  [key: string]: any; // Allow extra fields dynamically
}

export default function ReviewPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loggedUID, setLoggedUID] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [id: string]: string }>({});
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setLoggedUID(currentUser.uid);
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserRole(userSnap.data().role);
        }
      }
    };
    fetchUserRole();
  }, []);

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
            receiptUID: expenseData.userId,
            userName: expenseData.userName,
            comments: expenseData.comments || "",
            ...expenseData // allow extra fields
          };
          return expense;
        });
        setExpenses(fetchedExpenses);
      });
      return () => unsubscribe();
    }
  }, [userRole]);

  const handleReview = async (expenseId: string, newStatus: string) => {
    const comment = comments[expenseId] || "";

    if (newStatus === "Denied" && !comment) {
      alert("You must provide a comment for denied receipts.");
      return;
    }

    if (!loggedUID) {
      alert("User ID is not available.");
      return;
    }

    try {
      const expense = expenses.find((exp) => exp.id === expenseId);
      if (!expense) {
        console.error("Expense not found.");
        alert("Expense not found.");
        return;
      }

      const { receiptUID } = expense;

      if (!receiptUID) {
        alert("Receipt user ID not found.");
        return;
      }

      const expenseRef = doc(db, "users", receiptUID, "receipts", expenseId);
      const expenseDoc = await getDoc(expenseRef);

      if (!expenseDoc.exists()) {
        console.error("No document found:", expenseRef.path);
        alert(`No document found for ID: ${expenseId}`);
        return;
      }

      const updatedData: any = {
        status: newStatus,
      };

      if (newStatus === "Denied" && comment) {
        updatedData.comments = comment;
      }

      if (newStatus === "Approved" && comment.trim() !== "") {
        updatedData.comments = comment;
      }

      await updateDoc(expenseRef, updatedData);

      alert(`Expense successfully ${newStatus.toLowerCase()}.`);
    } catch (err) {
      console.error("Error changing expense status:", err);
      alert("Error changing expense status: " + err);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>, expenseId: string) => {
    setComments(prevComments => ({
      ...prevComments,
      [expenseId]: e.target.value,
    }));
  };

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
                <div onClick={() => toggleExpand(expense.id)} className="cursor-pointer text-blue-600">
                  <strong>{expense.receiptName}</strong>
                  <p className="text-sm text-gray-500">Submitted by: {expense.userName}</p>
                </div>

                {expandedExpense === expense.id && (
                  <div className="mt-2 space-y-2">
                    <p><strong>Description:</strong> {expense.description}</p>
                    <p><strong>Total:</strong> ${expense.total.toFixed(2)}</p>
                    <p><strong>Status:</strong> {expense.status}</p>

                    {expense.date && (
                      <p><strong>Date Uploaded:</strong> {expense.date.toDate().toLocaleString()}</p>
                    )}
                    {expense.day && (
                      <p><strong>Day:</strong> {expense.day}</p>
                    )}
                    {expense.time && (
                      <p><strong>Time:</strong> {expense.time}</p>
                    )}
                    {expense.location && (
                      <p><strong>Location:</strong> {expense.location}</p>
                    )}
                    {expense.address && (
                      <p><strong>Address:</strong> {expense.address}</p>
                    )}
                    {expense.category && (
                      <p><strong>Category:</strong> {expense.category}</p>
                    )}
                    {expense.subcategory && (
                      <p><strong>Subcategory:</strong> {expense.subcategory}</p>
                    )}
                    {expense.payMethod && (
                      <p><strong>Payment Method:</strong> {expense.payMethod}</p>
                    )}
                    {expense.phoneNum && expense.phoneNum.trim() !== "" && (
                      <p><strong>Phone Number:</strong> {expense.phoneNum}</p>
                    )}
                    {expense.website && expense.website.trim() !== "" && (
                      <p><strong>Website:</strong> {expense.website}</p>
                    )}
                    {expense.comments && (
                      <p><strong>Supervisor Comments:</strong> {expense.comments}</p>
                    )}

                    {expense.status === "Pending" && (
                      <div className="mt-4">
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-center">
        <Link href="/">
          <button className="bg-gray-500 text-white p-2 rounded mt-4">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
