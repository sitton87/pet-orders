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

  // 🆕 State משותף לניהול פתיחה/סגירה של כרטיסי הזמנות (כמו SupplierCard)
  const [openOrder, setOpenOrder] = useState<{
    id: string;
    type: "details" | "files";
    row: number;
  } | null>(null);

  // 🆕 תיבת סימון להצגת הושלם/מבוטלת
  const [showCompletedCancelled, setShowCompletedCancelled] = useState(false);

  // 🆕 סינון מתקדם עם תיבות סימון לסטטוסים
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set()
  );
  const [isStatusFilterExpanded, setIsStatusFilterExpanded] = useState(false);

  // עדכון כשהProps משתנות
  useEffect(() => {
    setOrders(initialOrders);

    // 🆕 אתחול ברירת מחדל לסטטוסים (הכל חוץ מהושלם ומבוטלת)
    const defaultStatuses = new Set(
      Array.from(new Set(initialOrders.map((order) => order.status))).filter(
        (status) => status !== "הושלם" && status !== "מבוטלת"
      )
    );
    setSelectedStatuses(defaultStatuses);
  }, [initialOrders]);

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
      await fetchOrders(); // רענן את הרשימה
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
      await fetchOrders(); // רענן את הרשימה
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
      await fetchOrders(); // רענן את הרשימה
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

  // 🆕 פונקציות לטיפול בסינון סטטוסים
  const handleStatusToggle = (status: string) => {
    const newStatuses = new Set(selectedStatuses);
    if (newStatuses.has(status)) {
      newStatuses.delete(status);
    } else {
      newStatuses.add(status);
    }
    setSelectedStatuses(newStatuses);
  };

  const handleSelectAllStatuses = () => {
    const allStatuses = new Set(orders.map((order) => order.status));
    setSelectedStatuses(allStatuses);
  };

  const handleClearAllStatuses = () => {
    setSelectedStatuses(new Set());
  };

  const handleResetToDefault = () => {
    const defaultStatuses = new Set(
      Array.from(new Set(orders.map((order) => order.status))).filter(
        (status) => status !== "הושלם" && status !== "מבוטלת"
      )
    );
    setSelectedStatuses(defaultStatuses);
  };

  // 🆕 סינון הזמנות מעודכן
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.containerNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSupplier =
      !supplierFilter || order.supplierId === supplierFilter;

    // 🆕 לוגיקת הצגת הושלם/מבוטלת
    const isCompletedOrCancelled =
      order.status === "הושלם" || order.status === "מבוטלת";

    // אם הזמנה היא הושלם/מבוטלת - הצג רק אם התיבה מסומנת
    if (isCompletedOrCancelled) {
      return showCompletedCancelled && matchesSearch && matchesSupplier;
    }

    // 🆕 סינון לפי סטטוסים נבחרים (רק להזמנות שאינן הושלם/מבוטלת)
    const matchesStatus = selectedStatuses.has(order.status);

    return matchesSearch && matchesSupplier && matchesStatus;
  });

  // רשימת סטטוסים ייחודיים (ללא הושלם ומבוטלת לסינון)
  const uniqueStatuses = Array.from(
    new Set(orders.map((order) => order.status))
  )
    .filter((status) => status !== "הושלם" && status !== "מבוטלת")
    .sort();

  const uniqueSuppliers = Array.from(
    new Set(orders.map((order) => order.supplierName))
  );

  // 🆕 ספירת הזמנות לפי סטטוס
  const statusCounts: { [key: string]: number } = {};
  orders.forEach((order) => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
  });

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

  return (
    <div>
      {/* כותרת וכפתור הוספה */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            רשימת הזמנות
          </h2>
          <p className="text-sm text-gray-600">
            {orders.length} הזמנות במערכת ({filteredOrders.length} מוצגות)
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-3 lg:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 ml-2" />
          הוסף הזמנה חדשה
        </button>
      </div>

      {/* סינונים וחיפוש */}
      <div className="mb-6 space-y-4">
        {/* שדה חיפוש */}
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="חפש הזמנות (מספר הזמנה, ספק, הערות, מכולה...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* שורת בקרים */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* 🆕 תיבת סימון להצגת הושלם/מבוטלת */}
          <label className="flex items-center space-x-2 text-sm">
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

          {/* סינון ספק */}
          <div>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">כל הספקים</option>
              {uniqueSuppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          </div>

          {/* 🆕 כפתור סינון סטטוסים */}
          <button
            onClick={() => setIsStatusFilterExpanded(!isStatusFilterExpanded)}
            className="flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            <Filter className="h-4 w-4" />
            <span>סינון סטטוסים ({selectedStatuses.size})</span>
          </button>

          {/* כפתור ניקוי סינונים */}
          {(supplierFilter ||
            searchTerm ||
            selectedStatuses.size !== uniqueStatuses.length) && (
            <button
              onClick={() => {
                setSupplierFilter("");
                setSearchTerm("");
                handleResetToDefault();
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              נקה סינונים
            </button>
          )}
        </div>

        {/* 🆕 תיבות סימון לסטטוסים */}
        {isStatusFilterExpanded && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">
                בחר סטטוסים להצגה:
              </h4>
              <div className="flex space-x-2 text-xs">
                <button
                  onClick={handleSelectAllStatuses}
                  className="text-blue-600 hover:text-blue-700"
                >
                  בחר הכל
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={handleClearAllStatuses}
                  className="text-red-600 hover:text-red-700"
                >
                  בטל הכל
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={handleResetToDefault}
                  className="text-green-600 hover:text-green-700"
                >
                  ברירת מחדל
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {uniqueStatuses.map((status) => (
                <label
                  key={status}
                  className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                    selectedStatuses.has(status)
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.has(status)}
                    onChange={() => handleStatusToggle(status)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 flex-1">{status}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      selectedStatuses.has(status)
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {statusCounts[status] || 0}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
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
            {searchTerm ||
            supplierFilter ||
            selectedStatuses.size < uniqueStatuses.length
              ? "לא נמצאו הזמנות"
              : "אין הזמנות במערכת"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ||
            supplierFilter ||
            selectedStatuses.size < uniqueStatuses.length
              ? "לא נמצאו הזמנות התואמות לסינונים שנבחרו"
              : "התחל בהוספת הזמנה ראשונה למערכת"}
          </p>
          {!searchTerm &&
            !supplierFilter &&
            selectedStatuses.size === uniqueStatuses.length && (
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
        />
      )}
    </div>
  );
}
