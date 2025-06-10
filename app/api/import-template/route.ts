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
        "Instructions: Fill rows starting from row 4. Required fields: supplier name, country. Delete example row before import (or leave - system will skip automatically)",
      ];

      const headers = [
        "Supplier Name",
        "Country",
        "City",
        "Address",
        "Phone",
        "Email",
        "Contact Person",
        "Contact Phone",
        "Contact Position",
        "Production Time (weeks)",
        "Shipping Time (weeks)",
        "Advance Payment",
        "Advance Percentage",
        "Currency",
      ];

      const exampleData = [
        "EXAMPLE - DELETE THIS ROW",
        "China",
        "Shanghai",
        "123 Industry Street",
        "+86-21-1234567",
        "info@supplier.com",
        "John Doe",
        "+86-21-1234568",
        "Sales Manager",
        4,
        2,
        "Yes",
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
      filename = "suppliers_template.xlsx";
    } else if (type === "orders") {
      // תבנית הזמנות
      const instructions = [
        "Instructions: Fill rows starting from row 4. Required fields: order number, supplier name. Delete example row before import (or leave - system will skip automatically)",
      ];

      const headers = [
        "Order Number",
        "Supplier Name",
        "ETA Date",
        "Status",
        "Total Amount",
        "Advance Amount",
        "Final Payment",
        "Exchange Rate",
        "Container Number",
        "Notes",
        "Port Release Cost",
        "Original Currency",
      ];

      const exampleData = [
        "EXAMPLE - DELETE THIS ROW",
        "Example Supplier Ltd",
        "2025-03-15",
        "PENDING",
        5500,
        1650,
        3850,
        3.8,
        "CONT123456",
        "Urgent",
        500,
        "USD",
      ];

      const data = [
        instructions, // שורה 1
        headers, // שורה 2
        exampleData, // שורה 3
      ];

      worksheet = XLSX.utils.aoa_to_sheet(data);
      filename = "orders_template.xlsx";
    } else if (type === "categories") {
      // תבנית קטגוריות
      const instructions = [
        "Instructions: Fill rows starting from row 4. Required fields: category name. Delete example row before import (or leave - system will skip automatically)",
      ];

      const headers = ["Category Name", "Description"];

      const exampleData = ["EXAMPLE - DELETE THIS ROW", "Dog toys and balls"];

      const data = [
        instructions, // שורה 1
        headers, // שורה 2
        exampleData, // שורה 3
      ];

      worksheet = XLSX.utils.aoa_to_sheet(data);
      filename = "categories_template.xlsx";
    }

    // הוספת הדף לקובץ
    XLSX.utils.book_append_sheet(workbook, worksheet!, "Template");

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
