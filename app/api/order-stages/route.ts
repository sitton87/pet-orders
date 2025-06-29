import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stages = await prisma.orderStageTemplate.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json(stages);
  } catch (error) {
    console.error("Error fetching order stages:", error);
    return NextResponse.json({ error: "שגיאה בטעינת שלבים" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.id) {
      return NextResponse.json({ error: "מזהה שלב חסר" }, { status: 400 });
    }

    // 🆕 הוסף את השורות האלה:
    // שמור את השם הישן
    const oldTemplate = await prisma.orderStageTemplate.findUnique({
      where: { id: data.id },
    });

    const updatedStage = await prisma.orderStageTemplate.update({
      where: { id: data.id },
      data: {
        name: data.name,
        durationDays: data.durationDays,
        order: data.order,
        isConditional: data.isConditional,
        condition: data.condition,
        isDynamic: data.isDynamic,
        calculationMethod: data.calculationMethod,
        isActive: data.isActive,
        description: data.description,
      },
    });

    // 🆕 הוסף את השורות האלה:
    // עדכון שלבים קיימים אם השם השתנה
    if (oldTemplate && oldTemplate.name !== data.name) {
      await prisma.orderPhase.updateMany({
        where: { templateId: data.id },
        data: { phaseName: data.name },
      });

      console.log(
        `✅ Updated existing phases from "${oldTemplate.name}" to "${data.name}"`
      );
    }

    return NextResponse.json(updatedStage);
  } catch (error) {
    console.error("Error updating order stage:", error);
    return NextResponse.json({ error: "שגיאה בעדכון שלב" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // מציאת הסדר הבא
    const maxOrder = await prisma.orderStageTemplate.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = (maxOrder?.order || 0) + 1;

    const newStage = await prisma.orderStageTemplate.create({
      data: {
        name: data.name,
        durationDays: data.durationDays || 1,
        order: newOrder,
        isConditional: data.isConditional || false,
        condition: data.condition || null,
        isDynamic: data.isDynamic || false,
        calculationMethod: data.calculationMethod || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        description: data.description || null,
      },
    });

    return NextResponse.json(newStage, { status: 201 });
  } catch (error) {
    console.error("Error creating order stage:", error);
    return NextResponse.json({ error: "שגיאה ביצירת שלב" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "מזהה שלב חסר" }, { status: 400 });
    }

    // בדיקה שהשלב קיים
    const existingStage = await prisma.orderStageTemplate.findUnique({
      where: { id },
    });

    if (!existingStage) {
      return NextResponse.json({ error: "שלב לא נמצא" }, { status: 404 });
    }

    await prisma.orderStageTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ message: "שלב נמחק בהצלחה" });
  } catch (error) {
    console.error("Error deleting order stage:", error);
    return NextResponse.json({ error: "שגיאה במחיקת שלב" }, { status: 500 });
  }
}
