import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json();
    const { id } = await params; // 🔧 await the params Promise

    if (!status) {
      return NextResponse.json({ error: "סטטוס נדרש" }, { status: 400 });
    }

    // בדיקה שההזמנה קיימת
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
    }

    // עדכון הסטטוס
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    console.log(`Order ${id} status updated to: ${status}`);

    return NextResponse.json({
      message: "סטטוס עודכן בהצלחה",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "שגיאה בעדכון סטטוס ההזמנה" },
      { status: 500 }
    );
  }
}
