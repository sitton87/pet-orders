import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - קבלת ספק ספציפי
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        supplierCategories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: "ספק לא נמצא" }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json({ error: "שגיאה בטעינת ספק" }, { status: 500 });
  }
}

// PUT - עדכון ספק
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    console.log("🔄 Updating supplier:", id);
    console.log("📋 Update data:", data);

    // וידוא שהספק קיים
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: "ספק לא נמצא" }, { status: 404 });
    }

    // המרת תאריכים מ-string ל-Date (אם הם קיימים)
    const licenseExpiry = data.licenseExpiry
      ? new Date(data.licenseExpiry)
      : null;
    const feedLicenseExpiry = data.feedLicenseExpiry
      ? new Date(data.feedLicenseExpiry)
      : null;

    // בדיקה שהתאריכים תקינים
    if (data.licenseExpiry && isNaN(licenseExpiry?.getTime() || 0)) {
      return NextResponse.json(
        { error: "תאריך פג תוקף רישיון ייבוא לא תקין" },
        { status: 400 }
      );
    }

    if (data.feedLicenseExpiry && isNaN(feedLicenseExpiry?.getTime() || 0)) {
      return NextResponse.json(
        { error: "תאריך פג תוקף רישיון מספוא לא תקין" },
        { status: 400 }
      );
    }

    console.log("📅 Processed dates:", {
      licenseExpiry: licenseExpiry?.toISOString(),
      feedLicenseExpiry: feedLicenseExpiry?.toISOString(),
    });

    // עדכון הספק
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        country: data.country,
        city: data.city,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email,
        contactPerson: data.contactPerson || null,
        contactPhone: data.contactPhone || null,
        contactPosition: data.contactPosition || null,
        productionTimeWeeks: data.productionTimeWeeks || 1,
        shippingTimeWeeks: data.shippingTimeWeeks || 1,
        hasAdvancePayment: data.hasAdvancePayment || false,
        advancePercentage: data.advancePercentage || 0,
        currency: data.currency || "USD",
        connection: data.connection || null,

        // רישיונות ותאריכי פג תוקף
        importLicense: data.importLicense || null,
        licenseExpiry: licenseExpiry,
        feedLicense: data.feedLicense || null,
        feedLicenseExpiry: feedLicenseExpiry,

        // פרטי בנק
        bankName: data.bankName || null,
        beneficiary: data.beneficiary || null,
        iban: data.iban || null,
        bic: data.bic || null,

        // שדות נוספים
        notes: data.notes || null,
        paymentTerms: data.paymentTerms || null,
        minimumOrder: data.minimumOrder || 0,
      },
    });

    console.log("✅ Supplier updated successfully");

    // עדכון קטגוריות (אם הן נשלחו)
    if (data.categoryIds && Array.isArray(data.categoryIds)) {
      console.log("🏷️ Updating categories:", data.categoryIds);

      // מחיקת קטגוריות ישנות
      await prisma.supplierCategory.deleteMany({
        where: { supplierId: id },
      });

      // הוספת קטגוריות חדשות
      if (data.categoryIds.length > 0) {
        const supplierCategories = data.categoryIds.map(
          (categoryId: string) => ({
            supplierId: id,
            categoryId: categoryId,
          })
        );

        await prisma.supplierCategory.createMany({
          data: supplierCategories,
        });
      }

      console.log("✅ Categories updated successfully");
    }

    // החזרת הספק המעודכן עם הקטגוריות
    const supplierWithCategories = await prisma.supplier.findUnique({
      where: { id },
      include: {
        supplierCategories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    console.log("🎯 Returning updated supplier with categories");
    return NextResponse.json(supplierWithCategories);
  } catch (error) {
    console.error("❌ Error updating supplier:", error);
    const errorMessage =
      error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json(
      { error: "שגיאה בעדכון ספק: " + errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - מחיקת ספק
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // בדיקה שהספק קיים
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: "ספק לא נמצא" }, { status: 404 });
    }

    // בדיקה שאין הזמנות קשורות לספק
    const relatedOrders = await prisma.order.findMany({
      where: { supplierId: id },
    });

    if (relatedOrders.length > 0) {
      return NextResponse.json(
        {
          error: "לא ניתן למחוק ספק זה - קיימות הזמנות מקושרות אליו במערכת",
        },
        { status: 400 }
      );
    }

    // מחיקת קטגוריות הספק
    await prisma.supplierCategory.deleteMany({
      where: { supplierId: id },
    });

    // מחיקת הספק
    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ message: "ספק נמחק בהצלחה" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    const errorMessage =
      error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json(
      { error: "שגיאה במחיקת ספק: " + errorMessage },
      { status: 500 }
    );
  }
}
