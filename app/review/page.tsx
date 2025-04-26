// app/review/page.tsx
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
  amount: number;
  category: string; // Added category field
  timestamp: any; // Timestamp of the expense entry
  refPath: string;
  status: string;
}

const [comments, setComments] = useState<{[id: string]: string}>({});

// Define the main component
export default function ReviewPage() {
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


  const handleReview = async (status: string, newStatus: string, refPath?: string) => {
    try {
      let docRef;
      if (userRole === 'supervisor' && refPath) {
        docRef = doc(db, refPath)
      } else {
        throw new Error("No permission or path info.");
      }
      await updateDoc(docRef, {status: newStatus});
      alert("Expense successfully approved.");
    } catch (err) {
      alert("Error approving expense: " + err);
    }
  };
}


