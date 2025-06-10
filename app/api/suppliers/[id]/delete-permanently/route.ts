import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      return NextResponse.json({ error: "ספק לא נמצא" }, { status: 404 });
    }

    if (supplier.isActive) {
      return NextResponse.json(
        {
          error: "לא ניתן למחוק ספק פעיל. העבר לארכיון קודם.",
        },
        { status: 400 }
      );
    }

    // ספור לפני מחיקה
    const ordersCount = await prisma.order.count({
      where: { supplierId: id },
    });

    const filesCount = await prisma.supplierFile.count({
      where: { supplierId: id },
    });

    const categoriesCount = await prisma.supplierCategory.count({
      where: { supplierId: id },
    });

    // מחיקה מדורגת של כל הקשרים
    await prisma.$transaction(async (tx) => {
      // מחק קבצים
      await tx.supplierFile.deleteMany({
        where: { supplierId: id },
      });

      // מחק קשרים לקטגוריות
      await tx.supplierCategory.deleteMany({
        where: { supplierId: id },
      });

      // מחק הזמנות
      await tx.order.deleteMany({
        where: { supplierId: id },
      });

      // מחק את הספק
      await tx.supplier.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `ספק "${supplier.name}" נמחק לצמיתות בהצלחה`,
      deletedCounts: {
        orders: ordersCount,
        files: filesCount,
        categories: categoriesCount,
      },
    });
  } catch (error) {
    console.error("Error deleting supplier permanently:", error);
    return NextResponse.json({ error: "שגיאה במחיקה סופית" }, { status: 500 });
  }
}
