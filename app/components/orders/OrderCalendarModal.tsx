"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface OrderPhase {
  id: string;
  phaseName: string;
  startDate: string;
  endDate: string;
  status: string;
  category: string;
}

interface OrderCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
}

export default function OrderCalendarModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
}: OrderCalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [orderPhases, setOrderPhases] = useState<OrderPhase[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // טען שלבי ההזמנה
  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderPhases();
    }
  }, [isOpen, orderId]);

  const loadOrderPhases = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/calendar/orders?orderId=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderPhases(data.phases || []);
      }
    } catch (error) {
      console.error("Error loading order phases:", error);
    } finally {
      setLoading(false);
    }
  };

  // צבעים לפי קטגוריה
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "כספים":
        return "bg-green-200 text-green-800";
      case "ייצור":
        return "bg-orange-200 text-orange-800";
      case "שילוח":
        return "bg-blue-200 text-blue-800";
      case "נמל":
        return "bg-blue-300 text-blue-900";
      default:
        return "bg-purple-200 text-purple-800";
    }
  };

  // קבל שלבים פעילים ביום ספציפי
  const getPhasesForDay = (date: Date) => {
    return orderPhases.filter((phase) => {
      const phaseStart = new Date(phase.startDate);
      const phaseEnd = new Date(phase.endDate);
      const dayStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const dayEnd = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59
      );

      return phaseStart <= dayEnd && phaseEnd >= dayStart;
    });
  };

  // יצירת ימי החודש
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  const calendarDays = generateCalendarDays();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* כותרת */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                לוח זמנים - {orderNumber}
              </h2>
              <p className="text-sm text-gray-600">תצוגת שלבי ההזמנה</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* תוכן */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="mr-3 text-gray-600">טוען שלבים...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ניווט חודש */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <h3 className="text-lg font-semibold text-gray-900">
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </h3>

                <button
                  onClick={() => navigateMonth("next")}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>

              {/* לוח השנה */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* ימי השבוע */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                  {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((day, index) => (
                    <div
                      key={index}
                      className="p-3 text-center text-sm font-medium text-gray-700"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* ימי החודש */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => {
                    const dayPhases = getPhasesForDay(day);
                    const isInCurrentMonth = isCurrentMonth(day);
                    const isTodayDate = isToday(day);

                    return (
                      <div
                        key={index}
                        className={`min-h-[100px] p-2 border-b border-r border-gray-100 ${
                          !isInCurrentMonth ? "bg-gray-50" : "bg-white"
                        } ${isTodayDate ? "bg-blue-50" : ""}`}
                      >
                        <div
                          className={`text-sm font-medium mb-1 ${
                            !isInCurrentMonth
                              ? "text-gray-400"
                              : isTodayDate
                              ? "text-blue-600"
                              : "text-gray-900"
                          }`}
                        >
                          {day.getDate()}
                        </div>

                        {/* שלבים של היום */}
                        <div className="space-y-1">
                          {dayPhases.slice(0, 3).map((phase, phaseIndex) => (
                            <div
                              key={phaseIndex}
                              className={`text-xs px-2 py-1 rounded text-center ${getCategoryColor(
                                phase.category
                              )}`}
                              title={`${phase.phaseName} (${phase.status})`}
                            >
                              {phase.phaseName}
                            </div>
                          ))}
                          {dayPhases.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayPhases.length - 3} עוד
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* מקרא */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  מקרא:
                </h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-200 rounded"></div>
                    <span className="text-sm text-gray-600">כספים</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-orange-200 rounded"></div>
                    <span className="text-sm text-gray-600">ייצור</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-200 rounded"></div>
                    <span className="text-sm text-gray-600">שילוח</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-300 rounded"></div>
                    <span className="text-sm text-gray-600">נמל</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-purple-200 rounded"></div>
                    <span className="text-sm text-gray-600">אחרים</span>
                  </div>
                </div>
              </div>

              {/* רשימת שלבים */}
              {orderPhases.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    כל השלבים ({orderPhases.length}):
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {orderPhases.map((phase, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              getCategoryColor(phase.category)
                                .replace("bg-", "bg-")
                                .split(" ")[0]
                            }`}
                          ></div>
                          <span className="font-medium text-gray-900">
                            {phase.phaseName}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded ${getCategoryColor(
                              phase.category
                            )}`}
                          >
                            {phase.category}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(phase.startDate).toLocaleDateString(
                            "he-IL"
                          )}{" "}
                          -{" "}
                          {new Date(phase.endDate).toLocaleDateString("he-IL")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {orderPhases.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">אין שלבים מוגדרים להזמנה זו</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* כפתורי פעולה */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}
