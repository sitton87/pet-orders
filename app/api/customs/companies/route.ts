// app/api/customs/companies/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - קבלת כל חברות העמילות עם הסוכנים שלהן
export async function GET() {
  try {
    const companies = await prisma.customsCompany.findMany({
      include: {
        agents: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching customs companies:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת חברות עמילות" },
      { status: 500 }
    );
  }
}

// POST - יצירת חברת עמילות חדשה
export async function POST(request: NextRequest) {
  try {
    const { name, address, phone, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "שם החברה ואימייל נדרשים" },
        { status: 400 }
      );
    }

    // בדיקה שהחברה לא קיימת כבר
    const existingCompany = await prisma.customsCompany.findFirst({
      where: {
        OR: [{ name: name }, { email: email }],
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "חברה בשם זה או אימייל זה כבר קיימת" },
        { status: 400 }
      );
    }

    const newCompany = await prisma.customsCompany.create({
      data: {
        name: name.trim(),
        address: address?.trim() || "",
        phone: phone?.trim() || "",
        email: email.trim(),
      },
      include: {
        agents: true,
      },
    });

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error("Error creating customs company:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת חברת עמילות" },
      { status: 500 }
    );
  }
}

// DELETE - מחיקת חברת עמילות
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "מזהה חברה נדרש" }, { status: 400 });
    }

    // בדיקה שהחברה קיימת
    const existingCompany = await prisma.customsCompany.findUnique({
      where: { id },
      include: {
        agents: true,
        orders: true,
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: "חברת עמילות לא נמצאה" },
        { status: 404 }
      );
    }

    // בדיקה שאין סוכנים או הזמנות מקושרות
    if (existingCompany.agents.length > 0) {
      return NextResponse.json(
        {
          error: `לא ניתן למחוק חברה עם ${existingCompany.agents.length} סוכנים. מחק את הסוכנים קודם.`,
        },
        { status: 400 }
      );
    }

    if (existingCompany.orders.length > 0) {
      return NextResponse.json(
        {
          error: `לא ניתן למחוק חברה עם ${existingCompany.orders.length} הזמנות מקושרות.`,
        },
        { status: 400 }
      );
    }

    await prisma.customsCompany.delete({
      where: { id },
    });

    return NextResponse.json({ message: "חברת עמילות נמחקה בהצלחה" });
  } catch (error) {
    console.error("Error deleting customs company:", error);
    return NextResponse.json(
      { error: "שגיאה במחיקת חברת עמילות" },
      { status: 500 }
    );
  }
}
