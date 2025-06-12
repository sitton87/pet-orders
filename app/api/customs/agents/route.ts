// app/api/customs/agents/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - קבלת כל סוכני המכס עם שם החברה
export async function GET() {
  try {
    const agents = await prisma.customsAgent.findMany({
      include: {
        customsCompany: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error fetching customs agents:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת סוכני מכס" },
      { status: 500 }
    );
  }
}

// POST - יצירת סוכן מכס חדש
export async function POST(request: NextRequest) {
  try {
    const { name, phone, position, customsCompanyId } = await request.json();

    if (!name || !customsCompanyId) {
      return NextResponse.json(
        { error: "שם הסוכן ומזהה חברת העמילות נדרשים" },
        { status: 400 }
      );
    }

    // בדיקה שחברת העמילות קיימת
    const existingCompany = await prisma.customsCompany.findUnique({
      where: { id: customsCompanyId },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: "חברת עמילות לא נמצאה" },
        { status: 404 }
      );
    }

    const newAgent = await prisma.customsAgent.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || "",
        position: position?.trim() || "",
        customsCompanyId: customsCompanyId,
      },
      include: {
        customsCompany: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error) {
    console.error("Error creating customs agent:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת סוכן מכס" },
      { status: 500 }
    );
  }
}

// DELETE - מחיקת סוכן מכס
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "מזהה סוכן נדרש" }, { status: 400 });
    }

    // בדיקה שהסוכן קיים
    const existingAgent = await prisma.customsAgent.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });

    if (!existingAgent) {
      return NextResponse.json({ error: "סוכן מכס לא נמצא" }, { status: 404 });
    }

    // בדיקה שאין הזמנות מקושרות
    if (existingAgent.orders.length > 0) {
      return NextResponse.json(
        {
          error: `לא ניתן למחוק סוכן עם ${existingAgent.orders.length} הזמנות מקושרות.`,
        },
        { status: 400 }
      );
    }

    await prisma.customsAgent.delete({
      where: { id },
    });

    return NextResponse.json({ message: "סוכן מכס נמחק בהצלחה" });
  } catch (error) {
    console.error("Error deleting customs agent:", error);
    return NextResponse.json(
      { error: "שגיאה במחיקת סוכן מכס" },
      { status: 500 }
    );
  }
}
