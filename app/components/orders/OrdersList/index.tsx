"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Filter } from "lucide-react";
import OrderCard from "../OrderCard";
import AddOrderModal from "../AddOrderModal";
import EditOrderModal from "../EditOrderModal";
import type { Order, Supplier } from "@/types";

interface OrdersListProps {
  orders: Order[];
  suppliers: Supplier[];
  onUpdateOrders: (orders: Order[]) => void;
}

export default function OrdersList({
  orders: initialOrders,
  suppliers,
  onUpdateOrders,
}: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // עדכון כשהProps משתנות
  useEffect(() => {
    setOrders(initialOrders);
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

      // וודא שיש ID להזמנה
      if (!orderData.id) {
        throw new Error("מזהה הזמנה חסר");
      }

      const response = await fetch(`/api/orders?id=${orderData.id}`, {
        // ← הוסף ID כאן!
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
    // לעתיד - מעבר לתצוגת גאנט של הזמנה ספציפית
    console.log("View Gantt for order:", orderId);
    alert("תצוגת גאנט תתווסף בהמשך");
  };

  // סינון הזמנות
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.containerNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesSupplier =
      !supplierFilter || order.supplierId === supplierFilter;

    return matchesSearch && matchesStatus && matchesSupplier;
  });

  // רשימת סטטוסים ייחודיים
  const uniqueStatuses = Array.from(
    new Set(orders.map((order) => order.status))
  );
  const uniqueSuppliers = Array.from(
    new Set(orders.map((order) => order.supplierName))
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

  return (
    <div>
      {/* כותרת וכפתור הוספה */}
      <div className="flex flex-col flex-row justify-between items-start items-center mb-6">
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
          className="mt-3 mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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

        {/* סינונים */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">כל הסטטוסים</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

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

          {(statusFilter || supplierFilter || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter("");
                setSupplierFilter("");
                setSearchTerm("");
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              נקה סינונים
            </button>
          )}
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
            {searchTerm || statusFilter || supplierFilter
              ? "לא נמצאו הזמנות"
              : "אין הזמנות במערכת"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter || supplierFilter
              ? "לא נמצאו הזמנות התואמות לסינונים"
              : "התחל בהוספת הזמנה ראשונה למערכת"}
          </p>
          {!searchTerm && !statusFilter && !supplierFilter && (
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
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
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
