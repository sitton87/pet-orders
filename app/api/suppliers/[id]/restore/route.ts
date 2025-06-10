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
    });

    if (!supplier) {
      return NextResponse.json({ error: "ספק לא נמצא" }, { status: 404 });
    }

    if (supplier.isActive) {
      return NextResponse.json({ error: "הספק כבר פעיל" }, { status: 400 });
    }

    const restoredSupplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: true, updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `ספק "${supplier.name}" שוחזר בהצלחה מהארכיון`,
      supplier: restoredSupplier,
    });
  } catch (error) {
    console.error("Error restoring supplier:", error);
    return NextResponse.json({ error: "שגיאה בשחזור ספק" }, { status: 500 });
  }
}
