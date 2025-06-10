import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type || !["suppliers", "orders", "categories"].includes(type)) {
      return NextResponse.json({ error: "סוג תבנית לא תקין" }, { status: 400 });
    }

    // יצירת Workbook חדש
    const workbook = XLSX.utils.book_new();
    let worksheet: XLSX.WorkSheet;
    let filename: string = "תבנית.xlsx"; // ברירת מחדל

    if (type === "suppliers") {
      // תבנית ספקים
      const instructions = [
        "הוראות: מלא את השורות החל מהשורה הרביעית. שדות חובה: שם הספק, מדינה. מחק את שורת הדוגמה לפני הייבוא (או השאר - המערכת תדלג עליה אוטומטית)",
      ];

      const headers = [
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
      ];

      const exampleData = [
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
      ];

      // יצירת דף עבודה
      const data = [
        instructions, // שורה 1
        headers, // שורה 2
        exampleData, // שורה 3
      ];

      worksheet = XLSX.utils.aoa_to_sheet(data);
      filename = "תבנית_ספקים.xlsx";
    } else if (type === "orders") {
      // תבנית הזמנות
      const instructions = [
        "הוראות: מלא את השורות החל מהשורה הרביעית. שדות חובה: מספר הזמנה, שם ספק. מחק את שורת הדוגמה לפני הייבוא (או השאר - המערכת תדלג עליה אוטומטית)",
      ];

      const headers = [
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
      ];

      const exampleData = [
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
      ];

      const data = [
        instructions, // שורה 1
        headers, // שורה 2
        exampleData, // שורה 3
      ];

      worksheet = XLSX.utils.aoa_to_sheet(data);
      filename = "תבנית_הזמנות.xlsx";
    } else if (type === "categories") {
      // תבנית קטגוריות
      const instructions = [
        "הוראות: מלא את השורות החל מהשורה הרביעית. שדות חובה: שם קטגוריה. מחק את שורת הדוגמה לפני הייבוא (או השאר - המערכת תדלג עליה אוטומטית)",
      ];

      const headers = ["שם קטגוריה", "תיאור"];

      const exampleData = ["דוגמה - מחק שורה זו", "צעצועים וכדורים לכלבים"];

      const data = [
        instructions, // שורה 1
        headers, // שורה 2
        exampleData, // שורה 3
      ];

      worksheet = XLSX.utils.aoa_to_sheet(data);
      filename = "תבנית_קטגוריות.xlsx";
    }

    // הוספת הדף לקובץ
    XLSX.utils.book_append_sheet(workbook, worksheet!, "תבנית");

    // המרה ל-buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // החזרת הקובץ
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("שגיאה ביצירת תבנית:", error);
    return NextResponse.json({ error: "שגיאה ביצירת תבנית" }, { status: 500 });
  }
}
