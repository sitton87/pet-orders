"use client";

import { useState } from "react";
import { RefreshCw, Database } from "lucide-react";

export default function SeedDataButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSeedData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/seed-data", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "שגיאה ביצירת נתונים");
      }

      const result = await response.json();

      alert(
        `נתונים לדוגמה נוצרו בהצלחה! 🎉\n\n` +
          `תבניות שלבים: ${result.data?.stageTemplates || 0}\n` +
          `קטגוריות: ${result.data?.categories || 0}\n` +
          `עמילויות: ${result.data?.customsCompanies || 0}\n` +
          `ספקים: ${result.data?.suppliers || 0}\n` +
          `הזמנות: ${result.data?.orders || 0}`
      );

      // רענון הדף
      window.location.reload();
    } catch (error) {
      console.error("Seed error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "שגיאה לא ידועה";
      alert("שגיאה ביצירת נתונים: " + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-1">
            נתונים לדוגמה
          </h3>
          <p className="text-sm text-yellow-700">
            יצירת ספקים, הזמנות וקטגוריות לדוגמה למערכת
          </p>
        </div>
        <button
          onClick={handleSeedData}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>יוצר נתונים...</span>
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              <span>הוסף נתונים לדוגמה</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
