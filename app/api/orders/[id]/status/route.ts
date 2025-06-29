import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status, notes } = await request.json();
    const { id } = await params;

    if (!status) {
      return NextResponse.json({ error: "סטטוס נדרש" }, { status: 400 });
    }

    // השתמש במשתמש הקיים שלך
    const userId = "34306064-46cc-4ef7-9829-e61d88fc25f1"; // israel.siton@gmail.com

    // בדיקה שההזמנה קיימת ושמירת הסטטוס הנוכחי
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        orderNumber: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
    }

    // בדיקה אם הסטטוס באמת השתנה
    if (existingOrder.status === status) {
      return NextResponse.json({
        message: "הסטטוס כבר מעודכן",
        order: existingOrder,
      });
    }

    // עדכון בטרנזקציה עם היסטוריה
    const result = await prisma.$transaction(async (tx) => {
      // עדכון הסטטוס בהזמנה
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      // הוספת רשומה לטבלת היסטוריה
      const historyRecord = await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          oldStatus: existingOrder.status,
          newStatus: status,
          changedBy: userId,
          notes: notes || null,
        },
      });

      console.log(`✅ Order ${existingOrder.orderNumber} status updated:`);
      console.log(`   From: "${existingOrder.status}" → To: "${status}"`);
      console.log(`   Changed by: ${userId}`);
      console.log(`   📝 History recorded: ${historyRecord.id}`);

      return { updatedOrder, historyRecord };
    });

    return NextResponse.json({
      message: "סטטוס עודכן בהצלחה",
      order: result.updatedOrder,
      historyId: result.historyRecord.id,
    });
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    return NextResponse.json(
      { error: "שגיאה בעדכון סטטוס ההזמנה" },
      { status: 500 }
    );
  }
}
