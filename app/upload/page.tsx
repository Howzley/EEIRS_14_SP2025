// app/upload/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "../firebase"; 
import { onAuthStateChanged } from "firebase/auth";

export default function FileUploadPage() {
  const [file, setFile] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null); 
  const [result, setResult] = useState<any>(null)
  const router = useRouter();

  // Firebase Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user); 
      } else {
        setUser(null);
        router.push("/login"); 
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Will handle the selection of files
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFile(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // For when the receipt is submitted
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const queryParam = []; // To store the data after scanning the image
    router.push(`/add`); // Line to be implemented, will send a data container with all the scanned information.
  };

  const handleUpload = async () => {
    if(!file) return

    const formData = new FormData();
    const blob = await fetch(file).then(r => r.blob()); // Convert the base64 string to a Blob
    formData.append("file", blob); // Append the file to the FormData object

    const res = await fetch('http://localhost:8000/scan-receipt', {
      method: 'POST',
      body: formData,
    })
    
    const data = await res.json();
    setResult(data.data);

    const encodedData = encodeURIComponent(btoa(JSON.stringify(data.data)));
    router.push(`/add?data=${encodedData}`); // Redirect to the add page with the scanned data

  }
  
  // For when user skips receipt
  const handleSkip = () => {
    router.push("/add"); // Navigate to add page without receipt to scan
  };

  if (!user) {
    return null; // Optionally, you can show a loading indicator or redirect if the user is not authenticated.
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Upload a Receipt</h1>

      {/* File Input */}
      <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="border p-2 rounded mb-4" />

      {file && (
        <div className="mt-4 p-2 border border-gray-300 rounded-lg">
          {file.includes("application/pdf") ? (
            <embed src={file} className="w-64 h-64" />
          ) : (
            <img src={file} alt="Preview" className="max-w-xs rounded-lg" />
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex space-x-4 mt-4 mb-4">
        <button
          onClick={handleUpload}
          className="p-2 bg-blue-500 text-white rounded"
        >
          Scan
        </button>
        <button
          onClick={handleSkip}
          className="p-2 bg-blue-500 text-white rounded"
        >
          Input Data Yourself
        </button>
      </div>

      {/* Return to Menu Button */}
      <Link href="/">
        <button className="bg-gray-500 text-white p-2 rounded mt-4">
          Back to Home
        </button>
      </Link>
    </div>
  );
}
