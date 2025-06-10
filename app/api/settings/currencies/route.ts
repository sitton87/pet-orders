import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let setting = await prisma.systemSetting.findUnique({
      where: { key: "currencies" },
    });

    // 🆕 כתיבה מחדש של המטבעות בכל מקרה (או אם אין הגדרה)
    const defaultCurrencies = [
      { code: "USD", name: "דולר אמריקני", symbol: "$" },
      { code: "EUR", name: "יורו", symbol: "€" },
      { code: "ILS", name: "שקל ישראלי", symbol: "₪" },
      { code: "GBP", name: "פאונד בריטי", symbol: "£" },
      { code: "JPY", name: "ין יפני", symbol: "¥" },
      { code: "CNY", name: "יואן סיני", symbol: "¥" },
      { code: "THB", name: "באט תאילנדי", symbol: "฿" },
      { code: "CAD", name: "דולר קנדי", symbol: "C$" },
      { code: "AUD", name: "דולר אוסטרלי", symbol: "A$" },
      { code: "CHF", name: "פרנק שוויצרי", symbol: "CHF" },
    ];

    if (!setting) {
      // יצירה חדשה
      setting = await prisma.systemSetting.create({
        data: {
          key: "currencies",
          value: JSON.stringify(defaultCurrencies),
          type: "json",
          category: "financial",
          description: "רשימת מטבעות במערכת",
          isEditable: true,
        },
      });

      console.log("Created default currencies in database");
    } else {
      // עדכון הקיים עם הרשימה החדשה
      setting = await prisma.systemSetting.update({
        where: { key: "currencies" },
        data: {
          value: JSON.stringify(defaultCurrencies),
          updatedAt: new Date(),
        },
      });

      console.log("Updated currencies list with default values");
    }

    const currencies = JSON.parse(setting.value);
    return NextResponse.json({ currencies });
  } catch (error) {
    console.error("Error loading currencies:", error);

    // ברירת מחדל רק במקרה של שגיאה חמורה
    const fallbackCurrencies = [
      { code: "USD", name: "דולר אמריקני", symbol: "$" },
      { code: "EUR", name: "יורו", symbol: "€" },
      { code: "ILS", name: "שקל ישראלי", symbol: "₪" },
      { code: "GBP", name: "פאונד בריטי", symbol: "£" },
    ];

    return NextResponse.json({ currencies: fallbackCurrencies });
  }
}
