"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { doc, getDoc, collection, query, where, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function Navbar() {
  const path = usePathname();
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // Explicitly typing the refs
  const inboxRef = useRef<HTMLDivElement | null>(null); // Ref for the inbox dropdown
  const buttonRef = useRef<HTMLButtonElement | null>(null); // Ref for the inbox button
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        setEmail(user.email);
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setRole(userData.role);
        }

        // ✨ Updated Query - no timestamp needed
        const commentsQuery = query(
          collection(db, "users", user.uid, "receipts"),
          where("status", "in", ["Approved", "Denied"]),
          limit(5) // Limit to 5 recent receipts, no ordering
        );

        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
          const fetchedComments = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              comment: data.comments || "No comment",
              receiptId: doc.id,
              status: data.status || "Unknown",
            };
          });
          console.log("Fetched recent comments:", fetchedComments); // ✅ Debug
          setRecentComments(fetchedComments);
        });

        return unsubscribe;
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  // Close inbox when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inboxRef.current && !inboxRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsInboxOpen(false); // Close inbox if click is outside
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  if (path === "/login" || path === "/signup") return null;

  if (!role) {
    return <div>Loading...</div>;
  }

  const isSupervisor = role === "supervisor";

  if (!mounted) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900 shadow-md h-16 flex items-center justify-between px-6 z-50">
      <div className="flex space-x-6 text-white">
        <Link href="/">Dashboard</Link>
        <Link href="/upload">Upload</Link>
        <Link href="/edit">Manage</Link>
        <Link href="/summary">Summary</Link>

        {isSupervisor && (
          <>
            <Link href="/review">Review</Link>
            <Link href="/report">Report</Link>
          </>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {email && <span className="text-sm text-gray-300">{email}</span>}

        {mounted && (
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
            aria-label="Toggle dark mode"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        )}

        {/* 📥 Inbox Dropdown */}
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsInboxOpen((prev) => !prev)}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
            aria-label="Inbox"
          >
            📥
          </button>
          {isInboxOpen && (
            <div
              ref={inboxRef}
              className="absolute right-0 mt-2 w-64 rounded-lg p-2 shadow-lg border border-gray-600
                          bg-white text-black dark:bg-gray-800 dark:text-white"
            >
              <h3 className="font-bold text-sm mb-2">Recent Updates</h3>
              {recentComments.length === 0 ? (
                <p className="text-sm">No new updates</p>
              ) : (
                recentComments
                  .filter((comment) => comment.status === "Approved" || comment.status === "Denied")
                  .map((comment) => (
                    <div key={comment.receiptId} className="border-b border-gray-300 dark:border-gray-700 py-2">
                      <p>
                        <strong>Status:</strong> 
                        <span
                          className={`ml-1 ${
                            comment.status === "Approved"
                              ? "text-green-500"
                              : comment.status === "Denied"
                              ? "text-red-500"
                              : "text-gray-500"
                          }`}
                        >
                          {comment.status}
                        </span>
                      </p>
                      <p><strong>Comment:</strong> {comment.comment}</p>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={async () => {
            await auth.signOut();
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
