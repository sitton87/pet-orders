import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stages = await prisma.orderStageTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        order: true,
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(stages);
  } catch (error) {
    console.error("Error fetching stages for dropdown:", error);
    return NextResponse.json({ error: "שגיאה בטעינת שלבים" }, { status: 500 });
  }
}
