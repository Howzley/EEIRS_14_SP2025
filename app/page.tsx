"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function MainPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);  
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");  
      } else {
        setUser(user);  
        setLoading(false);  
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;  
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* Greeting Moved Up */}
      {user && <p className="text-xl mb-4">Hello, {user.email}!</p>}

      <h1 className="text-5xl font-bold mb-8">Select your action</h1>

      {/* Navigation Buttons */}
      <Link href="/add">
        <button className="bg-blue-500 text-white p-2 rounded mb-3">
          Go to Expenses
        </button>
      </Link>

      <Link href="/edit">
        <button className="bg-blue-500 text-white p-2 rounded mb-3">
          Edit Expenses
        </button>
      </Link>

      <Link href="/summary">
        <button className="bg-blue-500 text-white p-2 rounded mb-3">
          Go to Summary
        </button>
      </Link>

      {/* Logout Button */}
      <button
        onClick={() => {
          auth.signOut();  
          router.push("/login");  
        }}
        className="bg-red-500 text-white p-2 rounded mt-6"
      >
        Logout
      </button>
    </div>
  );
}
