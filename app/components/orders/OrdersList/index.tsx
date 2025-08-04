"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Filter, Eye, EyeOff } from "lucide-react";
import OrderCard from "../OrderCard";
import AddOrderModal from "../AddOrderModal";
import EditOrderModal from "../EditOrderModal";
import type { Order, Supplier } from "@/types";

interface OrdersListProps {
  orders: Order[];
  suppliers: Supplier[];
  onUpdateOrders: (orders: Order[]) => void;
  onViewGantt?: (orderId: string) => void;
}

export default function OrdersList({
  orders: initialOrders,
  suppliers,
  onUpdateOrders,
  onViewGantt,
}: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [customsCompanies, setCustomsCompanies] = useState([]);
  const [customsAgents, setCustomsAgents] = useState([]);

  // State משותף לניהול פתיחה/סגירה של כרטיסי הזמנות
  const [openOrder, setOpenOrder] = useState<{
    id: string;
    type: "details" | "files";
    row: number;
  } | null>(null);

  // תיבת סימון להצגת הושלם/מבוטלת
  const [showCompletedCancelled, setShowCompletedCancelled] = useState(false);

  // תיבת סימון למיון הפוך
  const [reverseDateSort, setReverseDateSort] = useState(false);

  // 🆕 סינון סטטוס פשוט
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("all");

  // עדכון כשהProps משתנות
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    const loadCustomsData = async () => {
      try {
        const [companiesRes, agentsRes] = await Promise.all([
          fetch("/api/customs/companies"),
          fetch("/api/customs/agents"),
        ]);

        if (companiesRes.ok) {
          const companies = await companiesRes.json();
          setCustomsCompanies(companies);
        }

        if (agentsRes.ok) {
          const agents = await agentsRes.json();
          setCustomsAgents(agents);
        }
      } catch (error) {
        console.error("Error loading customs data:", error);
      }
    };

    loadCustomsData();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/orders");

      if (!response.ok) {
        throw new Error("שגיאה בטעינת הזמנות");
      }

      const data = await response.json();
      setOrders(data);
      onUpdateOrders(data);
      console.log("✅ Orders loaded:", data.length);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setError("שגיאה בטעינת הזמנות");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrder = async (orderData: any) => {
    try {
      console.log("Adding order:", orderData);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "שגיאה ביצירת הזמנה");
      }

      console.log("✅ Order added successfully");
      await fetchOrders();
      setShowAddModal(false);
    } catch (error: any) {
      console.error("Error adding order:", error);
      alert("שגיאה ביצירת הזמנה: " + (error?.message || "שגיאה לא ידועה"));
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowEditModal(true);
  };

  const handleUpdateOrder = async (orderData: any) => {
    try {
      console.log("Updating order:", orderData);

      if (!orderData.id) {
        throw new Error("מזהה הזמנה חסר");
      }

      const response = await fetch(`/api/orders?id=${orderData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "שגיאה בעדכון הזמנה");
      }

      console.log("✅ Order updated successfully");
      await fetchOrders();
      setShowEditModal(false);
      setEditingOrder(null);
    } catch (error: any) {
      console.error("Error updating order:", error);
      alert("שגיאה בעדכון הזמנה: " + (error?.message || "שגיאה לא ידועה"));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    const orderName = order?.orderNumber || "הזמנה לא ידועה";

    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך למחוק את ההזמנה "${orderName}"?`
    );

    if (!confirmed) return;

    try {
      console.log("Deleting order:", orderId);
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "שגיאה במחיקת הזמנה");
      }

      console.log("✅ Order deleted successfully");
      await fetchOrders();
    } catch (error: any) {
      console.error("Error deleting order:", error);
      alert("שגיאה במחיקת הזמנה: " + (error?.message || "שגיאה לא ידועה"));
    }
  };

  const handleViewGantt = (orderId: string) => {
    if (onViewGantt) {
      onViewGantt(orderId);
    } else {
      console.log("View Gantt for order:", orderId);
      alert("תצוגת גאנט תתווסף בהמשך");
    }
  };

  // סינון הזמנות מעודכן עם מיון
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.containerNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSupplier =
        !supplierFilter || order.supplierName === supplierFilter;

      // לוגיקת הצגת הושלם/מבוטלת
      const isCompletedOrCancelled =
        order.status === "הושלם" || order.status === "מבוטלת";

      if (isCompletedOrCancelled && !showCompletedCancelled) {
        return false;
      }

      // 🆕 סינון לפי סטטוס נבחר
      const matchesStatus =
        selectedStatusFilter === "all" || order.status === selectedStatusFilter;

      return matchesSearch && matchesSupplier && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.actualEta || a.etaFinal);
      const dateB = new Date(b.actualEta || b.etaFinal);
      const sortOrder = reverseDateSort
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
      return sortOrder;
    });

  // עדכן את יצירת הרשימה:
  const uniqueSuppliers = Array.from(
    new Set(
      orders
        .filter((order) => {
          // בדוק שיש שם ספק
          if (!order.supplierName || order.supplierName.trim() === "") {
            return false;
          }

          // אם זה הושלם או מבוטלת, הצג רק אם התיבה מסומנת
          const isCompletedOrCancelled =
            order.status === "הושלם" || order.status === "מבוטלת";

          if (isCompletedOrCancelled) {
            return showCompletedCancelled;
          }

          return true;
        })
        .map((order) => order.supplierName)
    )
  ).sort(); // ממיין אלפבתית

  // ספירת הזמנות לפי סטטוס
  const statusCounts: { [key: string]: number } = {};
  orders.forEach((order) => {
    // אם זה הושלם או מבוטלת, ספור רק אם התיבה מסומנת
    const isCompletedOrCancelled =
      order.status === "הושלם" || order.status === "מבוטלת";

    if (isCompletedOrCancelled && !showCompletedCancelled) {
      return; // דלג על ההזמנה הזו
    }

    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
  });

  // חשב סך הכל הזמנות שמוצגות
  const totalVisibleOrders = Object.values(statusCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">טוען הזמנות...</span>
      </div>
    );
  }

  if (error) {
    return (
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
          {error}
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          נסה שוב
        </button>
      </div>
    );
  }
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    console.log("🎯 OrdersList - handleStatusUpdate called:", {
      orderId,
      newStatus,
    });

    // עדכן את ההזמנה ברשימה המקומית
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );

    setOrders(updatedOrders);
    onUpdateOrders(updatedOrders); // עדכן את הרכיב האב (KPI)

    console.log("✅ Orders list updated");
  };

  return (
    <div>
      {/* כותרת, חיפוש, סינונים וכפתור הוספה - בשורה אחת */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-0 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            רשימת הזמנות
          </h2>
          <p className="text-sm text-gray-600">
            {orders.length} הזמנות במערכת ({filteredOrders.length} מוצגות)
          </p>
        </div>

        {/* אזור מרכזי - חיפוש וסינונים */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 flex-1 max-w-4xl">
          {/* שדה חיפוש */}
          <div className="relative w-full lg:w-64">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="חפש הזמנות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          {/* סינון ספק */}
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 min-w-0"
          >
            <option value="">כל הספקים</option>
            {uniqueSuppliers.map((supplier) => (
              <option key={supplier} value={supplier}>
                {supplier}
              </option>
            ))}
          </select>
          {/* תיבות סימון */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <label className="flex items-center space-x-2 text-base whitespace-nowrap">
              <input
                type="checkbox"
                checked={showCompletedCancelled}
                onChange={(e) => setShowCompletedCancelled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">הצג הושלם ומבוטלת</span>
              {showCompletedCancelled ? (
                <Eye className="h-4 w-4 text-green-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
            </label>

            <label className="flex items-center space-x-2 text-base whitespace-nowrap">
              <input
                type="checkbox"
                checked={reverseDateSort}
                onChange={(e) => setReverseDateSort(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">
                {reverseDateSort ? "מיון: רחוק←קרוב" : "מיון: קרוב←רחוק"}
              </span>
            </label>
          </div>
        </div>

        {/* כפתורי פעולה */}
        <div className="flex items-center gap-3">
          {(supplierFilter || searchTerm || selectedStatusFilter !== "all") && (
            <button
              onClick={() => {
                setSupplierFilter("");
                setSearchTerm("");
                setSelectedStatusFilter("all");
              }}
              className="text-sm text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md hover:bg-blue-50 transition-colors"
            >
              נקה סינונים
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex-shrink-0"
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף הזמנה חדשה
          </button>
        </div>
      </div>

      {/* סטטוסים עם כותרת וכפתורים באותה שורה */}
      <div className="mb-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* כותרת */}
            <h3 className="text-lg font-semibold text-gray-900 flex-shrink-0">
              סינון לפי סטטוס
            </h3>

            {/* כפתורי הסטטוסים */}
            <div className="flex flex-wrap gap-2 flex-1">
              <button
                onClick={() => setSelectedStatusFilter("all")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedStatusFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                הכל ({totalVisibleOrders})
              </button>

              {Object.entries(statusCounts)
                .filter(([status]) => {
                  if (status === "הושלם" || status === "מבוטלת") {
                    return showCompletedCancelled;
                  }
                  return true;
                })
                .map(([status, count]) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatusFilter(status)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedStatusFilter === status
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status} ({count})
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* רשימת הזמנות */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || supplierFilter || selectedStatusFilter !== "all"
              ? "לא נמצאו הזמנות"
              : "אין הזמנות במערכת"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || supplierFilter || selectedStatusFilter !== "all"
              ? "לא נמצאו הזמנות התואמות לסינונים שנבחרו"
              : "התחל בהוספת הזמנה ראשונה למערכת"}
          </p>
          {!searchTerm && !supplierFilter && selectedStatusFilter === "all" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 ml-2" />
              הוסף הזמנה ראשונה
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              rowIndex={index}
              openOrder={openOrder}
              setOpenOrder={setOpenOrder}
              onEdit={handleEditOrder}
              onDelete={handleDeleteOrder}
              onViewGantt={handleViewGantt}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}

      {/* Modal הוספת הזמנה */}
      {showAddModal && (
        <AddOrderModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddOrder={handleAddOrder}
          suppliers={suppliers}
        />
      )}

      {/* Modal עריכת הזמנה */}
      {showEditModal && editingOrder && (
        <EditOrderModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingOrder(null);
          }}
          onUpdateOrder={handleUpdateOrder}
          order={editingOrder}
          suppliers={suppliers}
          customsCompanies={customsCompanies}
          customsAgents={customsAgents}
        />
      )}
    </div>
  );
}
