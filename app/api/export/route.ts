import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const { type, format } = await request.json();

    let data: any[] = [];
    let filename = "";

    switch (type) {
      case "suppliers":
        data = await exportSuppliers();
        filename = `suppliers_${new Date().toISOString().split("T")[0]}`;
        break;

      case "orders":
        data = await exportOrders();
        filename = `orders_${new Date().toISOString().split("T")[0]}`;
        break;

      case "categories":
        data = await exportCategories();
        filename = `categories_${new Date().toISOString().split("T")[0]}`;
        break;

      case "all":
        const allData = await exportAllData();
        return createWorkbookResponse(
          allData,
          `full_export_${new Date().toISOString().split("T")[0]}`
        );

      default:
        return NextResponse.json(
          { error: "סוג ייצוא לא תקין" },
          { status: 400 }
        );
    }

    if (format === "csv") {
      return createCSVResponse(data, filename);
    } else {
      return createExcelResponse(data, filename);
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "שגיאה בייצוא נתונים" }, { status: 500 });
  }
}

async function exportSuppliers() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      _count: {
        select: { orders: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return suppliers.map((supplier: any) => ({
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
    "יש מקדמה": supplier.hasAdvancePayment ? "כן" : "לא",
    "אחוז מקדמה": supplier.advancePercentage || 0,
    מטבע: supplier.currency,
    "תנאי תשלום": supplier.paymentTerms || "",
    "רישיון ייבוא": supplier.importLicense || "",
    "תוקף רישיון": supplier.licenseExpiry
      ? new Date(supplier.licenseExpiry).toLocaleDateString("he-IL")
      : "",
    "רישיון מספוא": supplier.feedLicense || "",
    "תוקף מספוא": supplier.feedLicenseExpiry
      ? new Date(supplier.feedLicenseExpiry).toLocaleDateString("he-IL")
      : "",
    בנק: supplier.bankName || "",
    מוטב: supplier.beneficiary || "",
    IBAN: supplier.iban || "",
    BIC: supplier.bic || "",
    "מספר הזמנות": supplier._count?.orders || 0,
    "תאריך יצירה": new Date(supplier.createdAt).toLocaleDateString("he-IL"),
    "תאריך עדכון": new Date(supplier.updatedAt).toLocaleDateString("he-IL"),
  }));
}

async function exportOrders() {
  const orders = await prisma.order.findMany({
    include: {
      supplier: {
        select: {
          name: true,
          currency: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order: any) => ({
    "מספר הזמנה": order.orderNumber,
    ספק: order.supplier?.name || "",
    סטטוס: order.status,
    ETA: new Date(order.etaFinal).toLocaleDateString("he-IL"),
    "סכום כולל": Number(order.totalAmount),
    מקדמה: Number(order.advanceAmount),
    "תשלום סופי": Number(order.finalPaymentAmount),
    "שער חליפין": order.exchangeRate ? Number(order.exchangeRate) : 1,
    "מטבע מקורי": order.supplier?.currency || "USD",
    "מספר קונטיינר": order.containerNumber || "",
    "עלות שחרור נמל": order.portReleaseCost ? Number(order.portReleaseCost) : 0,
    הערות: order.notes || "",
    "תאריך יצירה": new Date(order.createdAt).toLocaleDateString("he-IL"),
  }));
}

async function exportCategories() {
  const categories = await prisma.productCategory.findMany({
    orderBy: { createdAt: "desc" },
  });

  // ספירת ספקים לכל קטגוריה דרך טבלת הביניים
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const supplierCount = await prisma.supplierCategory.count({
        where: { categoryId: category.id },
      });

      return {
        מזהה: category.id,
        "שם הקטגוריה": category.name,
        תיאור: category.description || "",
        "מספר ספקים": supplierCount,
        "תאריך יצירה": new Date(category.createdAt).toLocaleDateString("he-IL"),
        "תאריך עדכון": new Date(category.updatedAt).toLocaleDateString("he-IL"),
      };
    })
  );

  return categoriesWithCounts;
}

async function exportAllData() {
  const [suppliers, orders, categories] = await Promise.all([
    exportSuppliers(),
    exportOrders(),
    exportCategories(),
  ]);

  return {
    ספקים: suppliers,
    הזמנות: orders,
    קטגוריות: categories,
  };
}

function createExcelResponse(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "נתונים");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}

function createWorkbookResponse(data: any, filename: string) {
  const wb = XLSX.utils.book_new();

  Object.entries(data).forEach(([sheetName, sheetData]) => {
    const ws = XLSX.utils.json_to_sheet(sheetData as any[]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}

function createCSVResponse(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
