"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import useRouter from next/navigation
import { auth } from "../firebase"; // Assuming you have firebase initialized in firebase.js
import { onAuthStateChanged } from "firebase/auth"; // Firebase Auth function
import { db } from "../firebase"; // Assuming you have firebase initialized in firebase.js
import { addDoc, collection } from "firebase/firestore"; // Firebase Firestore functions
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { updateDoc } from "firebase/firestore"; // Import Firestore functions
import Image from "next/image";

const ExpenseForm = () => {
  const [location, setLocation] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [website, setSite] = useState<string>("");
  const [DOP, setDOP] = useState<string>("");
  const [TOP, setTOP] = useState<string>("");
  const [payMethod, setPayMethod] = useState<string>("");

  const [total, setTotal] = useState<number>(0.0); // Set initial state to 0 float
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null); // User state for authentication
  const [userD, setData] = useState<any>(null);

  const [categoryMap, setCategoryMap] = useState<{
    [category: string]: string[];
  }>({});
  const [subcategory, setSubcategory] = useState<string>("");
  const [showCustomSub, setShowCustomSub] = useState<boolean>(false);

  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const router = useRouter(); // Initialize router for navigation

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get("data");
    const imageData = localStorage.getItem("receiptImage");

    if (imageData) {
      setReceiptImage(imageData);
    }

    if (encodedData) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(encodedData)));

        if (decoded.store_name) setLocation(decoded.store_name);
        if (decoded.store_phone_number) setPhone(decoded.store_phone_number);
        if (decoded.store_address) setAddress(decoded.store_address);
        if (decoded.store_website) setSite(decoded.store_website);
        if (decoded.date_purchase) setDOP(decoded.date_purchase);
        if (decoded.time_purchase) setTOP(decoded.time_purchase);
        if (decoded.payment_method) setPayMethod(decoded.payment_method);
        if (decoded.total_price) setTotal(decoded.total_price);
        if (decoded.description) setDescription(decoded.description);
        if (decoded.category) setCategory(decoded.category);
        if (decoded.subcategory) setSubcategory(decoded.subcategory);

        console.log("Decoded data: ", decoded);
      } catch (err) {
        console.error("Error decoding data: ", err);
      }
    }
  }, []);

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login"); // Redirect to login if not logged in
      } else {
        setUser(user);
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setData(data);
          setCategoryMap(data.categoryMap || {}); // If it's undefined, set as empty object
        }
        setLoading(false);
      }
    });
    return () => unsubscribe(); // Cleanup the subscription when component unmounts
  }, [router]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !location ||
      !DOP ||
      !total ||
      !description ||
      !category ||
      (showCustomSub ? !subcategory.trim() : !subcategory)
    ) {
      setError("Please fill out all required fields.");
      return;
    }
    const RName: string = `${location} ${DOP}`;
    const UName: string = `${userD.Fname} ${userD.Lname}`;
    try {
      // Add expense to Firestore
      await addDoc(collection(db, "users", user.uid, "receipts"), {
        receiptName: RName,
        userName: UName,
        location: location,
        phoneNum: phone,
        address: address,
        website: website,
        day: DOP,
        time: TOP,
        payMethod: payMethod,
        total: total, // (Hopefully not needed anymore) Convert amount to number before storing
        description,
        category,
        userId: user.uid,
        date: new Date(),
        status: "Pending",
        comments: "",
        subcategory,
      });
      // Now update the user's categoryMap if necessary
      if (
        !categoryMap[category] ||
        !categoryMap[category].includes(subcategory)
      ) {
        const updatedMap = { ...categoryMap };
        if (!updatedMap[category]) {
          updatedMap[category] = [];
        }
        updatedMap[category].push(subcategory);
        await updateDoc(doc(db, "users", user.uid), {
          categoryMap: updatedMap,
        });
        setCategoryMap(updatedMap);
      }
      // Clear the form after successful submission
      setLocation("");
      setPhone("");
      setAddress("");
      setSite("");
      setDOP("");
      setTOP("");
      setPayMethod("");
      setDescription("");
      setTotal(0.0);
      setCategory("");
      setError(""); // Clear error
      setReceiptImage(null);
      alert(
        `Expense added: \nLocation: ${location}\nDate: ${DOP}\nDescription: ${description}\nTotal: $${total}\nCategory: ${category}`
      ); // Show data in alert
      router.push("/upload")
    } catch (err) {
      console.error("Error adding expense: ", err);
      setError("There was an error adding the expense. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Show alert with the entered data when Enter key is pressed
    if (e.key === "Enter") {
      alert(
        `Data entered: \nLocation: ${location}\nDate: ${DOP}\nDescription: ${description}\nTotal: $${total}\nCategory: ${category}`
      );
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Show loading state until authentication is checked
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto lg:px-8 pt-6">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
          Add New Expense
        </h1>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Receipt Image */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl text-center font-semibold mb-4 text-gray-900 dark:text-white">
              Receipt Items
            </h2>
            {receiptImage ? (
              <div className="relative w-full max-h-[700px] rounded-lg overflow-y-auto overflow-hidden border border-black dark:border-white">
                <Image
                  src={receiptImage}
                  alt="Receipt"
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: '100%', height: 'auto' }}
                  className="rounded-lg"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[500px] bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-300">No receipt image available</p>
              </div>
            )}
          </div>
  
          {/* Right Column - Form */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl text-center font-semibold mb-4 text-gray-900 dark:text-white">
              Receipt Details
            </h2>
  
            {error && <p className="text-red-500 mb-4">{error}</p>}
  
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label
                  htmlFor="location"
                  className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
  
              {/* Phone number and Website */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label
                    htmlFor="phone"
                    className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phone"
                    placeholder="Phone Number (000-000-0000)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="website"
                    className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Website
                  </label>
                  <input
                    type="text"
                    id="website"
                    placeholder="Website"
                    value={website}
                    onChange={(e) => setSite(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
  
              <div>
                <label
                  htmlFor="address"
                  className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
  
              {/* Date and Time of Purchase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label
                    htmlFor="dop"
                    className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Date of Purchase
                  </label>
                  <input
                    type="text"
                    id="dop"
                    placeholder="Date of Purchase (MM/DD/YYYY)"
                    value={DOP}
                    onChange={(e) => setDOP(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="top"
                    className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Time of Purchase
                  </label>
                  <input
                    type="text"
                    id="top"
                    placeholder="Time (HH:MM AM/PM)"
                    value={TOP}
                    onChange={(e) => setTOP(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
  
              {/* Category and Sub-category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label
                    htmlFor="category"
                    className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setShowCustomSub(false); // reset subcategory input if category changes
                      setSubcategory("");
                    }}
                    className="p-2 border border-gray-300 dark:border-gray-600 w-full rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="travel">Travel</option>
                    <option value="meals">Meals</option>
                    <option value="office supplies">Office Supplies</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="training">Training</option>
                    <option value="transportation">Transportation</option>
                    <option value="others">Others</option>
                  </select>
                </div>
                {category && (
                  <div>
                    <label
                      htmlFor="subcategory"
                      className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      *Subcategory
                    </label>
                    {categoryMap[category]?.length && !showCustomSub ? (
                      <select
                        id="subcategory"
                        value={subcategory}
                        onChange={(e) => {
                          if (e.target.value === "__custom__") {
                            setShowCustomSub(true);
                            setSubcategory(""); // Reset custom subcategory
                          } else {
                            setShowCustomSub(false);
                            setSubcategory(e.target.value);
                          }
                        }}
                        className="p-2 border border-gray-300 dark:border-gray-600 w-full rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Select Subcategory</option>
                        {categoryMap[category].map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                        <option value="__custom__">Add new subcategory...</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        id="subcategory"
                        placeholder="New Subcategory"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    )}
                  </div>
                )}
              </div>
  
              {/* Payment method and Total Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label
                    htmlFor="payMethod"
                    className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Payment Method
                  </label>
                  <input
                    type="text"
                    id="payMethod"
                    placeholder="Payment Method"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="total"
                    className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Total Amount
                  </label>
                  <input
                    type="number"
                    id="total"
                    placeholder="Total Amount"
                    value={total}
                    onChange={(e) => setTotal(parseFloat(e.target.value))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    step="0.01"
                  />
                </div>
              </div>
  
              <div>
                <label
                  htmlFor="description"
                  className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Add Expense
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <Link href="/">
          <button className="bg-gray-500 text-white p-2 rounded mt-4">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
    
  );  
};

export default ExpenseForm;
