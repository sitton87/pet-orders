import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    if (!year) {
      return NextResponse.json(
        { error: "Year parameter is required" },
        { status: 400 }
      );
    }

    const yearNumber = parseInt(year);
    if (isNaN(yearNumber) || yearNumber < 2000 || yearNumber > 3000) {
      return NextResponse.json(
        { error: "Invalid year format" },
        { status: 400 }
      );
    }

    // ספירת הזמנות השנה הנוכחית
    const startOfYear = new Date(`${yearNumber}-01-01T00:00:00.000Z`);
    const startOfNextYear = new Date(`${yearNumber + 1}-01-01T00:00:00.000Z`);

    const orderCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: startOfNextYear,
        },
      },
    });

    console.log(`📊 Orders count for ${yearNumber}: ${orderCount}`);

    return NextResponse.json({
      count: orderCount,
      year: yearNumber,
      message: `Found ${orderCount} orders in ${yearNumber}`,
    });
  } catch (error) {
    console.error("Error counting orders:", error);
    return NextResponse.json(
      { error: "Failed to count orders", count: 0 },
      { status: 500 }
    );
  }
}
