"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function MainPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser]       = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-white">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Greeting */}
        <div>
          <p className="text-gray-600 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-semibold text-gray-800">
            {user.email}
          </h1>
        </div>

        {/* Blue action buttons */}
        <div className="grid gap-3">
          {[
            { href: "/upload",  label: "Upload Receipts" },
            { href: "/edit",    label: "Edit Expenses" },
            { href: "/summary", label: "View Summary" },
          ].map((btn) => (
            <Link
              key={btn.href}
              href={btn.href}
              className="block text-center py-3 font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {btn.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
