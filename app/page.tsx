"use client";

import { useEffect, useState } from "react";
import { useRouter }            from "next/navigation";
import { auth }                 from "./firebase";
import { onAuthStateChanged }   from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // Assuming you have firebase initialized in firebase.js
import Link                     from "next/link";

export default function MainPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser]       = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) router.push("/login");
      else {
        setUser(user);
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser(userSnap.data());
        }
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-black">
      <div className="w-full max-w-md rounded-2xl shadow-lg p-8 space-y-6
                      bg-gray-100 dark:bg-gray-900">
        {/* Greeting */}
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Welcome back,
          </p>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {user ? `${user.Fname} ${user.Lname}` : "Guest"}
          </h1>
        </div>

        {/* Action buttons */}
        <div className="grid gap-3">
          {[
            { href: "/upload",  label: "Upload Receipts" },
            { href: "/edit",    label: "Manage Expenses" },
            { href: "/summary", label: "View Summary" },
          ].map((btn) => (
            <Link
              key={btn.href}
              href={btn.href}
              className="block text-center py-3 font-medium rounded-lg
                         bg-blue-600 text-white hover:bg-blue-700
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {btn.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
