import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { currency } = await request.json();
    const { id } = await params; // 🔧 await the params Promise

    if (!currency) {
      return NextResponse.json({ error: "מטבע נדרש" }, { status: 400 });
    }

    // בדיקה שהספק קיים
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: "ספק לא נמצא" }, { status: 404 });
    }

    // עדכון המטבע
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        currency,
        updatedAt: new Date(),
      },
    });

    console.log(`Supplier ${id} currency updated to: ${currency}`);

    return NextResponse.json({
      message: "מטבע עודכן בהצלחה",
      supplier: updatedSupplier,
    });
  } catch (error) {
    console.error("Error updating supplier currency:", error);
    return NextResponse.json(
      { error: "שגיאה בעדכון מטבע הספק" },
      { status: 500 }
    );
  }
}
