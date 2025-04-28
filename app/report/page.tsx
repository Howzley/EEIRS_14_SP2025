"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { collection, getDocs, collectionGroup, onSnapshot, query, where } from "firebase/firestore";


const CategoryPieChart = dynamic(() => import("../components/CategoryPieChart"), { ssr: false });
const YearlyExpenseBar = dynamic(() => import("../components/YearlyExpensesBar"), { ssr: false });
const TotalReceipts = dynamic(() => import("../components/TotalReceipts"), { ssr: false });
const TotalExpenses = dynamic(() => import("../components/TotalExpenses"), { ssr: false });

interface Expense {
  id: string;
  description: string;
  total: number;
  category: string;
  timestamp: any;
  receiptName: string;
  day: string;
  userId: string;
}

// Capitalize each word in a string
function capitalizeWords(str: string) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

function downloadCSV(expenses: any[], users: { [uid: string]: { Fname: string, Lname: string, role?: string } }) {
    const userMap: {
      [uid: string]: {
        userId: string;
        Fname?: string;
        Lname?: string;
        role?: string;
        totalReceipts: number;
        total: number;
        [category: string]: any;
      };
    } = {};
  
    const categoriesSet = new Set<string>();
    expenses.forEach((exp) => {
      if (exp.category) categoriesSet.add(exp.category);
  
      if (!userMap[exp.userId]) {
        const userInfo = users[exp.userId] || {};
        userMap[exp.userId] = {
          userId: exp.userId,
          Fname: userInfo.Fname || "",
          Lname: userInfo.Lname || "",
          role: userInfo.role || "",
          totalReceipts: 0,
          total: 0,
        };
      }
      userMap[exp.userId].totalReceipts += 1;
      userMap[exp.userId].total += exp.total ?? 0;
      if (exp.category) {
        userMap[exp.userId][exp.category] =
          (userMap[exp.userId][exp.category] ?? 0) + (exp.total ?? 0);
      }
    });
  
    const categories = Array.from(categoriesSet);
    const header = [
      "userId",
      "Fname",
      "Lname",
      "totalReceipts",
      "total",
      ...categories,
      "role",
    ];
  
    const rows = [header.join(",")];
    Object.values(userMap).forEach((user) => {
      const row = [
        user.userId,
        user.Fname,
        user.Lname,
        user.totalReceipts,
        user.total.toFixed(2),
        ...categories.map((cat) =>
          user[cat] ? Number(user[cat]).toFixed(2) : "0.00"
        ),
        user.role || "",
      ];
      rows.push(row.join(","));
    });
  
    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "receipts_report.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

export default function ReportPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<{ [key: string]: number }>({});
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [chartData, setChartData] = useState<{category: string, total: number}[]>([]);
  const [users, setUsers] = useState<{ [uid: string]: { Fname: string, Lname: string, role?: string } }>({});


  useEffect(() => {
    // Require login to access
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) setUser(user);
      else {
        setUser(null);
        router.push("/login");
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    // Fetch all users and save to state
    async function fetchUsers() {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const usersData: { [uid: string]: { Fname: string, Lname: string, role?: string } } = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        usersData[doc.id] = {
          Fname: data.Fname || "",
          Lname: data.Lname || "",
          role: data.role || "",
        };
      });
      setUsers(usersData);
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    // Fetch all receipts with status Approved
    const receiptsGroupRef = collectionGroup(db, "receipts");
    const approvedQuery = query(receiptsGroupRef, where("status", "==", "Approved"));

    const unsubscribe = onSnapshot(approvedQuery, (snapshot) => {
      const updatedExpenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];

      setExpenses(updatedExpenses);

      // Calculate total and category totals
      const total = updatedExpenses.reduce((acc, expense) => acc + expense.total, 0);
      setTotalExpense(total);

      const categoryTotals: { [key: string]: number } = {};
      updatedExpenses.forEach((expense) => {
        if (expense.category) {
          if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += expense.total;
          } else {
            categoryTotals[expense.category] = expense.total;
          }
        }
      });
      setCategoryTotals(categoryTotals);

      const chartData = Object.entries(categoryTotals).map(([category, total]) => ({
        category,
        total,
      }));
      setChartData(chartData);
    });

    return () => unsubscribe();
  }, []); // Only runs once

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 pb-20 gap-6 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-5xl font-bold">
        Company-Wide Expense Report
      </h1>
      <h1 className="text-3xl font-bold mb-10">
        Total Expenses: ${totalExpense.toFixed(2)}
      </h1>
      <div className="flex w-full max-w-5xl gap-12 items-start justify-between">
        <div className="flex-1">
          <div className="w-full max-w-md p-4 bg-gray-900 border-2 border-gray-300 rounded-lg shadow-lg mb-10">
            <h2 className="text-xl font-bold text-gray-300 mb-4">Total Expense Per Category:</h2>
            <ul>
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1]) // Sort descending by total
                .map(([category, total]) => (
                  <li key={category} className="flex text-gray-300 justify-between mb-2 p-2 border-b">
                    <span>{capitalizeWords(category)}</span>
                    <span>${(total ?? 0).toFixed(2)}</span>
                  </li>
                ))}
            </ul>
          </div>
          <div className="w-full max-w-md p-4 bg-gray-900 border-2 border-gray-300 rounded-lg shadow-lg mb-4">
            <h2 className="text-gray-300 font-bold text-xl mb-4">All Approved Receipts:</h2>
            <ul>
              {[...expenses]
                .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
                .map((expense) => (
                  <li key={expense.id} className="flex text-gray-300 justify-between mb-2 p-2 border-b">
                    <span>{expense.receiptName}</span>
                    <span>${(expense.total ?? 0).toFixed(2)}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
        <div className="w-[350px] min-w-[300px] flex flex-col items-center gap-8">
          {chartData.length > 0 && (
            <CategoryPieChart data={chartData} />
          )}
          <YearlyExpenseBar expenses={expenses} />
          <TotalReceipts expenses={expenses} />
          <TotalExpenses expenses={expenses} />
        </div>
      </div>
      <button
      onClick={() => downloadCSV(expenses, users)}
      className="bg-green-600 text-white px-4 py-2 rounded mb-6"
      >
      Download Receipts CSV
      </button>
      <Link href="/">
        <button className="bg-gray-500 text-white p-2 rounded">
          Back to Home
        </button>
      </Link>
    </div>
  );
}