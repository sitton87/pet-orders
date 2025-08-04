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

  // פונקציה לרענון ידני
  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    fetchKPIData();
  };

  useEffect(() => {
    // טעינה ראשונית
    fetchKPIData();

    // רענון כשחוזרים לדף (focus)
    const handleFocus = () => {
      console.log("🔄 Page focused - refreshing KPI data");
      fetchKPIData();
    };

    // רענון כשהדף נעשה visible שוב
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("🔄 Page visible - refreshing KPI data");
        fetchKPIData();
      }
    };

    // הוסף event listeners
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ניקוי
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []); // רק פעם אחת ברכוב

  const fetchKPIData = async () => {
    try {
      setIsLoading(true);

      // הוסף timestamp כדי למנוע cache
      const timestamp = new Date().getTime();

      // טעינת ספקים
      const suppliersResponse = await fetch(`/api/suppliers?t=${timestamp}`);
      if (!suppliersResponse.ok) {
        throw new Error(`Suppliers API error: ${suppliersResponse.status}`);
      }
      const suppliersData = await suppliersResponse.json();

      // טעינת הזמנות
      const ordersResponse = await fetch(`/api/orders?t=${timestamp}`);
      if (!ordersResponse.ok) {
        throw new Error(`Orders API error: ${ordersResponse.status}`);
      }
      const ordersData = await ordersResponse.json();

      // 🔧 וודא שאנחנו עובדים על המערכים הנכונים
      const suppliers = Array.isArray(suppliersData)
        ? suppliersData
        : suppliersData.suppliers || [];
      const orders = Array.isArray(ordersData)
        ? ordersData
        : ordersData.orders || [];

      // חישוב KPIs
      const totalSuppliers = suppliers.length;

      // ספקים עם הזמנות פעילות
      const activeSupplierIds = new Set(
        orders
          .filter((order: any) => {
            const isActive =
              order.status !== "הושלם" && order.status !== "מבוטלת";
            return isActive;
          })
          .map((order: any) => order.supplierId)
      );
      const suppliersWithActiveOrders = activeSupplierIds.size;

      // 🔧 ממוצע מקדמה
      const suppliersWithAdvance = suppliers.filter((s: any) => {
        const hasAdvance = s.hasAdvancePayment === true;
        console.log(
          `Supplier ${s.name}: hasAdvancePayment=${s.hasAdvancePayment}, percentage=${s.advancePercentage}`
        );
        return hasAdvance;
      });

      const averageAdvancePayment =
        suppliersWithAdvance.length > 0
          ? suppliersWithAdvance.reduce((sum: number, s: any) => {
              const percentage = Number(s.advancePercentage) || 0;
              return sum + percentage;
            }, 0) / suppliersWithAdvance.length
          : 0;

      // 🔧 ממוצע זמן ייצור
      const validProductionTimes = suppliers
        .map((s: any) => Number(s.productionTimeWeeks) || 0)
        .filter((time: number) => time > 0);

      const averageProductionTime =
        validProductionTimes.length > 0
          ? validProductionTimes.reduce(
              (sum: number, time: number) => sum + time,
              0
            ) / validProductionTimes.length
          : 0;

      // 🔧 ממוצע זמן שילוח
      const validShippingTimes = suppliers
        .map((s: any) => Number(s.shippingTimeWeeks) || 0)
        .filter((time: number) => time > 0);

      const averageShippingTime =
        validShippingTimes.length > 0
          ? validShippingTimes.reduce(
              (sum: number, time: number) => sum + time,
              0
            ) / validShippingTimes.length
          : 0;

      console.log("📊 Calculated KPIs:", {
        totalSuppliers,
        suppliersWithActiveOrders,
        averageAdvancePayment,
        averageProductionTime,
        averageShippingTime,
      });

      setKpiData({
        totalSuppliers,
        suppliersWithActiveOrders,
        averageAdvancePayment: Math.round(averageAdvancePayment * 10) / 10,
        averageProductionTime: Math.round(averageProductionTime * 10) / 10,
        averageShippingTime: Math.round(averageShippingTime * 10) / 10,
      });
    } catch (error) {
      console.error("Error fetching KPI data:", error);
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
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
      </div>
    );
  }

  return (
    <div>
      {/* הKPI cards עם תוכן ממורכז */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center justify-center text-center min-h-[120px]`}
          >
            {/* אייקון למעלה */}
            <div className="text-2xl opacity-80 mb-2">{card.icon}</div>

            {/* כותרת */}
            <p className="text-sm font-medium text-gray-600 mb-2 line-clamp-2 leading-tight">
              {card.title}
            </p>

            {/* ערך מרכזי */}
            <p className={`text-2xl font-bold ${card.textColor}`}>
              {card.value}
              {card.suffix}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
