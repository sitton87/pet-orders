import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let setting = await prisma.systemSetting.findUnique({
      where: { key: "order_statuses" },
    });

    // 🆕 אם אין הגדרה - צור אותה בפעם הראשונה
    if (!setting) {
      const defaultStatuses = [
        "בתהליך הזמנה",
        "בייצור",
        "נשלח",
        "בדרך",
        "הגיע לנמל",
        "הושלם",
        "מבוטלת",
      ];

      setting = await prisma.systemSetting.create({
        data: {
          key: "order_statuses",
          value: JSON.stringify(defaultStatuses),
          type: "json",
          category: "orders",
          description: "רשימת סטטוסי הזמנות במערכת",
          isEditable: true,
        },
      });

      console.log("Created default order statuses in database");
    }

    const statuses = JSON.parse(setting.value);
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Error loading statuses:", error);

    // ברירת מחדל רק במקרה של שגיאה חמורה
    const fallbackStatuses = [
      "בתהליך הזמנה",
      "בייצור",
      "נשלח",
      "בדרך",
      "הגיע לנמל",
      "הושלם",
      "מבוטלת",
    ];

    return NextResponse.json({ statuses: fallbackStatuses });
  }
}
