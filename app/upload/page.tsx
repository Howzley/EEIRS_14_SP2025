// app/upload/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FileUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  
  // Will handle the selection of files
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // For when the receipt is submitted
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const queryParam = file ? `?file=${encodeURIComponent(file.name)}` : "";
    router.push(`/add${queryParam}`); // Pass receipt image if possible and go to add page
  };
  
  // For when user skips receipt
  const handleSkip = () => {
    router.push("/add"); // Navigate to add page without receipt to scan
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Upload a Receipt</h1>

      {/* File Input */}
      <input type="file" onChange={handleFileChange} className="border p-2 rounded mb-4" />

      {/* Buttons */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={handleSubmit}
          className="p-2 bg-blue-500 text-white rounded"
        >
          Scan
        </button>
        <button
          onClick={handleSkip}
          className="p-2 bg-green-500 text-white rounded"
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
