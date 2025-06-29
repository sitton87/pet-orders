import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 🆕 טען שלבים מטבלת השלבים
    const stageTemplates = await prisma.orderStageTemplate.findMany({
      where: { isActive: true },
      select: {
        name: true,
        order: true,
      },
      orderBy: { order: "asc" },
    });

    const stageNames = stageTemplates.map((stage) => stage.name);
    console.log(
      `📋 Loaded ${stageNames.length} stages from templates:`,
      stageNames
    );

    // טען הגדרת order_statuses מ-systemSettings
    let orderStatusesSetting = await prisma.systemSetting.findUnique({
      where: { key: "order_statuses" },
    });

    let userAddedStatuses: string[] = [];

    if (orderStatusesSetting) {
      const allStoredStatuses = JSON.parse(
        orderStatusesSetting.value
      ) as string[];

      // 🔍 הפרד: מה שהמשתמש הוסיף VS מה שבא מטבלת השלבים
      userAddedStatuses = allStoredStatuses.filter(
        (status) => !stageNames.includes(status)
      );

      console.log(`👤 User added statuses:`, userAddedStatuses);
    }

    // 🔗 חבר שלבים + סטטוסים שהמשתמש הוסיף
    const finalStatusList = [
      ...stageNames, // שלבים מהטבלה תמיד בראש
      ...userAddedStatuses, // מה שהמשתמש הוסיף
    ];

    // 🔄 עדכן את systemSettings עם הרשימה המאוחדת
    await prisma.systemSetting.upsert({
      where: { key: "order_statuses" },
      update: {
        value: JSON.stringify(finalStatusList),
        updatedAt: new Date(),
      },
      create: {
        key: "order_statuses",
        value: JSON.stringify(finalStatusList),
        type: "json",
        category: "orders",
        description: "רשימת סטטוסי הזמנות במערכת (שלבים + מותאם אישית)",
        isEditable: true,
      },
    });

    console.log(
      `✅ Updated systemSettings with ${finalStatusList.length} total statuses`
    );
    console.log(`📊 Final list: [${finalStatusList.join(", ")}]`);

    return NextResponse.json({
      statuses: finalStatusList,
      meta: {
        stagesFromTemplate: stageNames.length,
        userAddedStatuses: userAddedStatuses.length,
        totalStatuses: finalStatusList.length,
        stageNames: stageNames,
        userStatuses: userAddedStatuses,
      },
    });
  } catch (error) {
    console.error("❌ Error syncing statuses:", error);

    // חזור לערך שנשמר ב-systemSettings
    try {
      const fallbackSetting = await prisma.systemSetting.findUnique({
        where: { key: "order_statuses" },
      });

      if (fallbackSetting) {
        const fallbackStatuses = JSON.parse(fallbackSetting.value);
        return NextResponse.json({
          statuses: fallbackStatuses,
          meta: { error: true, source: "systemSettings fallback" },
        });
      }
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError);
    }

    // במקרה חירום מוחלט
    return NextResponse.json({
      statuses: ["מבוטלת"],
      meta: { error: true, source: "emergency fallback" },
    });
  }
}

export async function PUT(request: Request) {
  try {
    const { statuses } = await request.json();

    if (!Array.isArray(statuses)) {
      return NextResponse.json(
        { error: "סטטוסים חייבים להיות מערך" },
        { status: 400 }
      );
    }

    console.log(
      `💾 Received update request with ${statuses.length} statuses:`,
      statuses
    );

    // 🆕 טען שלבים נוכחיים מטבלת השלבים
    const stageTemplates = await prisma.orderStageTemplate.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: { order: "asc" },
    });

    const stageNames = stageTemplates.map((stage) => stage.name);

    // 🔍 הפרד: שלבים (שלא יישמרו) VS סטטוסים שהמשתמש הוסיף
    const userAddedStatuses = statuses.filter(
      (status) => !stageNames.includes(status)
    );

    // 🔗 רשימה מאוחדת (שלבים תמיד בראש + מה שהמשתמש הוסיף)
    const finalStatusList = [...stageNames, ...userAddedStatuses];

    console.log(
      `👤 User wants to save these custom statuses:`,
      userAddedStatuses
    );
    console.log(
      `📋 Will merge with ${stageNames.length} stages to create final list of ${finalStatusList.length} statuses`
    );

    // 💾 שמור ב-systemSettings
    await prisma.systemSetting.upsert({
      where: { key: "order_statuses" },
      update: {
        value: JSON.stringify(finalStatusList),
        updatedAt: new Date(),
      },
      create: {
        key: "order_statuses",
        value: JSON.stringify(finalStatusList),
        type: "json",
        category: "orders",
        description: "רשימת סטטוסי הזמנות במערכת (שלבים + מותאם אישית)",
        isEditable: true,
      },
    });

    console.log("✅ SystemSettings updated successfully");

    return NextResponse.json({
      message: "סטטוסים עודכנו בהצלחה",
      finalStatusList: finalStatusList,
      breakdown: {
        stagesFromTemplate: stageNames,
        userAddedStatuses: userAddedStatuses,
        totalCount: finalStatusList.length,
      },
    });
  } catch (error) {
    console.error("❌ Error updating statuses:", error);
    return NextResponse.json(
      { error: "שגיאה בעדכון סטטוסים" },
      { status: 500 }
    );
  }
}

// 🆕 פונקציה לסנכרון ידני (אופציונלי)
export async function POST() {
  try {
    console.log(
      "🔄 Manual sync triggered - updating order_statuses from stage templates"
    );

    // טען שלבים מטבלת השלבים
    const stageTemplates = await prisma.orderStageTemplate.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: { order: "asc" },
    });

    const stageNames = stageTemplates.map((stage) => stage.name);

    // טען סטטוסים נוכחיים
    const currentSetting = await prisma.systemSetting.findUnique({
      where: { key: "order_statuses" },
    });

    let userStatuses: string[] = [];
    if (currentSetting) {
      const currentStatuses = JSON.parse(currentSetting.value) as string[];
      userStatuses = currentStatuses.filter(
        (status) => !stageNames.includes(status)
      );
    }

    // רשימה מעודכנת
    const updatedList = [...stageNames, ...userStatuses];

    // עדכן
    await prisma.systemSetting.upsert({
      where: { key: "order_statuses" },
      update: {
        value: JSON.stringify(updatedList),
        updatedAt: new Date(),
      },
      create: {
        key: "order_statuses",
        value: JSON.stringify(updatedList),
        type: "json",
        category: "orders",
        description: "רשימת סטטוסי הזמנות במערכת (שלבים + מותאם אישית)",
        isEditable: true,
      },
    });

    console.log("✅ Manual sync completed");

    return NextResponse.json({
      message: "סנכרון הושלם בהצלחה",
      synced: updatedList,
      stageCount: stageNames.length,
      userCount: userStatuses.length,
    });
  } catch (error) {
    console.error("❌ Error in manual sync:", error);
    return NextResponse.json({ error: "שגיאה בסנכרון" }, { status: 500 });
  }
}
