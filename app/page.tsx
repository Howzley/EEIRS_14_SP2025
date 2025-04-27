"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import Link from "next/link";

interface User {
  Fname?: string;
  Lname?: string;
  role?: string;
  uid?: string;
}

export default function MainPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [pendingReceipts, setPendingReceipts] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUser((prevState) => ({
            ...prevState,
            Fname: userData.Fname,
            Lname: userData.Lname,
            role: userData.role,
            uid: userData.uid,
          }));
        }

        // Fetch Pending Receipts (filtering by status 'Pending')
        const receiptsRef = collection(db, "users", user.uid, "receipts");
        const q = query(receiptsRef, where("status", "in", ["Pending", "Approved", "Denied"]));  // Add multiple status filter
        const querySnapshot = await getDocs(q);
        const receipts = querySnapshot.docs.map((doc) => doc.data());
        setPendingReceipts(receipts);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <span className="text-gray-800 dark:text-gray-200">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isSupervisor = user.role === "supervisor";

  // Calculate the counts for each status
  const approvedCount = pendingReceipts.filter((receipt) => receipt.status === 'Approved').length;
  const pendingCount = pendingReceipts.filter((receipt) => receipt.status === 'Pending').length;
  const deniedCount = pendingReceipts.filter((receipt) => receipt.status === 'Denied').length;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-black">
      <div className="w-full max-w-md rounded-2xl shadow-lg p-8 space-y-6 bg-gray-100 dark:bg-gray-900">
        {/* Greeting */}
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {user.Fname} {user.Lname}
          </h1>
        </div>

        {/* Receipts Status */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <h2 className="text-xl font-semibold">Receipts Status:</h2>
          {/* Displaying counts for each receipt status */}
          <p className="text-green-500">Approved: {approvedCount}</p>  {/* Green for approved */}
          <p className="text-yellow-500">Pending: {pendingCount}</p>    {/* Yellow for pending */}
          <p className="text-red-500">Denied: {deniedCount}</p>         {/* Red for denied */}
        </div>

        {/* Recent Activity */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <h2 className="text-xl font-semibold">Recent Activity:</h2>
          <ul>
            {pendingReceipts.map((receipt, index) => (
              <li key={index}>
                {receipt.receiptName} -   
                <span
                  className={
                    receipt.status === "Approved"
                      ? "text-green-500"
                      : receipt.status === "Pending"
                      ? "text-yellow-500"
                      : receipt.status === "Denied"
                      ? "text-red-500"
                      : "text-gray-500" // Default color if no status matches
                  }
                >
                  {" "}{receipt.status} {/* Added a space before status */}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="grid gap-3">
          <Link
            href="/upload"
            className="block text-center py-3 font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Upload Receipts
          </Link>

          <Link
            href="/edit"
            className="block text-center py-3 font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Edit Expenses
          </Link>

          <Link
            href="/summary"
            className="block text-center py-3 font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            View Summary
          </Link>

          {/* Supervisor-only buttons */}
          {isSupervisor && (
            <>
              <Link
                href="/review"
                className="block text-center py-3 font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Review Submissions
              </Link>

              <Link
                href="/report"
                className="block text-center py-3 font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                View Report
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
