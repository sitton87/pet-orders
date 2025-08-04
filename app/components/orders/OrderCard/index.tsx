"use client";

import { useState, useEffect } from "react";
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
  rowIndex: number;
  openOrder: { id: string; type: "details" | "files"; row: number } | null;
  setOpenOrder: (
    value: { id: string; type: "details" | "files"; row: number } | null
  ) => void;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => Promise<void>;
  onViewGantt: (orderId: string) => void;
}

interface OrderCardProps {
  order: Order;
  rowIndex: number;
  openOrder: { id: string; type: "details" | "files"; row: number } | null;
  setOpenOrder: (
    value: { id: string; type: "details" | "files"; row: number } | null
  ) => void;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => Promise<void>;
  onViewGantt: (orderId: string) => void;
  onStatusUpdate?: (orderId: string, newStatus: string) => void; // 🆕 הוסף זה
}

export default function OrderCard({
  order,
  rowIndex,
  openOrder,
  setOpenOrder,
  onEdit,
  onDelete,
  onViewGantt,
  onStatusUpdate,
}: OrderCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 🆕 State לניהול מיקום הכרטיס
  const [cardRef, setCardRef] = useState<HTMLDivElement | null>(null);
  const [shouldOpenUpward, setShouldOpenUpward] = useState(false);

  // 🆕 State לסטטוסים דינמיים
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.status);

  // 🆕 חישוב מצב פתוח/סגור מה-state המשותף (כמו SupplierCard)
  const showDetails =
    openOrder?.id === order.id &&
    openOrder?.type === "details" &&
    openOrder?.row === rowIndex;
  const showFiles =
    openOrder?.id === order.id &&
    openOrder?.type === "files" &&
    openOrder?.row === rowIndex;

  // 🆕 פונקציה לבדיקת מיקום הכרטיס
  const checkPosition = () => {
    if (!cardRef) return;

    const cardRect = cardRef.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // אם הכרטיס נמצא בחצי התחתון של המסך
    const shouldOpen = cardRect.bottom > windowHeight * 0.6;
    setShouldOpenUpward(shouldOpen);
  };

  // 🆕 פונקציות לניהול פתיחה/סגירה (כמו SupplierCard)
  const handleToggleDetails = () => {
    if (showDetails) {
      setOpenOrder(null);
    } else {
      checkPosition(); // בדוק מיקום לפני פתיחה
      setOpenOrder({ id: order.id, type: "details", row: rowIndex });
    }
  };

  const handleToggleFiles = () => {
    if (showFiles) {
      setOpenOrder(null);
    } else {
      checkPosition(); // בדוק מיקום לפני פתיחה
      setOpenOrder({ id: order.id, type: "files", row: rowIndex });
    }
  };

  // 🆕 טיפול במקש ESC (כמו SupplierCard)
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && (showDetails || showFiles)) {
        setOpenOrder(null);
      }
    };

    if (showDetails || showFiles) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showDetails, showFiles, setOpenOrder]);

  // 🔄 טעינת סטטוסים זמינים
  useEffect(() => {
    loadAvailableStatuses();
  }, []);

  const loadAvailableStatuses = async () => {
    try {
      const response = await fetch("/api/settings/statuses");
      if (response.ok) {
        const data = await response.json();
        setAvailableStatuses(data.statuses);
      }
    } catch (error) {
      console.error("Error loading statuses:", error);
      // סטטוסים ברירת מחדל במקרה של שגיאה
      setAvailableStatuses([
        "בתהליך הזמנה",
        "נשלח",
        "בדרך",
        "הגיע לנמל",
        "הושלם",
        "מבוטלת",
      ]);
    }
  };

  // 🔄 פונקציה לעדכון סטטוס
  const updateOrderStatus = async (newStatus: string) => {
    console.log("🔄 OrderCard - updateOrderStatus called with:", newStatus);
    console.log("📋 Order ID:", order.id);
    console.log("📋 Current status:", currentStatus);

    if (newStatus === currentStatus) {
      console.log("⚠️ New status same as current - no update needed");
      return;
    }

    setIsUpdatingStatus(true);
    console.log("📡 Sending status update request...");

    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log("📨 Response status:", response.status);

      if (response.ok) {
        console.log("✅ Status updated successfully");

        setCurrentStatus(newStatus);
        // עדכון האובייקט המקומי
        order.status = newStatus;

        // 🔧 עדכן את הרכיב האב!
        if (onStatusUpdate) {
          console.log("🔄 Calling parent onStatusUpdate");
          onStatusUpdate(order.id, newStatus);
        } else {
          console.log("⚠️ No onStatusUpdate callback provided");
        }
      } else {
        console.error("❌ Failed to update status");
        // החזרת הסטטוס הקודם במקרה של שגיאה
        setCurrentStatus(order.status);
      }
    } catch (error) {
      console.error("💥 Error updating status:", error);
      setCurrentStatus(order.status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    await onDelete(order.id);
  };

  // 🎨 צבעים דינמיים לפי סדר הסטטוסים
  const getStatusColor = (status: string) => {
    const statusIndex = availableStatuses.indexOf(status);
    const colors = [
      "bg-yellow-100 text-yellow-800 border-yellow-200", // סטטוס ראשון
      "bg-blue-100 text-blue-800 border-blue-200", // סטטוס שני
      "bg-purple-100 text-purple-800 border-purple-200", // סטטוס שלישי
      "bg-indigo-100 text-indigo-800 border-indigo-200", // סטטוס רביעי
      "bg-orange-100 text-orange-800 border-orange-200", // סטטוס חמישי
      "bg-green-100 text-green-800 border-green-200", // סטטוס שישי
      "bg-red-100 text-red-800 border-red-200", // סטטוס שביעי
      "bg-gray-100 text-gray-800 border-gray-200", // סטטוס לא מוכר
    ];

    return colors[statusIndex] || colors[7];
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
    const completedStatuses = ["הושלם", "מבוטלת"];
    return etaDate < today && !completedStatuses.includes(currentStatus);
  };

  return (
    <div
      ref={setCardRef}
      className={`rounded-lg shadow-md border transition-all duration-200 hover:shadow-lg ${
        showDetails
          ? "bg-blue-50 border-blue-300 shadow-blue-100 relative z-10"
          : showFiles
          ? "bg-blue-50 border-blue-200 shadow-blue-50 relative z-10"
          : isOverdue()
          ? "bg-white border-red-200 border-l-4 border-l-red-500"
          : "bg-white border-gray-200"
      }`}
    >
      {/* כותרת הכרטיס - Responsive */}
      <div className="p-4 lg:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <div className="flex items-center space-x-2 lg:space-x-3 mb-2">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">
                  {order.supplierName || "ספק לא צוין"}
                </h3>

                {/* 🆕 Dropdown לעדכון סטטוס - Responsive */}
                <div className="relative flex-shrink-0">
                  <select
                    value={currentStatus}
                    onChange={(e) => updateOrderStatus(e.target.value)}
                    disabled={isUpdatingStatus}
                    className={`inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs font-medium border cursor-pointer 
                      ${getStatusColor(currentStatus)} 
                      ${
                        isUpdatingStatus
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:shadow-sm"
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`}
                  >
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {isUpdatingStatus && (
                    <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                    </div>
                  )}
                </div>

                {isOverdue() && (
                  <div className="flex items-center text-red-600 flex-shrink-0">
                    <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                    <span className="text-xs font-medium hidden sm:inline">
                      באיחור
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* פרטי יצירת קשר - Responsive */}
            <div className="space-y-1 lg:space-y-2 text-xs lg:text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Package className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  מספר הזמנה: {order.orderNumber}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  זמן הגעה משוער:{" "}
                  {order.actualEta
                    ? new Date(order.actualEta).toLocaleDateString("he-IL")
                    : new Date(order.etaFinal).toLocaleDateString("he-IL")}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {formatCurrency(
                    Number(order.totalAmount),
                    order.originalCurrency
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* כפתורי פעולה - Responsive */}
          <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
            <button
              onClick={handleToggleFiles}
              disabled={showDetails}
              className={`p-1.5 lg:p-2 rounded-md transition-colors ${
                showDetails
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
              title={showDetails ? "לא זמין כשפרטים נוספים פתוח" : "קבצים"}
            >
              <FileText className="h-3 w-3 lg:h-4 lg:w-4" />
            </button>
            <button
              onClick={() => onViewGantt(order.id)}
              className="p-1.5 lg:p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
              title="צפה בלוח שנה"
            >
              <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
            </button>
            <button
              onClick={() => onEdit(order)}
              className="p-1.5 lg:p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="ערוך"
            >
              <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 lg:p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="מחק"
            >
              <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
            </button>
          </div>
        </div>

        {/* מידע מהיר - Responsive */}
        <div className="mt-3 lg:mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-0">
          <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm">
            {order.containerNumber && (
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Truck className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
                <span className="text-gray-600 whitespace-nowrap">
                  {order.containerNumber}
                </span>
              </div>
            )}
            {order.advanceAmount && Number(order.advanceAmount) > 0 ? (
              <span className="inline-flex items-center px-2 lg:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                מקדמה:{" "}
                {formatCurrency(
                  Number(order.advanceAmount),
                  order.originalCurrency
                )}
              </span>
            ) : null}
          </div>

          <button
            onClick={handleToggleDetails}
            className="flex items-center justify-center lg:justify-start space-x-1 text-blue-600 hover:text-blue-800 transition-colors py-1 lg:py-0"
          >
            <span className="text-xs lg:text-sm">פרטים נוספים</span>
            {showDetails ? (
              <ChevronUp className="h-3 w-3 lg:h-4 lg:w-4" />
            ) : (
              <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4" />
            )}
          </button>
        </div>
      </div>

      {/* פרטים מורחבים - Responsive */}
      {showDetails && (
        <div
          className={`absolute left-0 right-0 bg-blue-50 border border-blue-300 shadow-lg z-20 px-4 lg:px-6 py-4 lg:py-6 ${
            shouldOpenUpward
              ? "bottom-full border-b-0 rounded-t-lg"
              : "top-full border-t-0 rounded-b-lg"
          }`}
        >
          <div className="space-y-3 lg:space-y-4">
            {/* פרטים כספיים */}
            <div>
              <h4 className="text-xs lg:text-sm font-medium text-gray-900 mb-2">
                פרטים כספיים
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4 text-xs lg:text-sm">
                <div className="bg-green-50 rounded-md p-2 lg:p-3 border border-green-200">
                  <div className="font-medium text-green-900">סכום כולל</div>
                  <div className="text-green-700">
                    {formatCurrency(
                      Number(order.totalAmount),
                      order.originalCurrency
                    )}
                  </div>
                </div>
                {order.advanceAmount && Number(order.advanceAmount) > 0 && (
                  <div className="bg-blue-50 rounded-md p-2 lg:p-3 border border-blue-200">
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
                    <div className="bg-purple-50 rounded-md p-2 lg:p-3 border border-purple-200">
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
                  <div className="bg-orange-50 rounded-md p-2 lg:p-3 border border-orange-200">
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
                <h4 className="text-xs lg:text-sm font-medium text-gray-900 mb-2">
                  פרטי משלוח
                </h4>
                <div className="bg-gray-50 rounded-md p-2 lg:p-3 text-xs lg:text-sm space-y-1 lg:space-y-2 border border-gray-200">
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
                <h4 className="text-xs lg:text-sm font-medium text-gray-900 mb-2">
                  הערות
                </h4>
                <div className="bg-yellow-50 rounded-md p-2 lg:p-3 text-xs lg:text-sm text-yellow-800 border border-yellow-200">
                  {order.notes}
                </div>
              </div>
            )}

            {/* תאריכים */}
            <div>
              <h4 className="text-xs lg:text-sm font-medium text-gray-900 mb-2">
                תאריכים
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4 text-xs lg:text-sm">
                <div className="bg-gray-50 rounded-md p-2 lg:p-3 border border-gray-200">
                  <div className="font-medium text-gray-900">תאריך יצירה</div>
                  <div className="text-gray-700">
                    {new Date(order.createdAt).toLocaleDateString("he-IL")}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-md p-2 lg:p-3 border border-gray-200">
                  <div className="font-medium text-gray-900">ETA סופי</div>
                  <div className="text-gray-700">
                    {new Date(order.etaFinal).toLocaleDateString("he-IL")}
                  </div>
                </div>
              </div>
            </div>

            {/* תאריכים נוספים */}
            <div className="mt-3 lg:mt-4 pt-2 lg:pt-3 border-t border-gray-200 text-xs text-gray-500 flex flex-col sm:flex-row sm:justify-between gap-1">
              <span>
                נוצר: {new Date(order.createdAt).toLocaleDateString("he-IL")}
              </span>
              <span>
                עודכן:{" "}
                {new Date(
                  order.updatedAt || order.createdAt
                ).toLocaleDateString("he-IL")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* תצוגת מסמכים - Responsive */}
      {showFiles && !showDetails && (
        <div
          className={`absolute left-0 right-0 bg-blue-50 border border-blue-200 shadow-lg z-20 px-4 lg:px-6 py-4 lg:py-6 ${
            shouldOpenUpward
              ? "bottom-full border-b-0 rounded-t-lg"
              : "top-full border-t-0 rounded-b-lg"
          }`}
        >
          <div>
            <h4 className="text-xs lg:text-sm font-medium text-gray-900 mb-3 lg:mb-4 flex items-center">
              <Upload className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
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

      {/* דיאלוג אישור מחיקה - Responsive */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 max-w-md w-full">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
              אישור מחיקה
            </h3>
            <p className="text-sm lg:text-base text-gray-600 mb-4 lg:mb-6">
              האם אתה בטוח שברצונך למחוק את ההזמנה "{order.orderNumber}"? פעולה
              זו לא ניתנת לביטול.
            </p>
            <div className="flex justify-end space-x-3 lg:space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 lg:px-4 py-1.5 lg:py-2 text-sm lg:text-base text-gray-600 hover:text-gray-800 transition-colors"
              >
                בטל
              </button>
              <button
                onClick={handleDelete}
                className="px-3 lg:px-4 py-1.5 lg:py-2 text-sm lg:text-base bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
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
