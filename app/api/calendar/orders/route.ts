import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("📅 CALENDAR API - Fetching orders with stages");

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
    return "payment";
  }
  if (lowerName.includes("ייצור") || lowerName.includes("הכנת")) {
    return "production";
  }
  if (
    lowerName.includes("שילוח") ||
    lowerName.includes("נמל") ||
    lowerName.includes("שחרור")
  ) {
    return "shipping";
  }
  if (lowerName.includes("שילוח") || lowerName.includes("כניסה לנמל")) {
    return "delivery";
  }

  return "approval"; // default
}

// Helper function to determine status from dates
function getStatusFromDates(
  startDate: Date | null,
  endDate: Date | null
): string {
  const now = new Date();

  if (!startDate) return "pending";
  if (endDate && endDate < now) return "completed";
  if (startDate <= now) return "in-progress";

  return "pending";
}
