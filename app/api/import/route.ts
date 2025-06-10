import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
    }

    if (!type || !["suppliers", "orders", "categories"].includes(type)) {
      return NextResponse.json({ error: "סוג ייבוא לא תקין" }, { status: 400 });
    }

    // קריאת הקובץ
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      range: 3, // מתחיל משורה 4 (אחרי 3 שורות המידע)
      defval: null,
    });

    console.log(`Processing ${jsonData.length} rows for ${type}`);

    let added = 0;
    let updated = 0;
    let skipped = 0;

    if (type === "suppliers") {
      for (const row of jsonData as any[]) {
        try {
          // דילוג על שורת הדוגמה
          if (row["שם הספק"] && row["שם הספק"].toString().includes("דוגמה")) {
            skipped++;
            continue;
          }

          // וידוא שיש שם וארץ (שדות חובה)
          if (!row["שם הספק"] || !row["מדינה"]) {
            skipped++;
            continue;
          }

          const supplierData = {
            name: row["שם הספק"],
            country: row["מדינה"],
            city: row["עיר"] || "",
            address: row["כתובת"] || null,
            phone: row["טלפון"] || null,
            email: row["אימייל"] || "",
            contactPerson: row["איש קשר"] || null,
            contactPhone: row["טלפון איש קשר"] || null,
            contactPosition: row["תפקיד איש קשר"] || null,
            productionTimeWeeks: parseInt(row["זמן ייצור (שבועות)"]) || 1,
            shippingTimeWeeks: parseInt(row["זמן שילוח (שבועות)"]) || 1,
            hasAdvancePayment:
              row["תשלום מקדמה"] === "כן" || row["תשלום מקדמה"] === "TRUE",
            advancePercentage: parseInt(row["אחוז מקדמה"]) || 0,
            currency: row["מטבע"] || "USD",
          };

          // בדיקה אם הספק כבר קיים (לפי שם ומדינה)
          const existingSupplier = await prisma.supplier.findFirst({
            where: {
              name: supplierData.name,
              country: supplierData.country,
            },
          });

          if (existingSupplier) {
            // עדכון ספק קיים
            await prisma.supplier.update({
              where: { id: existingSupplier.id },
              data: supplierData,
            });
            updated++;
          } else {
            // יצירת ספק חדש
            await prisma.supplier.create({
              data: supplierData,
            });
            added++;
          }
        } catch (error) {
          console.error("Error processing supplier row:", error);
          skipped++;
        }
      }
    } else if (type === "orders") {
      for (const row of jsonData as any[]) {
        try {
          // דילוג על שורת הדוגמה
          if (
            row["מספר הזמנה"] &&
            row["מספר הזמנה"].toString().includes("דוגמה")
          ) {
            skipped++;
            continue;
          }

          // וידוא שיש מספר הזמנה וספק (שדות חובה)
          if (!row["מספר הזמנה"] || !row["שם ספק"]) {
            skipped++;
            continue;
          }

          // חיפוש הספק לפי שם
          const supplier = await prisma.supplier.findFirst({
            where: {
              name: row["שם ספק"],
            },
          });

          if (!supplier) {
            console.log(`Supplier not found: ${row["שם ספק"]}`);
            skipped++;
            continue;
          }

          const orderData = {
            orderNumber: row["מספר הזמנה"],
            supplierId: supplier.id,
            supplierName: supplier.name,
            etaFinal: row["תאריך ETA"]
              ? new Date(row["תאריך ETA"])
              : new Date(),
            status: row["סטטוס"] || "PENDING",
            totalAmount: parseFloat(row["סכום כולל"]) || 0,
            advanceAmount: parseFloat(row["סכום מקדמה"]) || 0,
            finalPaymentAmount: parseFloat(row["תשלום סופי"]) || 0,
            exchangeRate: parseFloat(row["שער חליפין"]) || 1,
            containerNumber: row["מספר קונטיינר"] || null,
            notes: row["הערות"] || null,
            portReleaseCost: parseFloat(row["עלות שחרור נמל"]) || 0,
            originalCurrency: row["מטבע מקורי"] || "USD",
          };

          // בדיקה אם ההזמנה כבר קיימת (לפי מספר הזמנה)
          const existingOrder = await prisma.order.findFirst({
            where: {
              orderNumber: orderData.orderNumber,
            },
          });

          if (existingOrder) {
            // עדכון הזמנה קיימת
            await prisma.order.update({
              where: { id: existingOrder.id },
              data: orderData,
            });
            updated++;
          } else {
            // יצירת הזמנה חדשה
            await prisma.order.create({
              data: orderData,
            });
            added++;
          }
        } catch (error) {
          console.error("Error processing order row:", error);
          skipped++;
        }
      }
    } else if (type === "categories") {
      for (const row of jsonData as any[]) {
        try {
          // דילוג על שורת הדוגמה
          if (
            row["שם קטגוריה"] &&
            row["שם קטגוריה"].toString().includes("דוגמה")
          ) {
            skipped++;
            continue;
          }

          // וידוא שיש שם קטגוריה (שדה חובה)
          if (!row["שם קטגוריה"]) {
            skipped++;
            continue;
          }

          const categoryData = {
            name: row["שם קטגוריה"],
            description: row["תיאור"] || null,
          };

          // בדיקה אם הקטגוריה כבר קיימת (לפי שם)
          const existingCategory = await prisma.productCategory.findFirst({
            where: {
              name: categoryData.name,
            },
          });

          if (existingCategory) {
            // עדכון קטגוריה קיימת
            await prisma.productCategory.update({
              where: { id: existingCategory.id },
              data: categoryData,
            });
            updated++;
          } else {
            // יצירת קטגוריה חדשה
            await prisma.productCategory.create({
              data: categoryData,
            });
            added++;
          }
        } catch (error) {
          console.error("Error processing category row:", error);
          skipped++;
        }
      }
    }

    const result = {
      success: true,
      type,
      added,
      updated,
      skipped,
      total: jsonData.length,
      message: `ייבוא ${
        type === "suppliers"
          ? "ספקים"
          : type === "orders"
          ? "הזמנות"
          : "קטגוריות"
      } הושלם בהצלחה`,
    };

    console.log("Import result:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Import error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json(
      {
        error: "שגיאה בייבוא נתונים: " + errorMessage,
      },
      { status: 500 }
    );
  }
}
