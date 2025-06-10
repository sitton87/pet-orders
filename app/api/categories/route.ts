import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.productCategory.findMany({
      include: {
        _count: {
          select: {
            supplierCategories: true,
            orderCategories: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת קטגוריות" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "שם קטגוריה נדרש" }, { status: 400 });
    }

    // בדיקה שהקטגוריה לא קיימת
    const existingCategory = await prisma.productCategory.findFirst({
      where: {
        name: name.trim(),
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "קטגוריה בשם זה כבר קיימת" },
        { status: 400 }
      );
    }

    const newCategory = await prisma.productCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת קטגוריה" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, description } = await request.json();

    if (!id || !name || !name.trim()) {
      return NextResponse.json(
        { error: "מזהה וקטגוריה נדרשים" },
        { status: 400 }
      );
    }

    // בדיקה שהקטגוריה קיימת
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "קטגוריה לא נמצאה" }, { status: 404 });
    }

    // בדיקה שאין קטגוריה אחרת עם אותו שם
    const duplicateCategory = await prisma.productCategory.findFirst({
      where: {
        name: name.trim(),
        NOT: { id },
      },
    });

    if (duplicateCategory) {
      return NextResponse.json(
        { error: "קטגוריה בשם זה כבר קיימת" },
        { status: 400 }
      );
    }

    const updatedCategory = await prisma.productCategory.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "שגיאה בעדכון קטגוריה" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "מזהה קטגוריה חסר" }, { status: 400 });
    }

    // בדיקה שהקטגוריה קיימת
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "קטגוריה לא נמצאה" }, { status: 404 });
    }

    // בדיקה שאין ספקים המשתמשים בקטגוריה הזו
    const suppliersUsingCategory = await prisma.supplierCategory.findMany({
      where: {
        categoryId: id,
      },
    });

    if (suppliersUsingCategory.length > 0) {
      return NextResponse.json(
        {
          error: `לא ניתן למחוק קטגוריה זו - היא בשימוש על ידי ${suppliersUsingCategory.length} ספקים`,
        },
        { status: 400 }
      );
    }

    // בדיקה שאין הזמנות המשתמשות בקטגוריה הזו
    const ordersUsingCategory = await prisma.orderCategory.findMany({
      where: {
        categoryId: id,
      },
    });

    if (ordersUsingCategory.length > 0) {
      return NextResponse.json(
        {
          error: `לא ניתן למחוק קטגוריה זו - היא בשימוש על ידי ${ordersUsingCategory.length} הזמנות`,
        },
        { status: 400 }
      );
    }

    // מחיקת הקטגוריה
    await prisma.productCategory.delete({
      where: { id },
    });

    return NextResponse.json({ message: "קטגוריה נמחקה בהצלחה" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "שגיאה במחיקת קטגוריה" },
      { status: 500 }
    );
  }
}
