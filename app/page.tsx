// app/page.tsx - נקי ללא debug
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // עדיין טוען

    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  // הוסף בתחילת הקומפוננט:
  if (process.env.NODE_ENV === "development") {
    return <Dashboard />; // עקיפת authentication בפיתוח
  }
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null; // ינווט לעמוד התחברות
  }

  return (
    <div>
      <Navbar />

      {/* תוכן הדף הראשי */}
      <div className="w-full px-4 py-8 mt-16">
        {" "}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ברוכים הבאים למערכת R4PET
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            מערכת ניהול הזמנות מוצרי חיות מחמד
          </p>

          {/* כרטיסי ניווט מהיר */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <div
              onClick={() => router.push("/suppliers")}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-3xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ספקים
              </h3>
              <p className="text-gray-600">ניהול פרטי ספקים ומוצרים</p>
            </div>

            <div
              onClick={() => router.push("/orders")}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-3xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                הזמנות
              </h3>
              <p className="text-gray-600">מעקב ועדכון הזמנות</p>
            </div>

            <div
              onClick={() => router.push("/calendar")}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-3xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                לוח שנה
              </h3>
              <p className="text-gray-600">תצוגת לוח שנה אינטראקטיבי</p>
            </div>

            <div
              onClick={() => router.push("/data")}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-3xl mb-4">🗄️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                נתונים
              </h3>
              <p className="text-gray-600">ניהול נתונים בסיסיים</p>
            </div>
          </div>

          {/* מידע על המשתמש */}
          <div className="mt-12 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              שלום {session.user?.name}! ברוך הבא למערכת הניהול שלנו.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
