"use client"; // Ensures this code runs only on the client-side in Next.js

// Import necessary React hooks and Firebase utilities
import { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Import Firebase database and authentication instance
import {
  collection,
  collectionGroup,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
  getDoc
} from "firebase/firestore"; // Import Firestore functions
import Link from "next/link"; // Import Next.js Link for navigation
import { Slabo_13px } from "next/font/google"; // Import a Google font (not used in this snippet)
import { updateCurrentUser } from "firebase/auth";

// Define the Expense type to ensure type safety in TypeScript
interface Expense {
  id: string;
  address: string;
  comments: string;
  day: string;
  location: string;
  payMethod: string;
  phoneNum?: string;
  receiptName: string;
  status: string;
  subcategory: string;
  time?: string;
  userId: string;
  userName?: string;
  website?: string;
  description: string;
  total: number;
  category: string; // Added category field
  date: any; // Timestamp of the expense entry
  refPath: string;
}

// Define the main component
export default function EditPage() {
  // State variables to store expenses, user role, and user ID
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [categoryMap, setCategoryMap] = useState<{
    [category: string]: string[];
  }>({});
  const [showCustomSub, setShowCustomSub] = useState<boolean>(false);

  // Fetch the logged-in user's role when the component mounts
  useEffect(() => {
    const fetchUserRole = async () => {
      const currentUser = auth.currentUser; // Get currently logged-in user
      if (currentUser) {
        setUserId(currentUser.uid); // Store user ID
        const userRef = doc(db, "users", currentUser.uid); // Reference to the user's document in Firestore
        const userSnap = await getDoc(userRef); // Fetch user document

        if (userSnap.exists()) {
          setUserRole(userSnap.data().role); // Set user role from Firestore data
          setCategoryMap(userSnap.data().categoryMap || {});
        }
      }
    };
    fetchUserRole();
  }, []); // Runs only once when component mounts

  // Fetch expenses based on user role
  useEffect(() => {
    if (userRole === null) return;
  
    let expenseQuery;
    if (userRole === "supervisor") {
      // Supervisors can access all receipts from all users
      expenseQuery = collectionGroup(db, "receipts");
    } else if (userRole === "employee" && userId) {
      // Employees can only access their own receipts subcollection
      expenseQuery = collection(db, "users", userId, "receipts");
    } else {
      return;
    }
  
    const unsubscribe = onSnapshot(expenseQuery, (snapshot) => {
      const updatedExpenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        // Save the full path for supervisor actions
        refPath: doc.ref.path, 
        ...doc.data(),
      })) as Expense[];
      setExpenses(updatedExpenses);
    });
  
    return () => unsubscribe();
  }, [userRole, userId]);

  // Function to open a popup
  const openPopup = (expense: Expense) => {
    setCurrentExpense(expense);
    setPopupOpen(true);
  };

  // Function to handle expense deletion
  const handleDelete = async (id: string, refPath?: string) => {
    try {
      let docRef;
      if (userRole === "supervisor" && refPath) {
        // For supervisor, use the document's full path
        docRef = doc(db, refPath);
      } else if (userRole === "employee" && userId) {
        // For employee, use user's receipts subcollection
        docRef = doc(db, "users", userId, "receipts", id);
      } else {
        throw new Error("No permission or path info.");
      }
  
      await deleteDoc(docRef);
      alert("Expense deleted successfully.");
      setPopupOpen(false);
    } catch (err) {
      alert("Error deleting expense: " + err);
    }
  };

  // Function to handle expense updates
  const handleUpdate = async (
    id: string,
    updatedLocation: string,
    updatedAddress: string,
    updatedDay: string,
    updatedDescription: string,
    updatedTotal: number,
    updatedPayMethod: string,
    updatedCategory: string,
    updatedSubcategory: string,
    updatedPhone?: string,
    updatedWebsite?: string,
    updatedTime?: string,
    refPath?: string
  ) => {
    try {
      let expenseRef;
      if (userRole === "supervisor" && refPath) {
        expenseRef = doc(db, refPath);
      } else if (userRole === "employee" && userId) {
        expenseRef = doc(db, "users", userId, "receipts", id);
      } else {
        throw new Error("No permission or path info.");
      }
      const RName: string = `${updatedLocation} ${updatedDay}`;
      await updateDoc(expenseRef, {
        receiptName: RName,
        location: updatedLocation,
        phoneNum: updatedPhone,
        address: updatedAddress,
        website: updatedWebsite,
        day: updatedDay,
        time: updatedTime,
        description: updatedDescription,
        total: updatedTotal,
        payMethod: updatedPayMethod,
        category: updatedCategory,
        subcategory: updatedSubcategory,
        status: "Pending",
        comments: "",
      });
      // Now update the user's categoryMap if necessary
      if (userId){
        if (
          !categoryMap[updatedCategory] ||
          !categoryMap[updatedCategory].includes(updatedSubcategory)
        ) {
          const updatedMap = { ...categoryMap };
          if (!updatedMap[updatedCategory]) {
            updatedMap[updatedCategory] = [];
          }
          updatedMap[updatedCategory].push(updatedSubcategory);
          await updateDoc(doc(db, "users", userId), {
            categoryMap: updatedMap,
          });
          setCategoryMap(updatedMap);
        }
      }
      alert("Expense updated successfully.");
      setShowCustomSub(false);
      setPopupOpen(false);
    } catch (err) {
      alert("Error updating expense: " + err);
    }
  };

  // Group expenses by category for better display
  const groupedExpenses = expenses.reduce((groups: { [key: string]: Expense[] }, expense) => {
    const { category } = expense;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(expense);
    return groups;
  }, {});

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 dark:bg-black-800 dark:text-white">
      <h1 className="text-3xl font-bold mb-4">Manage Expenses</h1>

      {/* If the user is not authenticated, show a message */}
      {!userId ? (
        <div className="text-red-500">You need to be logged in to view this page.</div>
      ) : (
        <>
          {/* Displaying Expenses by Category */}
          {Object.keys(groupedExpenses).map((category) => (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{category}</h2>

              <ul className="space-y-4">
                {groupedExpenses[category].map((expense) => (
                  <li key={expense.id} className="flex flex-col gap-2">
                    <div>
                      <strong>{expense.receiptName}</strong>
                      {userRole === "supervisor" && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({expense.userName})
                        </span>
                      )}
                    </div>
                    <div>
                      Total: ${expense.total.toFixed(2)}
                    </div>
                    <div>
                      Subcategory: {expense.subcategory}
                    </div>
                    <div>
                      Description: {expense.description}
                    </div>
                    <div>
                      Status: {expense.status}
                    </div>
                    {/* Form to edit expense */}

                    <button
                      onClick={() => openPopup(expense)}
                      className="bg-blue-500 text-white p-2 rounded"
                    >
                      View Expense
                    </button>
                  </li>
                ))}
              </ul>
              {popupOpen && currentExpense && (
                
                <div
                  className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center"
                  onClick={(e) => {
                  if (e.target === e.currentTarget) setPopupOpen(false);
                  }}
                >
                <div className="bg-gray-900 p-6 rounded shadow-lg w-96 max-h-[80vh] overflow-y-auto">
                

                {/* Check if current user is owner */}
                {currentExpense.userId === userId ? (
                <>
                  <h2 className="text-white font-bold mb-4">Edit Expense: {currentExpense.receiptName}</h2>
                  {/* Editable inputs for owner */}
                  <p className="text-white mb-2"><strong>Location:</strong></p>
                  <input
                    type="text"
                    value={currentExpense.location}
                    onChange={(e) => setCurrentExpense({ ...currentExpense, location: e.target.value })}
                    className="w-full mb-2 p-2 border"
                    placeholder="Location"
                  />

                  <p className="text-white mb-2"><strong>Phone Number:</strong></p>
                  <input
                    type="text"
                    value={currentExpense.phoneNum}
                    onChange={(e) => setCurrentExpense({ ...currentExpense, phoneNum: e.target.value })}
                    className="w-full mb-2 p-2 border"
                    placeholder="Phone Number (000-000-0000)"
                  />

                  <p className="text-white mb-2"><strong>Address:</strong></p>
                  <input
                    type="text"
                    value={currentExpense.address}
                    onChange={(e) => setCurrentExpense({ ...currentExpense, address: e.target.value })}
                    className="w-full mb-2 p-2 border"
                    placeholder="Address"
                  />

                  <p className="text-white mb-2"><strong>Website:</strong></p>
                  <input
                    type="text"
                    value={currentExpense.website}
                    onChange={(e) => setCurrentExpense({ ...currentExpense, website: e.target.value })}
                    className="w-full mb-2 p-2 border"
                    placeholder="Website"
                  />

                  <p className="text-white mb-2"><strong>Date:</strong></p>
                  <input
                    type="text"
                    value={currentExpense.day}
                    onChange={(e) => setCurrentExpense({ ...currentExpense, day: e.target.value })}
                    className="w-full mb-2 p-2 border"
                    placeholder="MM/DD/YYYY"
                  />

                  <p className="text-white mb-2"><strong>Time:</strong></p>
                  <input
                    type="text"
                    value={currentExpense.time}
                    onChange={(e) => setCurrentExpense({ ...currentExpense, time: e.target.value })}
                    className="w-full mb-2 p-2 border"
                    placeholder="HH:MM AM/PM"
                  />

                  <p className="text-white mb-2"><strong>Description:</strong></p>
                  <input
                    type="text"
                    value={currentExpense.description}
                    onChange={(e) => setCurrentExpense({ ...currentExpense, description: e.target.value })}
                    className="w-full mb-2 p-2 border"
                    placeholder="Description"
                  />

                  <p className="text-white mb-2"><strong>Total:</strong></p>
                  <input
                    type="number"
                    value={currentExpense.total}
                    onChange={(e) => setCurrentExpense({ ...currentExpense, total: parseFloat(e.target.value)})}
                    className="w-full mb-6 p-2 border"
                    placeholder="Amount"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label htmlFor="category" className="block mb-2">
                        Category
                      </label>
                      <select
                        id="category"
                        value={currentExpense.category}
                        onChange={(e) => {
                          setCurrentExpense({ ...currentExpense, category: e.target.value, subcategory: "" });
                          setShowCustomSub(false);
                        }}
                        className="p-2 border border-gray-300 w-full rounded"
                        
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
                    
                    <div>
                      <label htmlFor="subcategory" className="block mb-2">*Subcategory</label>
                      {categoryMap[currentExpense.category]?.length && !showCustomSub ? (
                        <select
                          id="subcategory"
                          value={currentExpense.subcategory}
                          onChange={(e) => {
                            if (e.target.value === "__custom__") {
                              setShowCustomSub(true);
                              setCurrentExpense({ ...currentExpense, subcategory: "" }); // Reset custom subcategory
                            } else {
                              setShowCustomSub(false);
                              setCurrentExpense({ ...currentExpense, subcategory:e.target.value});
                            }
                          }}
                          className="p-2 border border-gray-300 w-full rounded"
                            
                        >
                          <option value="">Select Subcategory</option>
                          {categoryMap[currentExpense.category].map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                          <option value="__custom__">Add new subcategory...</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          id="subcategory"
                          placeholder="New Subcategory"
                          value={currentExpense.subcategory}
                          onChange={(e) => setCurrentExpense({ ...currentExpense, subcategory:e.target.value})}
                          className="p-2 border border-gray-300 rounded w-full"
                            
                        />
                      )}
                    </div>
                    
                  </div>

                    <p className="text-white mb-2"><strong>Status:</strong> {currentExpense.status}</p>
                    <p className="text-white mb-2"><strong>Supervisor Comment:</strong></p>
                    <p className="text-white mb-2">{currentExpense.comments}</p>

                    <button
                      onClick={() =>
                        handleUpdate(
                          currentExpense.id,
                          currentExpense.location,
                          currentExpense.address,
                          currentExpense.day,
                          currentExpense.description,
                          currentExpense.total,
                          currentExpense.payMethod,
                          currentExpense.category,
                          currentExpense.subcategory,
                          currentExpense.phoneNum,
                          currentExpense.website,
                          currentExpense.time,
                          currentExpense.refPath
                        )
                      }
                      className="bg-blue-500 text-white mr-2 p-2 rounded"
                    >
                      Update Expense
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(currentExpense.id, currentExpense.refPath)}
                      className="bg-red-500 text-white mr-2 p-2 rounded"
                    >
                      Delete Expense
                    </button>
                </>
                ) : (
                <>
                  <h2 className="text-white font-bold mb-4">View Expense: {currentExpense.receiptName}</h2>
                  {/* Read-only view for Supervisors */}
                  <p className="text-white mb-6"><strong>Owner:</strong> {currentExpense.userName}</p>
                  <p className="text-white mb-2"><strong>Location:</strong> {currentExpense.location}</p>
                  <p className="text-white mb-2"><strong>Phone Number:</strong> {currentExpense.phoneNum}</p>
                  <p className="text-white mb-2"><strong>Address:</strong> {currentExpense.address}</p>
                  <p className="text-white mb-2"><strong>Website:</strong> {currentExpense.website}</p>
                  <p className="text-white mb-2"><strong>Date:</strong> {currentExpense.day}</p>
                  <p className="text-white mb-2"><strong>Time:</strong> {currentExpense.time}</p>
                  <p className="text-white mb-2"><strong>Description:</strong> {currentExpense.description}</p>
                  <p className="text-white mb-2"><strong>Total:</strong> ${currentExpense.total.toFixed(2)}</p>
                  <p className="text-white mb-6"><strong>Pay Method:</strong> {currentExpense.payMethod}</p>
                  <p className="text-white mb-2"><strong>Category:</strong> {currentExpense.category}</p>
                  <p className="text-white mb-6"><strong>Subcategory:</strong> {currentExpense.subcategory}</p>
                  <p className="text-white mb-2"><strong>Status:</strong> {currentExpense.status}</p>
                  <p className="text-white mb-2"><strong>Supervisor Comment:</strong></p>
                  <p className="text-white mb-2">{currentExpense.comments}</p>
                </>
                )}

                <button
                onClick={() => setPopupOpen(false)}
                className="bg-gray-500 text-white p-2 rounded"
                >
                Close
                </button>
                </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Back button to navigate to the homepage */}
      <Link href="/">
        <button className="bg-gray-500 text-white p-2 rounded mt-4">
          Back to Home
        </button>
      </Link>
    </div>
  );
}
