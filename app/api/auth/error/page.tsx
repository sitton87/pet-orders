"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Home, Mail } from "lucide-react";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case "Configuration":
        return {
          title: "שגיאה בהגדרות המערכת",
          message: "יש בעיה בהגדרות האימות. אנא פנה למנהל המערכת.",
        };
      case "AccessDenied":
        return {
          title: "גישה לא מורשית",
          message:
            "אין לך הרשאה לגשת למערכת זו. רק משתמשים מורשים יכולים להיכנס.",
        };
      case "Verification":
        return {
          title: "שגיאה באימות",
          message: "לא ניתן לאמת את הזהות שלך. נסה שוב מאוחר יותר.",
        };
      default:
        return {
          title: "שגיאה בכניסה למערכת",
          message: "אירעה שגיאה בלתי צפויה. אנא נסה שוב או פנה למנהל המערכת.",
        };
    }
  };

  const { title, message } = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* אייקון שגיאה */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-100 p-4">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
          </div>

          {/* כותרת */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>

          {/* הודעת שגיאה */}
          <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>

          {/* מידע נוסף אם זה AccessDenied */}
          {error === "AccessDenied" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">איך לקבל גישה?</p>
                  <p>
                    פנה למנהל המערכת עם כתובת המייל שלך כדי לקבל הרשאת גישה.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* כפתורי פעולה */}
          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              נסה להתחבר שוב
            </Link>

            <Link
              href="/"
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              חזור לעמוד הראשי
            </Link>
          </div>

          {/* מידע טכני (רק בפיתוח) */}
          {process.env.NODE_ENV === "development" && error && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-500">
                <strong>שגיאה טכנית:</strong> {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
