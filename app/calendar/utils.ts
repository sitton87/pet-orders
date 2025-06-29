// app/calendar/utils.ts
export interface CalendarOrder {
  id: string;
  orderNumber: string;
  supplierName: string;
  totalAmount: number;
  advanceAmount?: number;
  finalPaymentAmount?: number;
  originalCurrency?: string;
  createdAt: string;
  etaFinal: string;
  stages: CalendarStage[];
}

export interface CalendarStage {
  id: string;
  name: string;
  category: "payment" | "shipping" | "approval" | "production" | "delivery";
  status: "completed" | "in-progress" | "pending" | "cancelled";
  plannedStartDate: string;
  actualStartDate?: string;
  plannedEndDate: string;
  actualEndDate?: string;
}

export interface GroupedStageData {
  category: string;
  displayName: string;
  color: string;
  count: number;
  orders: Array<{
    order: CalendarOrder;
    stage: CalendarStage;
    amount?: number;
    paymentType?: string;
  }>;
}

export interface DayGroupedTasks {
  date: Date;
  totalCount: number;
  stageGroups: GroupedStageData[];
}

export interface DailyPayments {
  amount: number;
  currency: string;
}

// מטמון לשלבים
let stageConfigsCache: any[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 דקות

// מיפוי דינמי לשלבים מהטבלה
export async function getStageConfigs(forceRefresh = false) {
  const now = Date.now();

  if (
    !forceRefresh &&
    stageConfigsCache.length > 0 &&
    now - lastCacheUpdate < CACHE_DURATION
  ) {
    return stageConfigsCache;
  }

  try {
    const response = await fetch("/api/order-stages");
    const templates = await response.json();

    stageConfigsCache = templates
      .filter((t: any) => t.isActive)
      .map((template: any, index: number) => ({
        name: template.name,
        emoji: getEmojiForStage(template.name),
        color: getColorForStage(index), // 🆕 צבעים שונים לכל שלב
        category: categorizeStageByName(template.name),
        order: template.order,
        id: template.id,
      }));

    lastCacheUpdate = now;
    return stageConfigsCache;
  } catch (error) {
    console.error("Error loading stage configs:", error);
    return getDefaultStageConfigs();
  }
}

// 🆕 3. צבעים שונים לכל שלב
function getColorForStage(index: number): string {
  const colors = [
    "bg-yellow-100 text-yellow-800 border-yellow-300", // צהוב - הכנת הזמנה
    "bg-blue-100 text-blue-800 border-blue-300", // כחול - שליחת הזמנה לספק
    "bg-green-100 text-green-800 border-green-300", // ירוק - תשלום מקדמה
    "bg-orange-100 text-orange-800 border-orange-300", // כתום - ייצור
    "bg-purple-100 text-purple-800 border-purple-300", // סגול - המכלה
    "bg-cyan-100 text-cyan-800 border-cyan-300", // ציאן - שילוח
    "bg-emerald-100 text-emerald-800 border-emerald-300", // ירוק כהה - תשלום סופי
    "bg-indigo-100 text-indigo-800 border-indigo-300", // אינדיגו - כניסה לנמל ושחרור
  ];

  return colors[index % colors.length];
}

// מיפוי אמוגי לשלבים שלך מהטבלה
function getEmojiForStage(stageName: string): string {
  const emojiMap: Record<string, string> = {
    "הכנת הזמנה": "📝",
    "שליחת הזמנה לספק": "📧",
    "תשלום מקדמה": "💵",
    ייצור: "🏭",
    המכלה: "📦",
    שילוח: "🚢",
    "תשלום סופי": "💳",
    "כניסה לנמל ושחרור": "⚓",
  };

  return emojiMap[stageName] || "📋";
}

// קטגוריזציה לפי שם השלב
function categorizeStageByName(stageName: string): string {
  const lowerName = stageName.toLowerCase();

  if (lowerName.includes("תשלום")) return "payments";
  if (lowerName.includes("ייצור")) return "production";
  if (lowerName.includes("שילוח") || lowerName.includes("המכלה"))
    return "shipping";
  if (lowerName.includes("נמל")) return "customs";
  if (lowerName.includes("הכנת") || lowerName.includes("שליחת"))
    return "preparation";

  return "other";
}

// צבעים לפי קטגוריה (fallback)
function getColorForCategory(category: string): string {
  const colorMap: Record<string, string> = {
    preparation: "bg-purple-100 text-purple-800 border-purple-300",
    payments: "bg-green-100 text-green-800 border-green-300",
    production: "bg-orange-100 text-orange-800 border-orange-300",
    shipping: "bg-blue-100 text-blue-800 border-blue-300",
    customs: "bg-indigo-100 text-indigo-800 border-indigo-300",
    other: "bg-gray-100 text-gray-800 border-gray-300",
  };

  return colorMap[category] || "bg-gray-100 text-gray-800 border-gray-300";
}

// שמות תצוגה לקטגוריות
function getCategoryDisplayName(category: string): string {
  const displayMap: Record<string, string> = {
    preparation: "📋 הכנה",
    payments: "💰 תשלומים",
    production: "🏭 ייצור",
    shipping: "🚢 שילוח",
    customs: "⚓ נמל ומכס",
    other: "📋 אחר",
  };

  return displayMap[category] || category;
}

// פונקציה fallback אם יש בעיה בטעינה
function getDefaultStageConfigs() {
  return [
    {
      name: "הכנת הזמנה",
      emoji: "📝",
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      category: "preparation",
    },
    {
      name: "שליחת הזמנה לספק",
      emoji: "📧",
      color: "bg-blue-100 text-blue-800 border-blue-300",
      category: "preparation",
    },
    {
      name: "תשלום מקדמה",
      emoji: "💵",
      color: "bg-green-100 text-green-800 border-green-300",
      category: "payments",
    },
    {
      name: "ייצור",
      emoji: "🏭",
      color: "bg-orange-100 text-orange-800 border-orange-300",
      category: "production",
    },
    {
      name: "המכלה",
      emoji: "📦",
      color: "bg-purple-100 text-purple-800 border-purple-300",
      category: "shipping",
    },
    {
      name: "שילוח",
      emoji: "🚢",
      color: "bg-cyan-100 text-cyan-800 border-cyan-300",
      category: "shipping",
    },
    {
      name: "תשלום סופי",
      emoji: "💳",
      color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      category: "payments",
    },
    {
      name: "כניסה לנמל ושחרור",
      emoji: "⚓",
      color: "bg-indigo-100 text-indigo-800 border-indigo-300",
      category: "customs",
    },
  ];
}

// האזנה לעדכונים מדף ניהול השלבים
if (typeof window !== "undefined") {
  window.addEventListener("stagesUpdated", () => {
    getStageConfigs(true); // רענון מאולץ
  });
}

// מיפוי צבעים לסוגי תשלום (לפירוט)
export const PAYMENT_COLORS = {
  advance: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    name: "💵 תשלום מקדמה",
  },
  final: {
    color: "bg-green-100 text-green-800 border-green-200",
    name: "💳 תשלום סופי",
  },
};

/**
 * קטגוריזציה של שלב לפי שם ותכונות - מעודכן לשלבים האמיתיים
 */
export function categorizeStage(stage: CalendarStage): string {
  return categorizeStageByName(stage.name);
}

/**
 * זיהוי סוג תשלום (מקדמה/סופי) לפירוט
 */
export function getPaymentType(stage: CalendarStage): string {
  const stageName = stage.name.toLowerCase();

  if (stageName.includes("מקדמה")) {
    return "advance";
  } else if (stageName.includes("סופי")) {
    return "final";
  }

  return "final"; // default
}

/**
 * חישוב סכום תשלום
 */
export function calculatePaymentAmount(
  order: CalendarOrder,
  stage: CalendarStage
): number {
  const paymentType = getPaymentType(stage);

  if (paymentType === "advance" && order.advanceAmount) {
    return Number(order.advanceAmount);
  } else if (paymentType === "final" && order.finalPaymentAmount) {
    return Number(order.finalPaymentAmount);
  }

  return Number(order.totalAmount || 0);
}

/**
 * 🆕 2. בדיקה אם שלב פעיל בתאריך נתון - ללא חפיפות
 */
export function isStageActiveOnDate(stage: CalendarStage, date: Date): boolean {
  const stageStart = new Date(stage.actualStartDate || stage.plannedStartDate);
  const stageEnd = new Date(stage.actualEndDate || stage.plannedEndDate);

  // 🔄 תיקון: אין חפיפות - שלב מסתיים ביום X-1, הבא מתחיל ביום X
  return date >= stageStart && date < stageEnd; // שינוי מ <= ל <
}

/**
 * 🆕 5. חישוב סכומים כספיים יומיים
 */
export function calculateDailyPayments(
  orders: CalendarOrder[],
  date: Date
): DailyPayments | null {
  let totalAmount = 0;
  let currency = "USD"; // ברירת מחדל

  orders.forEach((order) => {
    order.stages.forEach((stage) => {
      if (
        isStageActiveOnDate(stage, date) &&
        categorizeStage(stage) === "payments"
      ) {
        const amount = calculatePaymentAmount(order, stage);
        totalAmount += amount;
        currency = order.originalCurrency || "USD";
      }
    });
  });

  return totalAmount > 0 ? { amount: totalAmount, currency } : null;
}

/**
 * קיבוץ מטלות לפי יום ושלב - מעודכן עם שלבים דינמיים
 */
export async function groupTasksByDayAndStage(
  orders: CalendarOrder[],
  stageFilters: Record<string, boolean>
): Promise<DayGroupedTasks[]> {
  const groupedData: { [dateString: string]: DayGroupedTasks } = {};

  // טען קונפיגורציית שלבים
  const stageConfigs = await getStageConfigs();
  const stageConfigMap = new Map(stageConfigs.map((s) => [s.name, s]));

  orders.forEach((order) => {
    order.stages.forEach((stage) => {
      // בדוק פילטר
      if (!stageFilters[stage.name]) return;

      const stageStart = new Date(
        stage.actualStartDate || stage.plannedStartDate
      );
      const stageEnd = new Date(stage.actualEndDate || stage.plannedEndDate);

      // 🆕 2. תיקון חפיפות - עבור כל יום בטווח השלב (ללא יום הסיום)
      const currentDate = new Date(stageStart);
      while (currentDate < stageEnd) {
        // שינוי מ <= ל <
        const dateString = currentDate.toISOString().split("T")[0];

        // אתחול יום אם לא קיים
        if (!groupedData[dateString]) {
          groupedData[dateString] = {
            date: new Date(currentDate),
            totalCount: 0,
            stageGroups: [],
          };
        }

        const category = categorizeStage(stage);
        const stageConfig = stageConfigMap.get(stage.name);

        // מצא או צור קבוצת שלב
        let stageGroup = groupedData[dateString].stageGroups.find(
          (group) => group.category === category
        );

        if (!stageGroup) {
          stageGroup = {
            category,
            displayName: getCategoryDisplayName(category),
            color: stageConfig?.color || getColorForCategory(category),
            count: 0,
            orders: [],
          };
          groupedData[dateString].stageGroups.push(stageGroup);
        }

        // בדוק אם ההזמנה כבר קיימת באותו יום ושלב
        const existingOrder = stageGroup.orders.find(
          (item) => item.order.id === order.id && item.stage.id === stage.id
        );

        if (!existingOrder) {
          const orderData: any = {
            order,
            stage,
          };

          // אם זה תשלום, הוסף מידע נוסף
          if (category === "payments") {
            orderData.amount = calculatePaymentAmount(order, stage);
            orderData.paymentType = getPaymentType(stage);
          }

          stageGroup.orders.push(orderData);
          stageGroup.count = stageGroup.orders.length;
          groupedData[dateString].totalCount = groupedData[
            dateString
          ].stageGroups.reduce((sum, group) => sum + group.count, 0);
        }

        // עבור ליום הבא
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
  });

  return Object.values(groupedData).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}

/**
 * קיבוץ תשלומים לפי סוג (מקדמה/סופי) לפירוט
 */
export function groupPaymentsByType(
  paymentOrders: Array<{
    order: CalendarOrder;
    stage: CalendarStage;
    amount: number;
    paymentType: string;
  }>
) {
  const grouped: { [type: string]: typeof paymentOrders } = {};

  paymentOrders.forEach((item) => {
    if (!grouped[item.paymentType]) {
      grouped[item.paymentType] = [];
    }
    grouped[item.paymentType].push(item);
  });

  return grouped;
}

/**
 * פונקציה לחישוב עצימות צבע לפי מספר מטלות
 */
export function getDayIntensity(taskCount: number): string {
  if (taskCount === 0) return "bg-white hover:bg-gray-50";
  if (taskCount <= 2) return "bg-blue-100 hover:bg-blue-150";
  if (taskCount <= 5) return "bg-blue-200 hover:bg-blue-250";
  if (taskCount <= 8) return "bg-blue-300 hover:bg-blue-350";
  return "bg-blue-400 hover:bg-blue-450 text-white";
}

/**
 * יצירת תצוגה מקובצת לחודש - מעודכן עם שלבים דינמיים
 */
export async function generateGroupedCalendarDays(
  year: number,
  month: number,
  orders: CalendarOrder[],
  stageFilters: Record<string, boolean>
): Promise<DayGroupedTasks[]> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const allGroupedTasks = await groupTasksByDayAndStage(orders, stageFilters);

  const monthDays: DayGroupedTasks[] = [];

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const currentDate = new Date(year, month, day);
    const dateString = currentDate.toISOString().split("T")[0];

    // מצא את הנתונים לתאריך הזה
    const dayData = allGroupedTasks.find(
      (grouped) => grouped.date.toISOString().split("T")[0] === dateString
    );

    monthDays.push(
      dayData || {
        date: currentDate,
        totalCount: 0,
        stageGroups: [],
      }
    );
  }

  return monthDays;
}
