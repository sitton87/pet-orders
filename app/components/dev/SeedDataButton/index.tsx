"use client";

import { useState } from "react";

export default function SeedDataButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const generateSampleData = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/seed-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          `✅ הצלחה! נוצרו: ${data.data.suppliers} ספקים, ${data.data.orders} הזמנות, ${data.data.categories} קטגוריות`
        );
        // רענון הדף אחרי 2 שניות
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(`❌ שגיאה: ${data.error}`);
      }
    } catch (error) {
      setMessage("❌ שגיאה בחיבור לשרת");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-yellow-800">
            🚀 מצב פיתוח - הוספת נתונים לדוגמה
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            לחץ כדי להוסיף 5 ספקים מפורטים עם 6 הזמנות + קטגוריות ועמילויות
          </p>
        </div>
        <button
          onClick={generateSampleData}
          disabled={isLoading}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>יוצר נתונים...</span>
            </>
          ) : (
            <span>הוסף נתונים לדוגמה</span>
          )}
        </button>
      </div>

      {message && (
        <div className="mt-3 p-2 bg-white rounded border text-sm">
          {message}
        </div>
      )}
    </div>
  );
}
