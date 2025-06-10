import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type || !["suppliers", "orders", "categories"].includes(type)) {
      return NextResponse.json({ error: "סוג תבנית לא תקין" }, { status: 400 });
    }

    const workbook = XLSX.utils.book_new();
    let worksheet: XLSX.WorkSheet;
    let filename = "template.xlsx";

    if (type === "suppliers") {
      const data = [
        // שורה 1: כותרות עמודות
        [
          "שם הספק",
          "מדינה",
          "עיר",
          "כתובת",
          "טלפון",
          "אימייל",
          "איש קשר",
          "טלפון איש קשר",
          "תפקיד איש קשר",
          "זמן ייצור (שבועות)",
          "זמן שילוח (שבועות)",
          "תשלום מקדמה",
          "אחוז מקדמה",
          "מטבע",
        ],

        // שורה 2: הוראות ודרישות
        [
          "הוראות: מלא נתונים החל משורה 4. שדות חובה: שם הספק, מדינה. תשלום מקדמה: כן/לא",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ],

        // שורה 3: דוגמה למחיקה
        [
          "דוגמה - מחק שורה זו",
          "סין",
          "שנגחאי",
          "123 רחוב התעשייה",
          "+86-21-1234567",
          "info@supplier.com",
          "ג'ון דו",
          "+86-21-1234568",
          "מנהל מכירות",
          4,
          2,
          "כן",
          30,
          "USD",
        ],
      ];

      worksheet = XLSX.utils.aoa_to_sheet(data);
      filename = "suppliers_template.xlsx";
    } else if (type === "orders") {
      const data = [
        // שורה 1: כותרות עמודות
        [
          "מספר הזמנה",
          "שם ספק",
          "תאריך ETA",
          "סטטוס",
          "סכום כולל",
          "סכום מקדמה",
          "תשלום סופי",
          "שער חליפין",
          "מספר קונטיינר",
          "הערות",
          "עלות שחרור נמל",
          "מטבע מקורי",
        ],

        // שורה 2: הוראות ודרישות
        [
          "הוראות: מלא נתונים החל משורה 4. שדות חובה: מספר הזמנה, שם ספק. תאריך: YYYY-MM-DD",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ],

        // שורה 3: דוגמה למחיקה
        [
          "דוגמה - מחק שורה זו",
          'ספק לדוגמה בע"מ',
          "2025-03-15",
          "PENDING",
          5500,
          1650,
          3850,
          3.8,
          "CONT123456",
          "דחוף",
          500,
          "USD",
        ],
      ];

      worksheet = XLSX.utils.aoa_to_sheet(data);
      filename = "orders_template.xlsx";
    } else if (type === "categories") {
      const data = [
        // שורה 1: כותרות עמודות
        ["שם קטגוריה", "תיאור"],

        // שורה 2: הוראות ודרישות
        ["הוראות: מלא נתונים החל משורה 4. שדות חובה: שם קטגוריה", ""],

        // שורה 3: דוגמה למחיקה
        ["דוגמה - מחק שורה זו", "צעצועים וכדורים לכלבים"],
      ];

      worksheet = XLSX.utils.aoa_to_sheet(data);
      filename = "categories_template.xlsx";
    }

    XLSX.utils.book_append_sheet(workbook, worksheet!, "Sheet1");

    // שימוש ב-buffer type עם encoding מפורש
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          filename
        )}`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("שגיאה ביצירת תבנית:", error);
    return NextResponse.json({ error: "שגיאה ביצירת תבנית" }, { status: 500 });
  }
}
