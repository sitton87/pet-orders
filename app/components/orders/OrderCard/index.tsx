"use client";

import { useState } from "react";
import {
  Calendar,
  DollarSign,
  Package,
  Truck,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  FileText,
  Upload,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Order } from "@/types";
import FileUpload from "@/components/common/FileUpload";

interface OrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => Promise<void>;
  onViewGantt: (orderId: string) => void;
}

export default function OrderCard({
  order,
  onEdit,
  onDelete,
  onViewGantt,
}: OrderCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    await onDelete(order.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "בתהליך הזמנה":
        return "bg-yellow-100 text-yellow-800";
      case "בייצור":
        return "bg-blue-100 text-blue-800";
      case "נשלח":
        return "bg-purple-100 text-purple-800";
      case "בדרך":
        return "bg-indigo-100 text-indigo-800";
      case "הגיע לנמל":
        return "bg-orange-100 text-orange-800";
      case "הושלם":
        return "bg-green-100 text-green-800";
      case "מבוטלת":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const isOverdue = () => {
    const etaDate = new Date(order.etaFinal);
    const today = new Date();
    return (
      etaDate < today && order.status !== "הושלם" && order.status !== "מבוטלת"
    );
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 ${
        isOverdue() ? "border-l-4 border-l-red-500" : ""
      }`}
    >
      {/* כותרת הכרטיס */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {order.orderNumber}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
              {isOverdue() && (
                <div className="flex items-center text-red-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">באיחור</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span>ספק: {order.supplierName || "לא צוין"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>
                  ETA: {new Date(order.etaFinal).toLocaleDateString("he-IL")}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span>
                  {formatCurrency(
                    Number(order.totalAmount),
                    order.originalCurrency
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFiles(!showFiles)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="קבצים"
            >
              <FileText className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewGantt(order.id)}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
              title="צפה בגאנט"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(order)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="ערוך"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="מחק"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* מידע מהיר */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            {order.containerNumber && (
              <div className="flex items-center space-x-1">
                <Truck className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{order.containerNumber}</span>
              </div>
            )}
            {order.advanceAmount && Number(order.advanceAmount) > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                מקדמה:{" "}
                {formatCurrency(
                  Number(order.advanceAmount),
                  order.originalCurrency
                )}
              </span>
            )}
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span className="text-sm">פרטים נוספים</span>
            {showDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* פרטים מורחבים */}
      {showDetails && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="pt-4 space-y-4">
            {/* פרטים כספיים */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                פרטים כספיים
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 rounded-md p-3">
                  <div className="font-medium text-green-900">סכום כולל</div>
                  <div className="text-green-700">
                    {formatCurrency(
                      Number(order.totalAmount),
                      order.originalCurrency
                    )}
                  </div>
                </div>
                {order.advanceAmount && Number(order.advanceAmount) > 0 && (
                  <div className="bg-blue-50 rounded-md p-3">
                    <div className="font-medium text-blue-900">מקדמה</div>
                    <div className="text-blue-700">
                      {formatCurrency(
                        Number(order.advanceAmount),
                        order.originalCurrency
                      )}
                    </div>
                  </div>
                )}
                {order.finalPaymentAmount &&
                  Number(order.finalPaymentAmount) > 0 && (
                    <div className="bg-purple-50 rounded-md p-3">
                      <div className="font-medium text-purple-900">
                        תשלום סופי
                      </div>
                      <div className="text-purple-700">
                        {formatCurrency(
                          Number(order.finalPaymentAmount),
                          order.originalCurrency
                        )}
                      </div>
                    </div>
                  )}
                {order.exchangeRate && Number(order.exchangeRate) > 0 && (
                  <div className="bg-orange-50 rounded-md p-3">
                    <div className="font-medium text-orange-900">
                      שער חליפין
                    </div>
                    <div className="text-orange-700">
                      {Number(order.exchangeRate).toFixed(3)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* פרטי משלוח */}
            {(order.containerNumber || order.portReleaseCost) && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  פרטי משלוח
                </h4>
                <div className="bg-gray-50 rounded-md p-3 text-sm space-y-2">
                  {order.containerNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">מספר קונטיינר:</span>
                      <span className="font-medium">
                        {order.containerNumber}
                      </span>
                    </div>
                  )}
                  {order.portReleaseCost &&
                    Number(order.portReleaseCost) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">עלות שחרור נמל:</span>
                        <span className="font-medium">
                          {formatCurrency(Number(order.portReleaseCost))}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* הערות */}
            {order.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  הערות
                </h4>
                <div className="bg-yellow-50 rounded-md p-3 text-sm text-yellow-800">
                  {order.notes}
                </div>
              </div>
            )}

            {/* תאריכים */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                תאריכים
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-md p-3">
                  <div className="font-medium text-gray-900">תאריך יצירה</div>
                  <div className="text-gray-700">
                    {new Date(order.createdAt).toLocaleDateString("he-IL")}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-md p-3">
                  <div className="font-medium text-gray-900">ETA סופי</div>
                  <div className="text-gray-700">
                    {new Date(order.etaFinal).toLocaleDateString("he-IL")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* קבצים מצורפים */}
      {showFiles && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              קבצים מצורפים
            </h4>
            <FileUpload
              entityId={order.id}
              entityType="order"
              onFilesChange={(files) => {
                console.log("Files updated:", files);
              }}
            />
          </div>
        </div>
      )}

      {/* דיאלוג אישור מחיקה */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              אישור מחיקה
            </h3>
            <p className="text-gray-600 mb-6">
              האם אתה בטוח שברצונך למחוק את ההזמנה "{order.orderNumber}"? פעולה
              זו לא ניתנת לביטול.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                בטל
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
