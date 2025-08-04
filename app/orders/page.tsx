"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import OrderKPIs from "@/components/orders/OrderKPIs";
import OrdersList from "@/components/orders/OrdersList";
import OrderCalendarModal from "@/components/orders/OrderCalendarModal";
import type { Order, Supplier } from "@/types";

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrderForCalendar, setSelectedOrderForCalendar] = useState<{
    id: string;
    orderNumber: string;
  } | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // טעינת נתונים מה-API
    loadData();
  }, [session, status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // טעינת הזמנות וספקים במקביל
      const [ordersResponse, suppliersResponse] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/suppliers"),
      ]);

      if (!ordersResponse.ok) {
        throw new Error("שגיאה בטעינת הזמנות");
      }

      if (!suppliersResponse.ok) {
        throw new Error("שגיאה בטעינת ספקים");
      }

      const ordersData = await ordersResponse.json();
      const suppliersData = await suppliersResponse.json();

      setOrders(ordersData);
      setSuppliers(suppliersData);

      console.log("✅ Data loaded:", {
        orders: ordersData.length,
        suppliers: suppliersData.length,
      });
    } catch (error: any) {
      console.error("Error loading data:", error);
      setError(error.message || "שגיאה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrders = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
  };

  const handleViewGantt = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setSelectedOrderForCalendar({
        id: order.id,
        orderNumber: order.orderNumber,
      });
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="w-full px-4 py-8 mt-16">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg
                className="mx-auto h-12 w-12 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h3 className="text-lg font-medium text-red-900 mb-2">
                שגיאה בטעינת נתונים
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="w-full px-4 py-4 mt-16">
        {/* כותרת העמוד */}
        <div className="mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">ניהול הזמנות</h1>
            <div className="h-6 w-px bg-gray-300"></div>
            <p className="text-gray-600">
              מעקב ועדכון הזמנות, שלבי ייצור ושילוח
            </p>
          </div>
        </div>

        {/* KPIs עם נתונים אמיתיים */}
        <div className="mb-8">
          <OrderKPIs orders={orders} />
        </div>

        {/* רשימת הזמנות עם נתוני ספקים */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <OrdersList
            orders={orders}
            suppliers={suppliers}
            onUpdateOrders={handleUpdateOrders}
            onViewGantt={handleViewGantt}
          />
        </div>
      </div>

      {/* Calendar Modal */}
      {selectedOrderForCalendar && (
        <OrderCalendarModal
          isOpen={!!selectedOrderForCalendar}
          onClose={() => setSelectedOrderForCalendar(null)}
          orderId={selectedOrderForCalendar.id}
          orderNumber={selectedOrderForCalendar.orderNumber}
        />
      )}
    </div>
  );
}
