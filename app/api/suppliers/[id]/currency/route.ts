import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { currency } = await request.json();

    if (!currency) {
      return NextResponse.json({ error: "מטבע נדרש" }, { status: 400 });
    }

    // בדיקה שהספק קיים
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: params.id },
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: "ספק לא נמצא" }, { status: 404 });
    }

    // עדכון המטבע
    const updatedSupplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        currency,
        updatedAt: new Date(),
      },
    });

    console.log(`Supplier ${params.id} currency updated to: ${currency}`);

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
