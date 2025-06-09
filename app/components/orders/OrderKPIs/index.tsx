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
    averageOrderValue: 0,
    ordersApproachingETA: 0,
    overdueOrders: 0,
    statusBreakdown: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // חישוב KPIs מהנתונים האמיתיים
    const calculateKPIs = () => {
      // הזמנות פעילות (לא הושלמו ולא בוטלו)
      const activeOrders = orders.filter(
        (order) => order.status !== "הושלם" && order.status !== "מבוטלת"
      );

      // ערך כולל של הזמנות פעילות
      const totalValue = activeOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );

      // ממוצע מחיר להזמנה
      const avgValue =
        activeOrders.length > 0 ? totalValue / activeOrders.length : 0;

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
        statusBreakdown[order.status] =
          (statusBreakdown[order.status] || 0) + 1;
      });

      return {
        totalActiveOrders: activeOrders.length,
        totalOrdersValue: totalValue,
        averageOrderValue: avgValue,
        ordersApproachingETA: approachingETA,
        overdueOrders: overdue,
        statusBreakdown,
      };
    };

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
      title: 'סה"כ ערך הזמנות',
      value: formatCurrency(kpiData.totalOrdersValue),
      suffix: "",
      bgColor: "bg-green-50",
      textColor: "text-green-800",
      icon: "💰",
    },
    {
      title: "ממוצע מחיר להזמנה",
      value: formatCurrency(kpiData.averageOrderValue),
      suffix: "",
      bgColor: "bg-purple-50",
      textColor: "text-purple-800",
      icon: "📊",
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards עליונים */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${card.textColor}`}>
                  {typeof card.value === "string"
                    ? card.value
                    : `${card.value}${card.suffix}`}
                </p>
              </div>
              <div className="text-2xl opacity-80">{card.icon}</div>
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
            <div key={status} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-600">{status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
