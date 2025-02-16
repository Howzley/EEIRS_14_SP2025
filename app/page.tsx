// app/page.tsx
"use client";
import Link from "next/link";

export default function MainPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-12">Welcome to EERIS!</h1>

      {/* Button to go to Expenses page */}
      <Link href="/add">
        <button className="bg-blue-500 text-white p-2 rounded mb-4">
          Go to Expenses
        </button>
      </Link>

      {/* Button to go to Edit Expenses page */}
      <Link href="/edit">
        <button className="bg-blue-500 text-white p-2 rounded">
          Edit Expenses
        </button>
      </Link>
    </div>
  );
}
