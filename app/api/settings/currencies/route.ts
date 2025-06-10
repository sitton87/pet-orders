import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let setting = await prisma.systemSetting.findUnique({
      where: { key: "currencies" },
    });

    // 🆕 אם אין הגדרה - צור ברירת מחדל
    if (!setting) {
      const defaultCurrencies = [
        { code: "USD", name: "דולר אמריקני", symbol: "$" },
        { code: "EUR", name: "יורו", symbol: "€" },
        { code: "ILS", name: "שקל ישראלי", symbol: "₪" },
        { code: "GBP", name: "פאונד בריטי", symbol: "£" },
        { code: "JPY", name: "ין יפני", symbol: "¥" },
        { code: "CNY", name: "יואן סיני", symbol: "¥" },
        { code: "THB", name: "באט תאילנדי", symbol: "฿" },
      ];

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

      console.log("🎉 Created default currencies in database");
    }

    const currencies = JSON.parse(setting.value);
    console.log("💰 Returning currencies:", currencies);

    return NextResponse.json({ currencies });
  } catch (error) {
    console.error("❌ Error loading currencies:", error);

    // ברירת מחדל במקרה של שגיאה
    const fallbackCurrencies = [
      { code: "USD", name: "דולר אמריקני", symbol: "$" },
      { code: "EUR", name: "יורו", symbol: "€" },
      { code: "ILS", name: "שקל ישראלי", symbol: "₪" },
    ];

    return NextResponse.json({ currencies: fallbackCurrencies });
  }
}
