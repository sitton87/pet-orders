import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - קבלת כל הקטגוריות
export async function GET() {
  try {
    const categories = await prisma.productCategory.findMany({
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

// POST - יצירת קטגוריה חדשה
export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "שם קטגוריה נדרש" }, { status: 400 });
    }

    // בדיקה שהקטגוריה לא קיימת כבר
    const existingCategory = await prisma.productCategory.findFirst({
      where: {
        name: name,
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
        name,
        description: description || null,
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

// PUT - עדכון קטגוריה
export async function PUT(request: NextRequest) {
  try {
    const { id, name, description } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: "מזהה וחם קטגוריה נדרשים" },
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
        name: name,
        NOT: {
          id: id,
        },
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
        name,
        description: description || null,
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

// DELETE - מחיקת קטגוריה
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "מזהה קטגוריה נדרש" }, { status: 400 });
    }

    // בדיקה שהקטגוריה קיימת
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "קטגוריה לא נמצאה" }, { status: 404 });
    }

    // בדיקה שאין ספקים שמשתמשים בקטגוריה זו
    const suppliersUsingCategory = await prisma.supplier.findMany({
      where: {
        productCategory: existingCategory.name,
      },
    });

    if (suppliersUsingCategory.length > 0) {
      return NextResponse.json(
        {
          error: `לא ניתן למחוק קטגוריה זו - ${suppliersUsingCategory.length} ספקים משתמשים בה`,
        },
        { status: 400 }
      );
    }

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
