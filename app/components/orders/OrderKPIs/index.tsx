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
      {/* KPI Cards עליונים */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} p-3 lg:p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow relative group min-w-0 min-h-[120px] flex flex-col items-center justify-center text-center`}
          >
            {/* אייקון */}
            <div className="text-lg lg:text-2xl opacity-80 mb-2">
              {card.icon}
            </div>

            {/* כותרת */}
            <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2 line-clamp-2 leading-tight">
              {card.title}
            </p>

            {/* סכום */}
            <p
              className={`text-xs sm:text-sm md:text-base lg:text-lg font-bold ${card.textColor} whitespace-nowrap overflow-hidden text-ellipsis`}
            >
              {typeof card.value === "string"
                ? card.value
                : `${card.value}${card.suffix}`}
            </p>

            {/* תיאור נוסף לKPIs החדשים */}
            {card.description && (
              <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                {card.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
