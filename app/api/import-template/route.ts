import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type || !["suppliers", "orders", "categories"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid template type" },
        { status: 400 }
      );
    }

    const workbook = XLSX.utils.book_new();
    let worksheet: XLSX.WorkSheet;
    let filename = "template.xlsx";

    if (type === "suppliers") {
      const data = [
        // שורה 1: כותרות עמודות - לפי סדר בכרטיס ספק
        [
          "שם הספק",
          "מדינה",
          "עיר",
          "אימייל",
          "טלפון",
          "קישור/חיבור",
          "זמן ייצור (שבועות)",
          "זמן משלוח (שבועות)",
          "מטבע",
          "יש מקדמה",
          "אחוז מקדמה",
          "איש קשר",
          "טלפון איש קשר",
          "תפקיד איש קשר",
          "כתובת",
          "תנאי תשלום",
          "רישיון ייבוא",
          "תוקף רישיון",
          "רישיון מספוא",
          "תוקף מספוא",
          "בנק",
          "מוטב",
          "IBAN",
          "BIC",
        ],

        // שורה 2: סוג הנתונים
        [
          "טקסט",
          "טקסט",
          "טקסט",
          "כתובת אימייל",
          "טלפון",
          "URL/אימייל/טקסט",
          "מספר",
          "מספר",
          "USD/EUR/GBP/CNY/ILS",
          "true/false",
          "מספר",
          "טקסט",
          "טלפון",
          "טקסט",
          "טקסט",
          "טקסט",
          "טקסט",
          "תאריך (dd/mm/yyyy)",
          "טקסט",
          "תאריך (dd/mm/yyyy)",
          "טקסט",
          "טקסט",
          "פורמט IBAN",
          "קוד BIC",
        ],

        // שורה 3: חובה/אופציונלי - מדויק לפי Schema!
        [
          "חובה",
          "חובה",
          "חובה",
          "חובה",
          "אופציונלי",
          "אופציונלי",
          "חובה",
          "חובה",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
        ],

        // שורה 4: דוגמה
        [
          "דוגמה - מחק שורה זו",
          "סין",
          "שנגחאי",
          "supplier@example.com",
          "+86-21-1234567",
          "https://example.com",
          "2",
          "3",
          "USD",
          "true",
          "30",
          "ג'ון דו",
          "+86-21-1234568",
          "מנהל מכירות",
          "123 רחוב התעשייה",
          "Net 30",
          "ABC123",
          "31/12/2025",
          "DEF456",
          "31/12/2025",
          "Bank of China",
          "Shanghai Pet Supplies Ltd",
          "CN12ABCD12345678901234",
          "ABCDCNBJ",
        ],
      ];
    } else if (type === "orders") {
      const data = [
        // שורה 1: כותרות עמודות לפי הסדר בטופס והכרטיס
        [
          "מספר הזמנה",
          "שם ספק",
          "תאריך ETA",
          "סטטוס",
          "סכום כולל",
          "מטבע מקורי",
          "מקדמה",
          "תשלום סופי",
          "שער חליפין",
          "מספר קונטיינר",
          "עלות שחרור נמל",
          "חברת עמילות",
          "עמיל מכס",
          "הערות",
        ],

        // שורה 2: סוג הנתונים
        [
          "טקסט ייחודי",
          "טקסט (שם ספק קיים)",
          "תאריך (dd/mm/yyyy)",
          "טקסט סטטוס",
          "מספר",
          "USD/EUR/GBP/CNY/ILS",
          "מספר",
          "מספר",
          "מספר עשרוני",
          "טקסט",
          "מספר (בשקלים)",
          "טקסט",
          "טקסט",
          "טקסט חופשי",
        ],

        // שורה 3: חובה/אופציונלי לפי הטופס
        [
          "חובה",
          "חובה",
          "חובה",
          "אופציונלי",
          "חובה",
          "חובה",
          "אופציונלי",
          "אופציונלי",
          "חובה",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
          "אופציונלי",
        ],

        // שורה 4: דוגמה מעודכנת
        [
          "ORD-2025-001234",
          "Shanghai Pet Supplies Ltd",
          "15/03/2025",
          "בייצור",
          "50000",
          "USD",
          "15000",
          "35000",
          "3.7",
          "MSKU1234567",
          "1500",
          "עמילות ישראל",
          "משה כהן",
          "הערות נוספות על ההזמנה",
        ],
      ];
      worksheet = XLSX.utils.aoa_to_sheet(data);
      const dateStamp = new Date().toISOString().split("T")[0];
      filename = `orders_template_${dateStamp}.xlsx`;
    } else if (type === "categories") {
      const data = [
        // שורה 1: כותרות עמודות
        ["שם קטגוריה", "תיאור", "צבע", "סדר תצוגה"],

        // שורה 2: סוג הנתונים
        ["טקסט חופשי", "טקסט חופשי", "HEX color (#000000)", "מספר"],

        // שורה 3: חובה/אופציונלי
        ["חובה", "אופציונלי", "אופציונלי", "אופציונלי"],

        // שורה 4: דוגמה
        ["דוגמה - מחק שורה זו", "צעצועים וכדורים לכלבים", "#3B82F6", "1"],
      ];

      worksheet = XLSX.utils.aoa_to_sheet(data);
      const dateStamp = new Date().toISOString().split("T")[0];
      filename = `categories_template_${dateStamp}.xlsx`;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet!, "Template");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Template creation error:", error);
    return NextResponse.json(
      { error: "Template creation failed" },
      { status: 500 }
    );
  }
}
