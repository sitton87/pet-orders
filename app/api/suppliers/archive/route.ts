import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const archivedSuppliers = await prisma.supplier.findMany({
      where: { isActive: false },
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(archivedSuppliers);
  } catch (error) {
    console.error("Error fetching archived suppliers:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת ספקים מהארכיון" },
      { status: 500 }
    );
  }
}
