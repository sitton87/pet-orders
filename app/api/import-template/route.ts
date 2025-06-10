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

        // שורה 2: סוג הנתונים
        [
          "טקסט חופשי",
          "טקסט חופשי",
          "טקסט חופשי",
          "טקסט חופשי",
          "טלפון",
          "אימייל",
          "טקסט חופשי",
          "טלפון",
          "טקסט חופשי",
          "מספר",
          "מספר",
          "כן/לא",
          "מספר",
          "USD/EUR/GBP/CNY/ILS",
        ],

        // שורה 3: חובה/אופציונלי
        [
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
        ],

        // שורה 4: כותרות עמודות (שוב)
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

        // שורה 5: דוגמה
        [
          "ספק לדוגמה",
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
      const dateStamp = new Date().toISOString().split("T")[0];
      filename = `suppliers_template_${dateStamp}.xlsx`;
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

        // שורה 2: סוג הנתונים
        [
          "טקסט חופשי",
          "טקסט חופשי",
          "תאריך (dd/mm/yyyy)",
          "טקסט חופשי",
          "מספר",
          "מספר",
          "מספר",
          "מספר",
          "טקסט חופשי",
          "טקסט חופשי",
          "מספר",
          "USD/EUR/GBP/CNY/ILS",
        ],

        // שורה 3: חובה/אופציונלי
        [
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
        ],

        // שורה 4: דוגמה
        [
          "ORD-2025-001",
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
      const dateStamp = new Date().toISOString().split("T")[0];
      filename = `orders_template_${dateStamp}.xlsx`;
    } else if (type === "categories") {
      const data = [
        // שורה 1: כותרות עמודות
        ["שם קטגוריה", "תיאור"],

        // שורה 2: סוג הנתונים
        ["טקסט חופשי", "טקסט חופשי"],

        // שורה 3: חובה/אופציונלי
        ["חובה", "אופציונלי"],

        // שורה 4: כותרות עמודות (שוב)
        ["שם קטגוריה", "תיאור"],

        // שורה 5: דוגמה
        ["צעצועים לכלבים", "צעצועים וכדורים לכלבים"],
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
