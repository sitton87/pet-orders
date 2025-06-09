import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import JSZip from "jszip";

export async function POST() {
  try {
    console.log("Starting backup process...");

    // שליפת כל הנתונים
    const [suppliers, orders, categories] = await Promise.all([
      prisma.supplier.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        include: {
          supplier: {
            select: {
              name: true,
              country: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      // אם יש טבלת categories
      prisma.productCategory
        ?.findMany({
          orderBy: { createdAt: "desc" },
        })
        .catch(() => []) || [],
    ]);

    console.log(
      `Backing up: ${suppliers.length} suppliers, ${orders.length} orders, ${categories.length} categories`
    );

    // יצירת קובץ Excel עם מספר גיליונות
    const workbook = XLSX.utils.book_new();

    // גיליון ספקים
    const suppliersSheet = XLSX.utils.json_to_sheet(
      suppliers.map((supplier: any) => ({
        מזהה: supplier.id,
        "שם הספק": supplier.name,
        מדינה: supplier.country,
        עיר: supplier.city,
        כתובת: supplier.address || "",
        טלפון: supplier.phone || "",
        אימייל: supplier.email,
        "איש קשר": supplier.contactPerson || "",
        "טלפון איש קשר": supplier.contactPhone || "",
        "תפקיד איש קשר": supplier.contactPosition || "",
        "זמן ייצור (שבועות)": supplier.productionTimeWeeks,
        "זמן שילוח (שבועות)": supplier.shippingTimeWeeks,
        "תשלום מקדמה": supplier.hasAdvancePayment ? "כן" : "לא",
        "אחוז מקדמה": supplier.advancePercentage || 0,
        מטבע: supplier.currency,
        "תאריך יצירה": supplier.createdAt.toISOString().split("T")[0],
        "תאריך עדכון": supplier.updatedAt.toISOString().split("T")[0],
      }))
    );
    XLSX.utils.book_append_sheet(workbook, suppliersSheet, "ספקים");

    // גיליון הזמנות
    const ordersSheet = XLSX.utils.json_to_sheet(
      orders.map((order: any) => ({
        מזהה: order.id,
        "מספר הזמנה": order.orderNumber,
        "מזהה ספק": order.supplierId,
        "שם ספק": order.supplier?.name || "",
        "תאריך ETA": order.etaFinal.toISOString().split("T")[0],
        סטטוס: order.status,
        "סכום כולל": Number(order.totalAmount),
        "סכום מקדמה": Number(order.advanceAmount),
        "תשלום סופי": Number(order.finalPaymentAmount),
        "שער חליפין": order.exchangeRate || 1,
        "מספר קונטיינר": order.containerNumber || "",
        הערות: order.notes || "",
        "עלות שחרור נמל": Number(order.portReleaseCost) || 0,
        "מטבע מקורי": order.originalCurrency,
        "תאריך יצירה": order.createdAt.toISOString().split("T")[0],
        "תאריך עדכון": order.updatedAt?.toISOString().split("T")[0] || "",
      }))
    );
    XLSX.utils.book_append_sheet(workbook, ordersSheet, "הזמנות");

    // גיליון קטגוריות (אם יש)
    if (categories.length > 0) {
      const categoriesSheet = XLSX.utils.json_to_sheet(
        categories.map((category: any) => ({
          מזהה: category.id,
          "שם קטגוריה": category.name,
          תיאור: category.description || "",
          "תאריך יצירה": category.createdAt?.toISOString().split("T")[0] || "",
          "תאריך עדכון": category.updatedAt?.toISOString().split("T")[0] || "",
        }))
      );
      XLSX.utils.book_append_sheet(workbook, categoriesSheet, "קטגוריות");
    }

    // יצירת קובץ Excel
    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    // יצירת קובץ ZIP עם הגיבוי
    const zip = new JSZip();

    // הוספת קובץ ה-Excel
    const timestamp = new Date().toISOString().split("T")[0];
    zip.file(`R4PET_backup_${timestamp}.xlsx`, excelBuffer);

    // הוספת קובץ JSON עם מטאדטה
    const metadata = {
      backupDate: new Date().toISOString(),
      version: "1.0",
      counts: {
        suppliers: suppliers.length,
        orders: orders.length,
        categories: categories.length,
      },
      description: "גיבוי מלא של מערכת R4PET",
    };
    zip.file("metadata.json", JSON.stringify(metadata, null, 2));

    // יצירת קובץ הגיבוי
    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    console.log("Backup created successfully");

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="R4PET_backup_${timestamp}.zip"`,
      },
    });
  } catch (error) {
    console.error("Backup error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json(
      {
        error: "שגיאה ביצירת גיבוי: " + errorMessage,
      },
      { status: 500 }
    );
  }
}
