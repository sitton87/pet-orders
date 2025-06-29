"use client";

import { useEffect, useState } from "react";

interface Order {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  etaFinal: string;
  status: string;
  totalAmount: number;
  advanceAmount?: number;
  finalPaymentAmount?: number;
  originalCurrency: string;
  exchangeRate?: number;
  containerNumber?: string;
  customsCompany?: string;
  customsAgent?: string;
  notes?: string;
  portReleaseCost?: number;
  calculatedEta?: string;
  createdAt: string;
}

interface OrderKPIsProps {
  orders: Order[];
}

interface KPIData {
  totalActiveOrders: number;
  totalOrdersValue: number;
  // 🆕 KPI חדש
  totalOrdersEverOrdered: number;
  totalOrdersEverOrderedValue: number;
  averageOrderValue: number;
  ordersApproachingETA: number;
  overdueOrders: number;
  statusBreakdown: {
    [key: string]: number;
  };
}

export default function OrderKPIs({ orders }: OrderKPIsProps) {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalActiveOrders: 0,
    totalOrdersValue: 0,
    totalOrdersEverOrdered: 0,
    totalOrdersEverOrderedValue: 0,
    averageOrderValue: 0,
    ordersApproachingETA: 0,
    overdueOrders: 0,
    statusBreakdown: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  // חישוב KPIs מהנתונים האמיתיים
  const calculateKPIs = () => {
    // הזמנות פעילות (לא הושלמו ולא בוטלו)
    const activeOrders = orders.filter(
      (order) => order.status !== "הושלם" && order.status !== "מבוטלת"
    );

    // 🆕 הזמנות שהוזמנו אי פעם (כולל הושלמו, לא כולל מבוטלות)
    const everOrderedOrders = orders.filter(
      (order) => order.status !== "מבוטלת"
    );

    // ערך כולל של הזמנות פעילות
    const totalValue = activeOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // 🆕 ערך כולל של כל ההזמנות שהוזמנו אי פעם
    const totalEverOrderedValue = everOrderedOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // ממוצע מחיר להזמנה (מבוסס על כל ההזמנות שהוזמנו, כולל הושלמו)
    const avgValue =
      everOrderedOrders.length > 0
        ? totalEverOrderedValue / everOrderedOrders.length
        : 0;

    // הזמנות מתקרבות ל-ETA (30 יום הבאים)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const approachingETA = activeOrders.filter((order) => {
      const etaDate = new Date(order.etaFinal);
      return etaDate >= today && etaDate <= thirtyDaysFromNow;
    }).length;

    // הזמנות באיחור
    const overdue = activeOrders.filter((order) => {
      const etaDate = new Date(order.etaFinal);
      return etaDate < today;
    }).length;

    // התפלגות לפי סטטוס
    const statusBreakdown: { [key: string]: number } = {};
    orders.forEach((order) => {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    });

    return {
      totalActiveOrders: activeOrders.length,
      totalOrdersValue: totalValue,
      totalOrdersEverOrdered: everOrderedOrders.length,
      totalOrdersEverOrderedValue: totalEverOrderedValue,
      averageOrderValue: avgValue,
      ordersApproachingETA: approachingETA,
      overdueOrders: overdue,
      statusBreakdown,
    };
  };

  useEffect(() => {
    // סימולציה של טעינה קצרה
    setIsLoading(true);
    setTimeout(() => {
      setKpiData(calculateKPIs());
      setIsLoading(false);
    }, 500);
  }, [orders]); // מחשב מחדש כשהנתונים משתנים

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const kpiCards = [
    {
      title: 'סה"כ הזמנות פעילות',
      value: kpiData.totalActiveOrders,
      suffix: "",
      bgColor: "bg-blue-50",
      textColor: "text-blue-800",
      icon: "📦",
    },
    {
      title: 'סה"כ ערך הזמנות פעילות',
      value: formatCurrency(kpiData.totalOrdersValue),
      suffix: "",
      bgColor: "bg-green-50",
      textColor: "text-green-800",
      icon: "💰",
    },
    // 🆕 KPI חדש
    {
      title: 'סה"כ הזמנות שהוזמנו',
      value: kpiData.totalOrdersEverOrdered,
      suffix: "",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-800",
      icon: "📊",
      description: "כולל הושלמו, לא כולל מבוטלות",
    },
    {
      title: 'סה"כ ערך הזמנות שהוזמנו',
      value: formatCurrency(kpiData.totalOrdersEverOrderedValue),
      suffix: "",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-800",
      icon: "💵",
      description: "כולל הושלמו, לא כולל מבוטלות",
    },
    {
      title: "ממוצע ערך להזמנה",
      value: formatCurrency(kpiData.averageOrderValue),
      suffix: "",
      bgColor: "bg-purple-50",
      textColor: "text-purple-800",
      icon: "📈",
    },
    {
      title: "הזמנות מתקרבות ל-ETA",
      value: kpiData.ordersApproachingETA,
      suffix: " ב-30 יום",
      bgColor: "bg-orange-50",
      textColor: "text-orange-800",
      icon: "⏰",
    },
    {
      title: "הזמנות באיחור",
      value: kpiData.overdueOrders,
      suffix: "",
      bgColor: "bg-red-50",
      textColor: "text-red-800",
      icon: "🚨",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        {Array(7)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="bg-white p-3 lg:p-6 rounded-lg shadow-md animate-pulse min-w-0"
            >
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* כפתור רענון */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">נתוני מערכת</h2>
        <button
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => {
              setKpiData(calculateKPIs());
              setIsLoading(false);
            }, 500);
          }}
          disabled={isLoading}
          className={`px-4 py-1 text-white rounded-md transition-colors flex items-center space-x-2 ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <span>{isLoading ? "טוען..." : "רענן נתונים"}</span>
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
        </button>
      </div>

      {/* KPI Cards עליונים */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} p-3 lg:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative group min-w-0`}
          >
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2 truncate">
                  {card.title}
                </p>
                <p
                  className={`text-sm lg:text-2xl font-bold ${card.textColor} break-words`}
                >
                  {typeof card.value === "string"
                    ? card.value
                    : `${card.value}${card.suffix}`}
                </p>
                {/* תיאור נוסף לKPIs החדשים */}
                {card.description && (
                  <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {card.description}
                  </p>
                )}
              </div>
              <div className="text-lg lg:text-2xl opacity-80 flex-shrink-0 ml-2">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* התפלגות לפי סטטוס */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          התפלגות לפי סטטוס
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(kpiData.statusBreakdown).map(([status, count]) => (
            <div
              key={status}
              className="text-center p-3 bg-gray-50 rounded-lg min-w-0"
            >
              <div className="text-lg font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-600 truncate">{status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
