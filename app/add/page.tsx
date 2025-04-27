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

const ExpenseForm = () => {
  const [location, setLocation] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [website, setSite] = useState<string>("");
  const [DOP, setDOP] = useState<string>("");
  const [TOP, setTOP] = useState<string>("");
  const [payMethod, setPayMethod] = useState<string>("");

  const [total, setTotal] = useState<number>(0.00); // Set initial state to 0 float
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null); // User state for authentication
  const [userD, setData] = useState<any>(null);

  const [categoryMap, setCategoryMap] = useState<{[category: string]: string[]}>({});
  const [subcategory, setSubcategory] = useState<string>("");
  const [showCustomSub, setShowCustomSub] = useState<boolean>(false);

  const router = useRouter(); // Initialize router for navigation

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get("data");
    if (encodedData) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(encodedData)));
        if (decoded.Total) setTotal(decoded.Total);
        if (decoded.Store) setDescription(decoded.Store);  
      
      } catch (err) {
        console.error("Error decoding data: ", err);
      }
    }
  }, []);

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");  // Redirect to login if not logged in
      } else {
        setUser(user);   
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setData(data);
          setCategoryMap(data.categoryMap || {});  // If it's undefined, set as empty object
        }
        setLoading(false);
      }
    });
    return () => unsubscribe(); // Cleanup the subscription when component unmounts
  }, [router]); 

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !DOP || !total || !description || !category || !subcategory) {
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
      if (!categoryMap[category] || !categoryMap[category].includes(subcategory)) {
        const updatedMap = {...categoryMap};
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
      setTotal(0.00);
      setCategory("");
      setError(""); // Clear error
      alert(`Expense added: \nLocation: ${location}\nDate: ${DOP}\nDescription: ${description}\nTotal: $${total}\nCategory: ${category}`); // Show data in alert
    } catch (err) {
      console.error("Error adding expense: ", err);
      setError("There was an error adding the expense. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Show alert with the entered data when Enter key is pressed
    if (e.key === "Enter") {
      alert(`Data entered: \nLocation: ${location}\nDate: ${DOP}\nDescription: ${description}\nTotal: $${total}\nCategory: ${category}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;  // Show loading state until authentication is checked
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Add New Expense (* Required)</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleAddExpense} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="*Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="p-2 border border-gray-300 rounded"
            required
            onKeyDown={handleKeyDown} // Add onKeyDown event to show alert
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Phone Number (000-000-0000)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="p-2 border border-gray-300 rounded"
            onKeyDown={handleKeyDown} // Add onKeyDown event to show alert
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="*Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="p-2 border border-gray-300 rounded"
            required
            onKeyDown={handleKeyDown} // Add onKeyDown event to show alert
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Website"
            value={website}
            onChange={(e) => setSite(e.target.value)}
            className="p-2 border border-gray-300 rounded"
            onKeyDown={handleKeyDown} // Add onKeyDown event to show alert
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="*Date of Purchase (MM/DD/YYYY)"
            value={DOP}
            onChange={(e) => setDOP(e.target.value)}
            className="p-2 border border-gray-300 rounded"
            required
            onKeyDown={handleKeyDown} // Add onKeyDown event to show alert
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Time (HH:MM AM/PM)"
            value={TOP}
            onChange={(e) => setTOP(e.target.value)}
            className="p-2 border border-gray-300 rounded"
            onKeyDown={handleKeyDown} // Add onKeyDown event to show alert
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="*Pay Method"
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value)}
            className="p-2 border border-gray-300 rounded"
            required
            onKeyDown={handleKeyDown} // Add onKeyDown event to show alert
          />
        </div>
        <div>
          <label htmlFor="category" className="block mb-2">
            *Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setShowCustomSub(false); // reset subcategory input if category changes
              setSubcategory("");
            }}
            className="p-2 border border-gray-300 rounded"
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
            <label htmlFor="subcategory" className="block mb-2">*Subcategory</label>
            {categoryMap[category]?.length ? (
              <select
                id="subcategory"
                value={subcategory}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setShowCustomSub(true);
                    setSubcategory("");
                  } else {
                    setShowCustomSub(false);
                    setSubcategory(e.target.value);
                  }
                }}
                className="p-2 border border-gray-300 rounded"
                required
              >
                <option value="">Select Subcategory</option>
                {categoryMap[category].map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
                <option value="__custom__">Add new subcategory...</option>
              </select>
            ) : (
              // If no subcategories, show input
              <input
                type="text"
                id="subcategory"
                placeholder="New Subcategory"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="p-2 border border-gray-300 rounded"
                required
              />
            )}

            {/* If adding a new subcategory */}
            {showCustomSub && (
              <div className="mt-2 w-full">
                <input
                  type="text"
                  placeholder="New Subcategory"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="p-2 border border-gray-300 rounded rounded"
                  required
                />
              </div>
            )}
          </div>
        )}
        <div>
          <input
            type="text"
            placeholder="*Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-2 border border-gray-300 rounded"
            required
            onKeyDown={handleKeyDown} // Add onKeyDown event to show alert
          />
        </div>
        <div>
          <input
            type="number"
            placeholder="*Total"
            value={total}
            onChange={(e) => setTotal(e.target.value === "" ? 0 : parseFloat(e.target.value))} // Allow free input
            className="p-2 border border-gray-300 rounded"
            required
            onKeyDown={handleKeyDown} // Add onKeyDown event to show alert
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
          Add Expense
        </button>
      </form>

      {/* Back to Main Page */}
      <div className="flex space-x-4 mt-4 mb-4">
        <Link href="/upload">
          <button className="bg-gray-500 text-white p-2 rounded mt-4">
            Return to Upload
          </button>
        </Link>
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
