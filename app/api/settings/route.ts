// app/api/settings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// GET - קבלת כל ההגדרות
export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: {
        category: "asc",
      },
    });

    // המרה לפורמט נוח
    const settingsObject: any = {};
    settings.forEach((setting) => {
      if (setting.type === "json") {
        try {
          settingsObject[setting.key] = JSON.parse(setting.value);
        } catch {
          settingsObject[setting.key] = setting.value;
        }
      } else if (setting.type === "number") {
        settingsObject[setting.key] = parseFloat(setting.value);
      } else if (setting.type === "boolean") {
        settingsObject[setting.key] = setting.value === "true";
      } else {
        settingsObject[setting.key] = setting.value;
      }
    });

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "שגיאה בטעינת הגדרות" }, { status: 500 });
  }
}

// POST - עדכון הגדרות
export async function POST(request: NextRequest) {
  try {
    // TODO: בדיקת הרשאות משתמש
    const { settings } = await request.json();

    // עדכון כל הגדרה
    const updatePromises = Object.entries(settings).map(
      async ([key, value]) => {
        let stringValue: string;
        let type: string;

        if (typeof value === "object") {
          stringValue = JSON.stringify(value);
          type = "json";
        } else if (typeof value === "number") {
          stringValue = value.toString();
          type = "number";
        } else if (typeof value === "boolean") {
          stringValue = value.toString();
          type = "boolean";
        } else {
          stringValue = value as string;
          type = "text";
        }

        return prisma.systemSetting.upsert({
          where: { key },
          update: {
            value: stringValue,
            type,
            updatedBy: null, // TODO: קבל מהsession
          },
          create: {
            key,
            value: stringValue,
            type,
            category: getCategoryForKey(key),
            description: getDescriptionForKey(key),
            updatedBy: null, // TODO: קבל מהsession
          },
        });
      }
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ message: "הגדרות נשמרו בהצלחה" });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "שגיאה בשמירת הגדרות" }, { status: 500 });
  }
}

// פונקציות עזר
function getCategoryForKey(key: string): string {
  if (key.includes("currency") || key.includes("advance")) return "financial";
  if (key.includes("status")) return "orders";
  if (key.includes("time")) return "general";
  return "general";
}

function getDescriptionForKey(key: string): string {
  const descriptions: Record<string, string> = {
    order_statuses: "סטטוסי הזמנות במערכת",
    currencies: "מטבעות זמינים במערכת",
    default_currency: "מטבע ברירת מחדל",
    default_production_time: "זמן ייצור ברירת מחדל בשבועות",
    default_shipping_time: "זמן שילוח ברירת מחדל בשבועות",
    default_advance_percentage: "אחוז מקדמה ברירת מחדל",
  };
  return descriptions[key] || "";
}
