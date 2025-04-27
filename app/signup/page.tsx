"use client"; // Enables client-side rendering in Next.js
import React, { useState } from "react";
import { auth, db } from "../firebase"; // Import authentication and Firestore database
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Firestore functions to create a document
import { useRouter } from "next/navigation";
import Link from "next/link"; // Import Link component for navigation

const SignUpPage = () => {
  // State variables to handle input and errors
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [FName, setFname] = useState("");
  const [LName, setLname] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Function to handle user sign-up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents default submission behavior

    try {
      // Creates a new user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; // Extracts the user object from the response

      // Stores user details in Firestore under 'users' collection using the unique User ID (uid)
      await setDoc(doc(db, "users", user.uid), {
        email: user.email, // Stores the email
        role: "employee", // Default role assigned to a new user and can be changed in the database
        createdAt: new Date(), // Timestamp of account creation
        Fname: FName, //User First Name
        Lname: LName, //User Last Name
      });

      // Redirect to home page after successful sign-up
      router.push("/");
    } catch (err: any) {
      console.error("Error during sign-up: ", err.message);
      setError("Failed to sign up. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-5xl font-bold mb-12">Sign Up for EERIS</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSignUp} className="space-y-4 w-full max-w-md">
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 border border-gray-300 rounded w-full text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 border border-gray-300 rounded w-full text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="First Name"
            value={FName}
            onChange={(e) => setFname(e.target.value)}
            className="p-2 border border-gray-300 rounded w-full text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Last Name"
            value={LName}
            onChange={(e) => setLname(e.target.value)}
            className="p-2 border border-gray-300 rounded w-full text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Sign Up
        </button>
      </form>

      {/* Button to navigate to login page */}
      <div className="mt-4">
        <p className="text-gray-600 dark:text-gray-400">Already have an account?</p>
        <Link href="/login">
          <button className="mt-2 bg-gray-500 text-white p-2 rounded w-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500">
            Login
          </button>
        </Link>
      </div>
    </div>
  );
};

export default SignUpPage;
