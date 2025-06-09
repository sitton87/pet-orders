"use client";

import { useEffect, useState } from "react";

interface KPIData {
  totalSuppliers: number;
  suppliersWithActiveOrders: number;
  averageAdvancePayment: number;
  averageProductionTime: number;
  averageShippingTime: number;
}

export default function SupplierKPIs() {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalSuppliers: 0,
    suppliersWithActiveOrders: 0,
    averageAdvancePayment: 0,
    averageProductionTime: 0,
    averageShippingTime: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKPIData();
  }, []);

  const fetchKPIData = async () => {
    try {
      setIsLoading(true);

      // טעינת ספקים
      const suppliersResponse = await fetch("/api/suppliers");
      const suppliers = await suppliersResponse.json();

      // טעינת הזמנות
      const ordersResponse = await fetch("/api/orders");
      const orders = await ordersResponse.json();

      // חישוב KPIs אמיתיים
      const totalSuppliers = suppliers.length;

      // ספקים עם הזמנות פעילות
      const activeSupplierIds = new Set(
        orders
          .filter(
            (order: any) =>
              order.status !== "הושלם" && order.status !== "מבוטלת"
          )
          .map((order: any) => order.supplierId)
      );
      const suppliersWithActiveOrders = activeSupplierIds.size;

      // ממוצע מקדמה (רק של ספקים שדורשים מקדמה)
      const suppliersWithAdvance = suppliers.filter(
        (s: any) => s.hasAdvancePayment
      );
      const averageAdvancePayment =
        suppliersWithAdvance.length > 0
          ? suppliersWithAdvance.reduce(
              (sum: number, s: any) => sum + (s.advancePercentage || 0),
              0
            ) / suppliersWithAdvance.length
          : 0;

      // ממוצע זמן ייצור
      const averageProductionTime =
        totalSuppliers > 0
          ? suppliers.reduce(
              (sum: number, s: any) => sum + (s.productionTimeWeeks || 0),
              0
            ) / totalSuppliers
          : 0;

      // ממוצע זמן שילוח
      const averageShippingTime =
        totalSuppliers > 0
          ? suppliers.reduce(
              (sum: number, s: any) => sum + (s.shippingTimeWeeks || 0),
              0
            ) / totalSuppliers
          : 0;

      setKpiData({
        totalSuppliers,
        suppliersWithActiveOrders,
        averageAdvancePayment: Math.round(averageAdvancePayment),
        averageProductionTime: Math.round(averageProductionTime * 10) / 10,
        averageShippingTime: Math.round(averageShippingTime * 10) / 10,
      });
    } catch (error) {
      console.error("Error fetching KPI data:", error);
      // במקרה של שגיאה, הצג 0 במקום נתונים דמה
      setKpiData({
        totalSuppliers: 0,
        suppliersWithActiveOrders: 0,
        averageAdvancePayment: 0,
        averageProductionTime: 0,
        averageShippingTime: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const kpiCards = [
    {
      title: 'סה"כ ספקים במערכת',
      value: kpiData.totalSuppliers,
      suffix: "",
      bgColor: "bg-blue-50",
      textColor: "text-blue-800",
      icon: "🏢",
    },
    {
      title: "ספקים עם הזמנה פעילה",
      value: kpiData.suppliersWithActiveOrders,
      suffix: "",
      bgColor: "bg-green-50",
      textColor: "text-green-800",
      icon: "✅",
    },
    {
      title: "ממוצע תשלום מקדמה",
      value: kpiData.averageAdvancePayment,
      suffix: "%",
      bgColor: "bg-purple-50",
      textColor: "text-purple-800",
      icon: "💰",
    },
    {
      title: "ממוצע זמן ייצור",
      value: kpiData.averageProductionTime,
      suffix: " שבועות",
      bgColor: "bg-orange-50",
      textColor: "text-orange-800",
      icon: "⏳",
    },
    {
      title: "ממוצע זמן שילוח",
      value: kpiData.averageShippingTime,
      suffix: " שבועות",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-800",
      icon: "🚚",
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
                {card.value}
                {card.suffix}
              </p>
            </div>
            <div className="text-2xl opacity-80">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
