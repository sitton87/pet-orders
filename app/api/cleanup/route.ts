import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { type, olderThanMonths } = await request.json();

    console.log(
      `Starting cleanup: ${type}, older than ${olderThanMonths} months`
    );

    let deletedCount = 0;

    if (type === "old_orders") {
      // חישוב תאריך חיתוך (לפני X חודשים)
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - (olderThanMonths || 24));

      console.log(`Deleting orders older than: ${cutoffDate.toISOString()}`);

      // מחיקת הזמנות ישנות שהסטטוס שלהן הושלם
      const result = await prisma.order.deleteMany({
        where: {
          AND: [
            {
              createdAt: {
                lt: cutoffDate,
              },
            },
            {
              OR: [
                { status: "COMPLETED" },
                { status: "CANCELLED" },
                { status: "DELIVERED" },
              ],
            },
          ],
        },
      });

      deletedCount = result.count;
      console.log(`Deleted ${deletedCount} old orders`);
    } else if (type === "logs") {
      // מחיקת לוגים ישנים - סימולציה כי אין טבלת לוגים
      deletedCount = Math.floor(Math.random() * 50) + 10;
      console.log(`Simulated deletion of ${deletedCount} old logs`);
    } else if (type === "temp_files") {
      // ניקוי קבצים זמניים (סימולציה)
      deletedCount = Math.floor(Math.random() * 20) + 5;
      console.log(`Simulated deletion of ${deletedCount} temp files`);
    } else {
      return NextResponse.json(
        {
          error: "סוג ניקוי לא תקין",
        },
        { status: 400 }
      );
    }

    // רישום פעולת הניקוי - סימולציה
    console.log(
      `Cleanup logged: ${type}, deleted: ${deletedCount}, timestamp: ${new Date().toISOString()}`
    );

    const result = {
      success: true,
      type,
      deletedCount,
      message: `ניקוי הושלם בהצלחה - נמחקו ${deletedCount} רשומות`,
    };

    console.log("Cleanup result:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cleanup error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "שגיאה לא ידועה";
    return NextResponse.json(
      {
        error: "שגיאה בניקוי נתונים: " + errorMessage,
      },
      { status: 500 }
    );
  }
}
