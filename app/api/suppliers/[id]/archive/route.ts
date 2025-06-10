import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });

    if (!supplier) {
      return NextResponse.json({ error: "ספק לא נמצא" }, { status: 404 });
    }

    const archivedSupplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `ספק "${supplier.name}" הועבר לארכיון`,
      ordersCount: supplier._count.orders,
      supplier: archivedSupplier,
    });
  } catch (error) {
    console.error("Error archiving supplier:", error);
    return NextResponse.json(
      { error: "שגיאה בהעברה לארכיון" },
      { status: 500 }
    );
  }
}
