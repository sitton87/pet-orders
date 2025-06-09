import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log("Found suppliers:", suppliers.length);
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json({ error: "שגיאה בטעינת ספקים" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const newSupplier = await prisma.supplier.create({
      data: {
        name: data.name,
        country: data.country,
        city: data.city,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email,
        contactPerson: data.contactName || null,
        contactPhone: data.contactPhone || null,
        contactPosition: data.contactPosition || null,
        productionTimeWeeks: data.productionTimeWeeks || 1,
        shippingTimeWeeks: data.shippingTimeWeeks || 1,
        hasAdvancePayment: data.hasAdvancePayment || false,
        advancePercentage: data.advancePercentage || 0,
        currency: data.currency || "USD",
      },
    });
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json({ error: "שגיאה ביצירת ספק" }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "מזהה ספק חסר" }, { status: 400 });
    }

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
