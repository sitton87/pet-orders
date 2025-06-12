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
      header: 1, // קבל מערך של מערכים
      defval: null,
    });

    console.log(`Processing ${jsonData.length} rows for ${type}`);

    let added = 0;
    let updated = 0;
    let skipped = 0;

    console.log("Raw Excel data:", jsonData);

    // מערך הכותרות (שורה ראשונה)
    const headers = jsonData[0] as string[];
    console.log("Headers:", headers);

    // הנתונים (משורה 4 ואילך - דילוג על 3 שורות הראשונות)
    const dataRows = jsonData.slice(3); // משורה 4
    console.log("Data rows:", dataRows);

    if (type === "suppliers") {
      for (const [index, rawRow] of dataRows.entries()) {
        try {
          const rowArray = rawRow as any[];

          // המר מערך לאובייקט עם הכותרות
          const row: Record<string, any> = {};
          headers.forEach((header, i) => {
            if (header) {
              row[header] = rowArray[i];
            }
          });

          console.log(`Processing row ${index + 1}:`, row);

          // דילוג על שורת הדוגמה
          if (row["שם הספק"] && row["שם הספק"].toString().includes("דוגמה")) {
            console.log(`Skipped row ${index + 1}: Contains example`);
            skipped++;
            continue;
          }

          // בדיקה מפורטת של שדות חובה
          console.log("Checking required fields:");
          console.log("- שם הספק:", row["שם הספק"]);
          console.log("- מדינה:", row["מדינה"]);
          console.log("- עיר:", row["עיר"]);
          console.log("- אימייל:", row["אימייל"]);

          // וידוא שיש שדות חובה בסיסיים
          if (!row["שם הספק"] || !row["מדינה"]) {
            console.log(`Skipped row ${index + 1}: Missing required fields`);
            skipped++;
            continue;
          }

          // המרת תאריכים
          const parseDate = (dateStr: any) => {
            if (!dateStr) return null;
            try {
              if (typeof dateStr === "number") {
                const excelEpoch = new Date(1900, 0, 1);
                const excelDate = new Date(
                  excelEpoch.getTime() + (dateStr - 2) * 24 * 60 * 60 * 1000
                );
                return excelDate.toISOString().split("T")[0];
              }
              return new Date(dateStr).toISOString().split("T")[0];
            } catch {
              return null;
            }
          };

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
            shippingTimeWeeks: parseInt(row["זמן משלוח (שבועות)"]) || 1,
            currency: row["מטבע"] || "USD",
            hasAdvancePayment:
              row["יש מקדמה"] === "כן" ||
              row["יש מקדמה"] === "TRUE" ||
              row["יש מקדמה"] === true,
            advancePercentage: parseInt(row["אחוז מקדמה"]) || null,
            paymentTerms: row["תנאי תשלום"] || null,
            importLicense: row["רישיון ייבוא"] || null,
            licenseExpiry: parseDate(row["תוקף רישיון"]),
            feedLicense: row["רישיון מספוא"] || null,
            feedLicenseExpiry: parseDate(row["תוקף מספוא"]),
            bankName: row["בנק"] || null,
            beneficiary: row["מוטב"] || null,
            iban: row["IBAN"] || null,
            bic: row["BIC"] || null,
            connection: row["קישור/חיבור"] || null,
          };

          console.log("Supplier data to save:", supplierData);

          // בדיקה אם הספק כבר קיים
          const existingSupplier = await prisma.supplier.findFirst({
            where: {
              name: supplierData.name,
              country: supplierData.country,
            },
          });

          if (existingSupplier) {
            console.log(`Updating existing supplier: ${supplierData.name}`);
            await prisma.supplier.update({
              where: { id: existingSupplier.id },
              data: supplierData,
            });
            updated++;
          } else {
            console.log(`Creating new supplier: ${supplierData.name}`);
            await prisma.supplier.create({
              data: supplierData,
            });
            added++;
          }
        } catch (error) {
          console.error(`Error processing supplier row ${index + 1}:`, error);
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
