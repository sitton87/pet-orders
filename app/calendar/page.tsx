"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Calendar, ChevronLeft, ChevronRight, X, Filter } from "lucide-react";

// Types ללוח שנה
interface CalendarOrder {
  id: string;
  orderNumber: string;
  supplierName: string;
  totalAmount: number;
  createdAt: string;
  etaFinal: string;
  stages: CalendarStage[];
}

interface CalendarStage {
  id: string;
  name: string;
  category: "payment" | "shipping" | "approval" | "production" | "delivery";
  status: "completed" | "in-progress" | "pending" | "cancelled";
  plannedStartDate: string;
  actualStartDate?: string;
  plannedEndDate: string;
  actualEndDate?: string;
}

interface DayTasks {
  date: Date;
  tasks: Array<{
    stage: CalendarStage;
    orderNumber: string;
    supplierName: string;
  }>;
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<CalendarOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<DayTasks | null>(null);
  const [stageFilters, setStageFilters] = useState<Record<string, boolean>>({});

  // Authentication check
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  // Fetch orders data
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/calendar/orders");
      if (response.ok) {
        const data = await response.json();
        console.log("📅 CALENDAR DEBUG - Orders received:", data);
        setOrders(data);

        // Initialize stage filters - all stages enabled by default
        const allStages = data.flatMap((order: CalendarOrder) => order.stages);
        const uniqueStages = Array.from(
          new Set(allStages.map((stage: CalendarStage) => stage.name))
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

  // Get category display name for stage
  const getStageCategory = (stage: CalendarStage): string => {
    const categoryMap: Record<string, string> = {
      payment: "כספים",
      production: "ייצור",
      shipping: "שילוח ונמל",
      delivery: "שילוח ונמל",
      approval: "אישורים ואחרים",
    };
    return categoryMap[stage.category] || "אישורים ואחרים";
  };

  // Get color for category
  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      כספים: "bg-green-500 text-white",
      ייצור: "bg-orange-500 text-white",
      "שילוח ונמל": "bg-blue-500 text-white",
      "אישורים ואחרים": "bg-purple-500 text-white",
    };
    return colorMap[category] || "bg-gray-500 text-white";
  };

  // Generate calendar days for selected month
  const generateCalendarDays = (): DayTasks[] => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const days: DayTasks[] = [];

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(selectedYear, selectedMonth, day);
      const dayTasks = getTasksForDate(currentDate);
      days.push({
        date: currentDate,
        tasks: dayTasks,
      });
    }

    return days;
  };

  // Get tasks for specific date
  const getTasksForDate = (
    date: Date
  ): Array<{
    stage: CalendarStage;
    orderNumber: string;
    supplierName: string;
  }> => {
    const tasks: Array<{
      stage: CalendarStage;
      orderNumber: string;
      supplierName: string;
    }> = [];

    orders.forEach((order) => {
      order.stages.forEach((stage) => {
        // Check if stage filter is enabled
        if (!stageFilters[stage.name]) return;

        const stageStart = new Date(
          stage.actualStartDate || stage.plannedStartDate
        );
        const stageEnd = new Date(stage.actualEndDate || stage.plannedEndDate);

        // Check if stage is active on this date
        if (date >= stageStart && date <= stageEnd) {
          tasks.push({
            stage,
            orderNumber: order.orderNumber,
            supplierName: order.supplierName,
          });
        }
      });
    });

    return tasks;
  };

  // Get intensity color for day based on task count
  const getDayIntensity = (taskCount: number): string => {
    if (taskCount === 0) return "bg-white hover:bg-gray-50";
    if (taskCount <= 2) return "bg-blue-100 hover:bg-blue-150";
    if (taskCount <= 5) return "bg-blue-200 hover:bg-blue-250";
    if (taskCount <= 8) return "bg-blue-300 hover:bg-blue-350";
    return "bg-blue-400 hover:bg-blue-450 text-white";
  };

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

  const calendarDays = generateCalendarDays();
  const allStageNames = Array.from(
    new Set(orders.flatMap((order) => order.stages.map((stage) => stage.name)))
  );

  return (
    <div>
      <Navbar />

      <div className="w-full px-4 py-8 mt-16">
        {" "}
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              לוח שנה - שלבי הזמנות
            </h1>
            <p className="text-gray-600 mt-2">תצוגת שלבים לפי תאריכים</p>
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
                  <div key={`empty-${index}`} className="h-24"></div>
                ))}

                {/* Month days */}
                {calendarDays.map((dayData, index) => (
                  <div
                    key={index}
                    onClick={() =>
                      dayData.tasks.length > 0 ? setSelectedDay(dayData) : null
                    }
                    className={`h-24 border border-gray-200 p-2 transition-all duration-200 ${getDayIntensity(
                      dayData.tasks.length
                    )} ${
                      dayData.tasks.length > 0
                        ? "cursor-pointer hover:shadow-md"
                        : "cursor-default"
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        dayData.tasks.length > 8
                          ? "text-white"
                          : "text-gray-900"
                      }`}
                    >
                      {dayData.date.getDate()}
                    </div>
                    {dayData.tasks.length > 0 && (
                      <div
                        className={`text-xs font-medium ${
                          dayData.tasks.length > 8
                            ? "text-blue-100"
                            : "text-blue-700"
                        }`}
                      >
                        {dayData.tasks.length} משימות
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Day Details Modal */}
        {selectedDay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
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

              <div className="flex-1 overflow-y-auto space-y-3">
                {selectedDay.tasks.map((task, index) => {
                  const category = getStageCategory(task.stage);
                  const colorClass = getCategoryColor(category);

                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}
                        >
                          {task.stage.name}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                          {category}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium">הזמנה:</span>
                          <span>#{task.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">ספק:</span>
                          <span>{task.supplierName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">סטטוס:</span>
                          <span
                            className={`font-medium ${
                              task.stage.status === "completed"
                                ? "text-green-600"
                                : task.stage.status === "in-progress"
                                ? "text-blue-600"
                                : task.stage.status === "pending"
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {task.stage.status === "completed" && "הושלם"}
                            {task.stage.status === "in-progress" && "בתהליך"}
                            {task.stage.status === "pending" && "ממתין"}
                            {task.stage.status === "cancelled" && "בוטל"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {/* Legend */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            מקרא צבעים
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">כספים</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm">ייצור</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">שילוח ונמל</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm">אישורים ואחרים</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
