import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        supplier: {
          select: {
            name: true,
            currency: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // המרת נתונים לפורמט הנכון
    const formattedOrders = orders.map((order: any) => ({
      ...order,
      supplierName: order.supplier?.name || "",
      originalCurrency: order.supplier?.currency || "USD",
      etaFinal: order.etaFinal.toISOString().split("T")[0],
      createdAt: order.createdAt.toISOString().split("T")[0],
      totalAmount: order.totalAmount ? Number(order.totalAmount) : 0,
      advanceAmount: order.advanceAmount ? Number(order.advanceAmount) : 0,
      finalPaymentAmount: order.finalPaymentAmount
        ? Number(order.finalPaymentAmount)
        : 0,
      exchangeRate: order.exchangeRate ? Number(order.exchangeRate) : 1,
      portReleaseCost: order.portReleaseCost
        ? Number(order.portReleaseCost)
        : 0,
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    const errorMessage =
      error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json(
      { error: "שגיאה בטעינת הזמנות: " + errorMessage },
      { status: 500 }
    );
  }
}

// 🆕 פונקציה ליצירת שלבים אוטומטית
async function createOrderPhases(order: any) {
  try {
    const templates = await prisma.orderStageTemplate.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    const etaDate = new Date(order.etaFinal); // תאריך הגעה רצוי

    // חישוב משך כולל של כל השלבים
    let totalDurationDays = 0;
    const processedTemplates = [];

    for (const template of templates) {
      // בדיקת תנאים
      if (template.isConditional) {
        if (
          template.condition === "hasAdvancePayment" &&
          !order.supplier.hasAdvancePayment
        ) {
          continue;
        }
      }

      // חישוב משך השלב
      let durationDays = template.durationDays;

      if (template.isDynamic && template.calculationMethod) {
        if (template.calculationMethod === "productionTimeWeeks * 7") {
          durationDays = (order.supplier.productionTimeWeeks || 4) * 7;
        } else if (template.calculationMethod === "shippingTimeWeeks * 7") {
          durationDays = (order.supplier.shippingTimeWeeks || 2) * 7;
        }
      }

      processedTemplates.push({ ...template, durationDays });
      totalDurationDays += durationDays;
    }

    // תאריך התחלה = ETA פחות כל המשך
    let currentDate = new Date(etaDate);
    currentDate.setDate(currentDate.getDate() - totalDurationDays);

    // יצירת השלבים
    for (const template of processedTemplates) {
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + template.durationDays);

      await prisma.orderPhase.create({
        data: {
          orderId: order.id,
          phaseName: template.name,
          startDate: startDate,
          endDate: endDate,
          durationDays: template.durationDays,
          phaseOrder: template.order,
          templateId: template.id,
        },
      });

      currentDate = new Date(endDate);
    }

    console.log(
      `✅ Created phases for order ${order.orderNumber} ending at ${
        etaDate.toISOString().split("T")[0]
      }`
    );
  } catch (error) {
    console.error("Error creating order phases:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("Creating order with data:", data);

    // יצירת מספר הזמנה אוטומטי אם לא סופק
    const orderNumber =
      data.orderNumber ||
      `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        etaFinal: new Date(data.etaFinal),
        status: data.status || "הוזמן מהספק",
        totalAmount: new Decimal(data.totalAmount || 0),
        advanceAmount: new Decimal(data.advanceAmount || 0),
        finalPaymentAmount: new Decimal(data.finalPaymentAmount || 0),
        exchangeRate: data.exchangeRate
          ? new Decimal(data.exchangeRate)
          : new Decimal(1),
        containerNumber: data.containerNumber || null,
        notes: data.notes || null,
        portReleaseCost: data.portReleaseCost
          ? new Decimal(data.portReleaseCost)
          : new Decimal(0),
      },
      include: {
        supplier: {
          select: {
            name: true,
            currency: true,
            productionTimeWeeks: true,
            shippingTimeWeeks: true,
            hasAdvancePayment: true,
          },
        },
      },
    });

    // 🆕 יצירת שלבים אוטומטית
    await createOrderPhases(newOrder);

    const formattedOrder = {
      ...newOrder,
      supplierName: newOrder.supplier?.name || "",
      originalCurrency: newOrder.supplier?.currency || "USD",
      etaFinal: newOrder.etaFinal.toISOString().split("T")[0],
      createdAt: newOrder.createdAt.toISOString().split("T")[0],
      totalAmount: Number(newOrder.totalAmount),
      advanceAmount: Number(newOrder.advanceAmount),
      finalPaymentAmount: Number(newOrder.finalPaymentAmount),
      exchangeRate: Number(newOrder.exchangeRate),
      portReleaseCost: Number(newOrder.portReleaseCost),
    };

    return NextResponse.json(formattedOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    const errorMessage =
      error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json(
      { error: "שגיאה ביצירת הזמנה: " + errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return NextResponse.json({ error: "מזהה הזמנה חסר" }, { status: 400 });
    }

    const data = await request.json();
    console.log("Updating order:", orderId, "with data:", data);

    // בדיקה שההזמנה קיימת
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderNumber: data.orderNumber,
        supplierId: data.supplierId,
        etaFinal: data.etaFinal ? new Date(data.etaFinal) : undefined,
        status: data.status,
        totalAmount: data.totalAmount
          ? new Decimal(data.totalAmount)
          : undefined,
        advanceAmount: data.advanceAmount
          ? new Decimal(data.advanceAmount)
          : undefined,
        finalPaymentAmount: data.finalPaymentAmount
          ? new Decimal(data.finalPaymentAmount)
          : undefined,
        exchangeRate: data.exchangeRate
          ? new Decimal(data.exchangeRate)
          : undefined,
        containerNumber: data.containerNumber,
        notes: data.notes,
        portReleaseCost: data.portReleaseCost
          ? new Decimal(data.portReleaseCost)
          : undefined,
      },
      include: {
        supplier: {
          select: {
            name: true,
            currency: true,
          },
        },
      },
    });

    const formattedOrder = {
      ...updatedOrder,
      supplierName: updatedOrder.supplier?.name || "",
      originalCurrency: updatedOrder.supplier?.currency || "USD",
      etaFinal: updatedOrder.etaFinal.toISOString().split("T")[0],
      createdAt: updatedOrder.createdAt.toISOString().split("T")[0],
      totalAmount: Number(updatedOrder.totalAmount),
      advanceAmount: Number(updatedOrder.advanceAmount),
      finalPaymentAmount: Number(updatedOrder.finalPaymentAmount),
      exchangeRate: Number(updatedOrder.exchangeRate),
      portReleaseCost: Number(updatedOrder.portReleaseCost),
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    const errorMessage =
      error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json(
      { error: "שגיאה בעדכון הזמנה: " + errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return NextResponse.json({ error: "מזהה הזמנה חסר" }, { status: 400 });
    }

    // בדיקה שההזמנה קיימת
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
    }

    // מחיקת ההזמנה
    await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ message: "הזמנה נמחקה בהצלחה" });
  } catch (error) {
    console.error("Error deleting order:", error);
    const errorMessage =
      error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json(
      { error: "שגיאה במחיקת הזמנה: " + errorMessage },
      { status: 500 }
    );
  }
}
