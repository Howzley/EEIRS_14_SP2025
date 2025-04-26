"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function Navbar() {
  const path = usePathname();
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // mark mounted so theme is defined
  useEffect(() => {
    setMounted(true);
  }, []);

  // auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) setEmail(user.email);
      else router.push("/login");
    });
  }, [router]);

  // don’t show on auth pages
  if (path === "/login" || path === "/signup") return null;

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900 shadow-md h-16 flex items-center justify-between px-6 z-50">
      {/* Left-side links */}
      <div className="flex space-x-6 text-white">
        <Link href="/">Dashboard</Link>
        <Link href="/upload">Upload</Link>
        <Link href="/edit">Manage</Link>
        <Link href="/summary">Summary</Link>
      </div>

      {/* Right-side: email → toggle → logout */}
      <div className="flex items-center space-x-4">
        {email && <span className="text-sm text-gray-300">{email}</span>}

        {/* only render toggle after mount */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
            aria-label="Toggle dark mode"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        )}

        <button
          onClick={() => {
            auth.signOut();
            router.push("/login");
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded focus:outline-none"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
