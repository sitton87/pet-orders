"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Calendar, ChevronLeft, ChevronRight, X, Filter } from "lucide-react";
import {
  CalendarOrder,
  DayGroupedTasks,
  GroupedStageData,
  generateGroupedCalendarDays,
  getDayIntensity,
  groupPaymentsByType,
  getStageConfigs,
  PAYMENT_COLORS,
} from "./utils";

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<CalendarOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<DayGroupedTasks | null>(null);
  const [stageFilters, setStageFilters] = useState<Record<string, boolean>>({});
  const [stageConfigs, setStageConfigs] = useState<any[]>([]);
  const [calendarDays, setCalendarDays] = useState<DayGroupedTasks[]>([]);

  // Authentication check
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  // 🆕 1. תיקון - טעינה ראשונית עם החודש הנוכחי
  useEffect(() => {
    const initializeCalendar = async () => {
      await fetchOrders();
      // הקלנדר יתעדכן אוטומטית ב-useEffect האחר כשorders יטענו
    };

    initializeCalendar();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/calendar/orders");
      if (response.ok) {
        const data = await response.json();
        console.log("📅 CALENDAR DEBUG - Orders received:", data);
        setOrders(data);

        // טען קונפיגורציית שלבים דינמית
        const configs = await getStageConfigs();
        setStageConfigs(configs);

        // Initialize stage filters - all stages enabled by default
        const allStages = data.flatMap((order: CalendarOrder) => order.stages);
        const uniqueStages = Array.from(
          new Set(allStages.map((stage: any) => stage.name))
        ) as string[];
        const initialFilters: Record<string, boolean> = {};
        uniqueStages.forEach((stageName: string) => {
          initialFilters[stageName] = true;
        });
        setStageFilters(initialFilters);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  // עדכון נתוני הלוח שנה
  useEffect(() => {
    const updateCalendar = async () => {
      if (orders.length > 0) {
        const days = await generateGroupedCalendarDays(
          selectedYear,
          selectedMonth,
          orders,
          stageFilters
        );
        setCalendarDays(days);
      }
    };
    updateCalendar();
  }, [selectedYear, selectedMonth, orders, stageFilters]);

  // האזנה לעדכונים משלבים
  useEffect(() => {
    const handleStageUpdate = async () => {
      console.log("🔄 Stages updated - refreshing calendar");
      const configs = await getStageConfigs(true); // רענון מאולץ
      setStageConfigs(configs);
      fetchOrders(); // רענון הזמנות
    };

    window.addEventListener("stagesUpdated", handleStageUpdate);
    return () => window.removeEventListener("stagesUpdated", handleStageUpdate);
  }, []);

  // Month names in Hebrew
  const monthNames = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];

  // Day names in Hebrew
  const dayNames = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

  // 🆕 5. פונקציה לחישוב סכום כספי יומי
  const calculateDailyPayments = (
    dayData: DayGroupedTasks
  ): { amount: number; currency: string } | null => {
    let totalAmount = 0;
    let currency = "USD"; // ברירת מחדל

    dayData.stageGroups.forEach((group) => {
      if (group.category === "payments") {
        group.orders.forEach((item: any) => {
          if (item.amount) {
            totalAmount += item.amount;
            // קח את המטבע מההזמנה הראשונה
            if (item.order.originalCurrency) {
              currency = item.order.originalCurrency;
            }
          }
        });
      }
    });

    return totalAmount > 0 ? { amount: totalAmount, currency } : null;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const allStageNames = Array.from(
    new Set(orders.flatMap((order) => order.stages.map((stage) => stage.name)))
  );

  return (
    <div>
      <Navbar />

      <div className="w-full px-4 py-8 mt-16">
        {/* כותרת העמוד */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">לוח שנה</h1>
            <div className="h-6 w-px bg-gray-300"></div>
            <p className="text-gray-600">מעקב שלבים לפי קטגוריות </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-8">
          {/* Sidebar - Controls and Filters */}
          <div className="col-span-1">
            {/* Month/Year Selectors */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                בחירת תאריך
              </h3>

              {/* Year Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שנה
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => 2024 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  חודש
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stage Filters */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                פילטר שלבים
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {allStageNames.sort().map((stageName) => (
                  <label key={stageName} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={stageFilters[stageName] || false}
                      onChange={(e) =>
                        setStageFilters((prev) => ({
                          ...prev,
                          [stageName]: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="mr-3 text-sm text-gray-700">
                      {stageName}
                    </span>
                  </label>
                ))}
              </div>

              {/* Select All / None buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    const newFilters: Record<string, boolean> = {};
                    allStageNames.forEach((name) => (newFilters[name] = true));
                    setStageFilters(newFilters);
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  בחר הכל
                </button>
                <button
                  onClick={() => {
                    const newFilters: Record<string, boolean> = {};
                    allStageNames.forEach((name) => (newFilters[name] = false));
                    setStageFilters(newFilters);
                  }}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  בטל הכל
                </button>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                    if (selectedMonth === 0) {
                      setSelectedMonth(11);
                      setSelectedYear(selectedYear - 1);
                    } else {
                      setSelectedMonth(selectedMonth - 1);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <h2 className="text-2xl font-bold text-gray-900">
                  {monthNames[selectedMonth]} {selectedYear}
                </h2>

                <button
                  onClick={() => {
                    if (selectedMonth === 11) {
                      setSelectedMonth(0);
                      setSelectedYear(selectedYear + 1);
                    } else {
                      setSelectedMonth(selectedMonth + 1);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-gray-700 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month start */}
                {Array.from({
                  length: new Date(selectedYear, selectedMonth, 1).getDay(),
                }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-32"></div>
                ))}

                {/* Month days */}
                {calendarDays.map((dayData, index) => {
                  const dailyPayments = calculateDailyPayments(dayData);

                  return (
                    <div
                      key={index}
                      onClick={() =>
                        dayData.totalCount > 0 ? setSelectedDay(dayData) : null
                      }
                      className={`h-32 border border-gray-200 p-2 transition-all duration-200 relative ${getDayIntensity(
                        dayData.totalCount
                      )} ${
                        dayData.totalCount > 0
                          ? "cursor-pointer hover:shadow-md"
                          : "cursor-default"
                      }`}
                    >
                      {/* 🆕 5. תצוגת תאריך עם סכום כספי */}
                      <div className="flex justify-between items-start mb-2">
                        <div
                          className={`text-sm font-medium ${
                            dayData.totalCount > 8
                              ? "text-white"
                              : "text-gray-900"
                          }`}
                        >
                          {dayData.date.getDate()}
                        </div>

                        {/* תצוגת סכום כספי */}
                        {dailyPayments && (
                          <div className="bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded font-medium">
                            {dailyPayments.amount.toLocaleString()}{" "}
                            {dailyPayments.currency}
                          </div>
                        )}
                      </div>

                      {/* תצוגה מקובצת של שלבים */}
                      <div className="space-y-1">
                        {dayData.stageGroups.slice(0, 3).map((group) => (
                          <div
                            key={group.category}
                            className="text-xs bg-white bg-opacity-90 rounded px-1 py-0.5 border"
                          >
                            <span className="font-medium">
                              {group.displayName}
                            </span>
                            <span className="ml-1">({group.count})</span>
                          </div>
                        ))}
                        {dayData.stageGroups.length > 3 && (
                          <div className="text-xs text-gray-600">
                            +{dayData.stageGroups.length - 3} עוד...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Day Details Modal */}
        {selectedDay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedDay.date.toLocaleDateString("he-IL", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6">
                {selectedDay.stageGroups.map((group) => (
                  <div
                    key={group.category}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${group.color} mr-3`}
                      >
                        {group.displayName}
                      </span>
                      <span className="text-gray-600">
                        ({group.count} הזמנות)
                      </span>
                    </div>

                    {/* פירוט תשלומים לפי סוג */}
                    {group.category === "payments" ? (
                      <div className="space-y-4">
                        {Object.entries(
                          groupPaymentsByType(group.orders as any)
                        ).map(([type, payments]) => (
                          <div key={type} className="ml-4">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border mb-3 ${
                                PAYMENT_COLORS[
                                  type as keyof typeof PAYMENT_COLORS
                                ]?.color || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {PAYMENT_COLORS[
                                type as keyof typeof PAYMENT_COLORS
                              ]?.name || type}
                              <span className="ml-2">({payments.length})</span>
                            </div>
                            <div className="space-y-2">
                              {payments.map((payment, idx) => (
                                <div
                                  key={idx}
                                  className="bg-gray-50 rounded p-3 text-sm"
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="font-medium">
                                        הזמנה #{payment.order.orderNumber}
                                      </span>
                                      <span className="text-gray-600 mr-2">
                                        - {payment.order.supplierName}
                                      </span>
                                    </div>
                                    <span className="font-bold text-green-700">
                                      {payment.amount?.toLocaleString()}{" "}
                                      {payment.order.originalCurrency || "USD"}
                                    </span>
                                  </div>
                                  <div className="text-gray-600 mt-1">
                                    שלב: {payment.stage.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* שלבים רגילים */
                      <div className="space-y-2">
                        {group.orders.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 rounded p-3 text-sm"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">
                                  הזמנה #{item.order.orderNumber}
                                </span>
                                <span className="text-gray-600 mr-2">
                                  - {item.order.supplierName}
                                </span>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  item.stage.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : item.stage.status === "in-progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : item.stage.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.stage.status === "completed" && "הושלם"}
                                {item.stage.status === "in-progress" &&
                                  "בתהליך"}
                                {item.stage.status === "pending" && "ממתין"}
                                {item.stage.status === "cancelled" && "בוטל"}
                              </span>
                            </div>
                            <div className="text-gray-600 mt-1">
                              שלב: {item.stage.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 🆕 4. מקרא דינמי מהשלבים */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            מקרא שלבים
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allStageNames.sort().map((stageName, index) => {
              const stageConfig = stageConfigs.find(
                (config) => config.name === stageName
              );
              return (
                <div key={stageName} className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded`}
                    style={{
                      backgroundColor: getStageColor(index),
                    }}
                  ></div>
                  <span className="text-sm">
                    {stageConfig?.emoji || "📋"} {stageName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// 🆕 3. פונקציה לצבעים שונים לכל שלב
function getStageColor(index: number): string {
  const colors = [
    "#fbbf24", // צהוב - הכנת הזמנה
    "#3b82f6", // כחול - שליחת הזמנה לספק
    "#10b981", // ירוק - תשלום מקדמה
    "#f97316", // כתום - ייצור
    "#8b5cf6", // סגול - המכלה
    "#06b6d4", // ציאן - שילוח
    "#22c55e", // ירוק כהה - תשלום סופי
    "#6366f1", // אינדיגו - כניסה לנמל ושחרור
  ];

  return colors[index % colors.length];
}
