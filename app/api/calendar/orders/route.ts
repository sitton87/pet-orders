import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    // אם יש orderId - החזר רק את השלבים של ההזמנה הזו
    if (orderId) {
      console.log(`📅 CALENDAR API - Fetching single order: ${orderId}`);

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          supplier: {
            select: {
              name: true,
              currency: true,
            },
          },
          phases: {
            select: {
              id: true,
              phaseName: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });

      if (!order) {
        return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
      }

      // Generate stages for single order
      let stages = [];

      if (order.phases && order.phases.length > 0) {
        // Use real phases from database
        stages = order.phases.map((phase: any) => ({
          id: phase.id,
          phaseName: phase.phaseName || "שלב לא ידוע",
          category: getCategoryFromName(phase.phaseName || ""),
          status: getStatusFromDates(phase.startDate, phase.endDate),
          startDate: phase.startDate || order.createdAt,
          endDate: phase.endDate || order.etaFinal,
        }));
      } else {
        // Generate demo stages based on order dates
        const orderDate = new Date(order.createdAt);
        const etaDate = new Date(order.etaFinal);

        stages = [
          {
            id: `${order.id}-stage-1`,
            phaseName: "הכנת הזמנה",
            category: "אישורים",
            status: "הושלם",
            startDate: orderDate.toISOString(),
            endDate: new Date(
              orderDate.getTime() + 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: `${order.id}-stage-2`,
            phaseName: "שליחת הזמנה לספק",
            category: "אישורים",
            status: "הושלם",
            startDate: new Date(
              orderDate.getTime() + 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            endDate: new Date(
              orderDate.getTime() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: `${order.id}-stage-3`,
            phaseName: "תשלום מקדמה",
            category: "כספים",
            status: "בתהליך",
            startDate: new Date(
              orderDate.getTime() + 5 * 24 * 60 * 60 * 1000
            ).toISOString(),
            endDate: new Date(
              orderDate.getTime() + 10 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: `${order.id}-stage-4`,
            phaseName: "ייצור",
            category: "ייצור",
            status: "ממתין",
            startDate: new Date(
              orderDate.getTime() + 21 * 24 * 60 * 60 * 1000
            ).toISOString(),
            endDate: new Date(
              etaDate.getTime() - 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: `${order.id}-stage-5`,
            phaseName: "שילוח",
            category: "שילוח",
            status: "ממתין",
            startDate: new Date(
              etaDate.getTime() - 21 * 24 * 60 * 60 * 1000
            ).toISOString(),
            endDate: new Date(
              etaDate.getTime() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: `${order.id}-stage-6`,
            phaseName: "תשלום סופי",
            category: "כספים",
            status: "ממתין",
            startDate: new Date(
              etaDate.getTime() - 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
            endDate: new Date(
              etaDate.getTime() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: `${order.id}-stage-7`,
            phaseName: "כניסה לנמל ושחרור",
            category: "נמל",
            status: "ממתין",
            startDate: new Date(
              etaDate.getTime() - 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            endDate: etaDate.toISOString(),
          },
        ];
      }

      console.log(
        `📅 CALENDAR API - Returning ${stages.length} phases for order ${order.orderNumber}`
      );

      return NextResponse.json({
        phases: stages,
        orderInfo: {
          id: order.id,
          orderNumber: order.orderNumber,
          supplierName: order.supplier?.name || "ספק לא ידוע",
        },
      });
    }

    // אם אין orderId - החזר את כל ההזמנות (הקוד הקיים)
    console.log("📅 CALENDAR API - Fetching all orders with stages");

    // Fetch orders with their stages
    const orders = await prisma.order.findMany({
      where: {
        status: {
          not: "בוטל", // לא מציג הזמנות מבוטלות
        },
      },
      include: {
        supplier: {
          select: {
            name: true,
            currency: true,
          },
        },
        phases: {
          select: {
            id: true,
            phaseName: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert data to calendar format
    const calendarOrders = orders.map((order: any) => {
      // Generate demo stages if no phases exist
      let stages = [];

      if (order.phases && order.phases.length > 0) {
        // Use real phases from database
        stages = order.phases.map((phase: any) => ({
          id: phase.id,
          name: phase.phaseName || "שלב לא ידוע",
          category: getCategoryFromName(phase.phaseName || ""),
          status: getStatusFromDates(phase.startDate, phase.endDate),
          plannedStartDate: phase.startDate || order.createdAt,
          actualStartDate: phase.startDate,
          plannedEndDate: phase.endDate || order.etaFinal,
          actualEndDate: phase.endDate,
        }));
      } else {
        // Generate demo stages based on order dates
        const orderDate = new Date(order.createdAt);
        const etaDate = new Date(order.etaFinal);

        stages = [
          {
            id: `${order.id}-stage-1`,
            name: "הכנת הזמנה",
            category: "approval",
            status: "completed",
            plannedStartDate: orderDate.toISOString(),
            actualStartDate: orderDate.toISOString(),
            plannedEndDate: new Date(
              orderDate.getTime() + 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            actualEndDate: new Date(
              orderDate.getTime() + 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: `${order.id}-stage-2`,
            name: "שליחת הזמנה לספק",
            category: "approval",
            status: "completed",
            plannedStartDate: new Date(
              orderDate.getTime() + 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            actualStartDate: new Date(
              orderDate.getTime() + 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            plannedEndDate: new Date(
              orderDate.getTime() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            actualEndDate: new Date(
              orderDate.getTime() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: `${order.id}-stage-3`,
            name: "תשלום מקדמה",
            category: "payment",
            status: "in-progress",
            plannedStartDate: new Date(
              orderDate.getTime() + 5 * 24 * 60 * 60 * 1000
            ).toISOString(),
            actualStartDate: new Date(
              orderDate.getTime() + 5 * 24 * 60 * 60 * 1000
            ).toISOString(),
            plannedEndDate: new Date(
              orderDate.getTime() + 10 * 24 * 60 * 60 * 1000
            ).toISOString(),
            actualEndDate: null,
          },
          {
            id: `${order.id}-stage-4`,
            name: "ייצור",
            category: "production",
            status: "pending",
            plannedStartDate: new Date(
              orderDate.getTime() + 21 * 24 * 60 * 60 * 1000
            ).toISOString(),
            actualStartDate: null,
            plannedEndDate: new Date(
              etaDate.getTime() - 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            actualEndDate: null,
          },
          {
            id: `${order.id}-stage-5`,
            name: "שילוח",
            category: "shipping",
            status: "pending",
            plannedStartDate: new Date(
              etaDate.getTime() - 21 * 24 * 60 * 60 * 1000
            ).toISOString(),
            actualStartDate: null,
            plannedEndDate: new Date(
              etaDate.getTime() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            actualEndDate: null,
          },
          {
            id: `${order.id}-stage-6`,
            name: "תשלום סופי",
            category: "payment",
            status: "pending",
            plannedStartDate: new Date(
              etaDate.getTime() - 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
            actualStartDate: null,
            plannedEndDate: new Date(
              etaDate.getTime() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            actualEndDate: null,
          },
          {
            id: `${order.id}-stage-7`,
            name: "כניסה לנמל ושחרור",
            category: "delivery",
            status: "pending",
            plannedStartDate: new Date(
              etaDate.getTime() - 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            actualStartDate: null,
            plannedEndDate: etaDate.toISOString(),
            actualEndDate: null,
          },
        ];
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        supplierName: order.supplier?.name || "ספק לא ידוע",
        totalAmount: order.totalAmount ? Number(order.totalAmount) : 0,
        createdAt: order.createdAt,
        etaFinal: order.etaFinal,
        stages: stages,
      };
    });

    console.log(`📅 CALENDAR API - Returning ${calendarOrders.length} orders`);
    if (calendarOrders.length > 0) {
      console.log(`📅 First order stages: ${calendarOrders[0].stages.length}`);
    }

    return NextResponse.json(calendarOrders);
  } catch (error) {
    console.error("❌ CALENDAR API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}

// Helper function to determine category from stage name
function getCategoryFromName(name: string): string {
  const lowerName = name.toLowerCase();

  if (
    lowerName.includes("תשלום") ||
    lowerName.includes("מקדמה") ||
    lowerName.includes("סופי")
  ) {
    return "כספים";
  }
  if (lowerName.includes("ייצור") || lowerName.includes("הכנת")) {
    return "ייצור";
  }
  if (lowerName.includes("שילוח")) {
    return "שילוח";
  }
  if (lowerName.includes("נמל") || lowerName.includes("שחרור")) {
    return "נמל";
  }

  return "אישורים"; // default
}

// Helper function to determine status from dates
function getStatusFromDates(
  startDate: Date | null,
  endDate: Date | null
): string {
  const now = new Date();

  if (!startDate) return "ממתין";
  if (endDate && endDate < now) return "הושלם";
  if (startDate <= now) return "בתהליך";

  return "ממתין";
}
