"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Archive,
  ChevronDown,
  ChevronUp,
  FileText,
  Upload,
  Package,
  Link,
  ExternalLink,
  Activity,
  Circle,
} from "lucide-react";
import type { Supplier } from "@/types";
import FileUpload from "@/components/common/FileUpload";

interface SupplierCardProps {
  supplier: Supplier;
  rowIndex: number;
  openSupplier: { id: string; type: "details" | "files"; row: number } | null;
  setOpenSupplier: (
    value: { id: string; type: "details" | "files"; row: number } | null
  ) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
  onArchive?: (supplierId: string) => void;
  activeOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    originalCurrency?: string;
    etaFinal: string;
  }>;
  activeOrdersCount: number;
  hasActiveOrders: boolean;
}

export default function SupplierCard({
  supplier,
  rowIndex,
  openSupplier,
  setOpenSupplier,
  onEdit,
  onDelete,
  onArchive,
  activeOrders,
  activeOrdersCount,
  hasActiveOrders,
}: SupplierCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showActiveOrders, setShowActiveOrders] = useState(false);

  // חישוב מצב פתוח/סגור מה-state המשותף
  const showDetails =
    openSupplier?.id === supplier.id &&
    openSupplier?.type === "details" &&
    openSupplier?.row === rowIndex;
  const showFiles =
    openSupplier?.id === supplier.id &&
    openSupplier?.type === "files" &&
    openSupplier?.row === rowIndex;

  // השתמש בנתונים שהועברו
  const activeOrdersInfo = {
    hasActiveOrders,
    activeOrdersCount,
    isLoading: false,
  };

  // פונקציות לניהול פתיחה/סגירה
  const handleToggleDetails = () => {
    if (showDetails) {
      setOpenSupplier(null);
    } else {
      setOpenSupplier({ id: supplier.id, type: "details", row: rowIndex });
    }
  };

  const handleToggleFiles = () => {
    if (showFiles) {
      setOpenSupplier(null);
    } else {
      setOpenSupplier({ id: supplier.id, type: "files", row: rowIndex });
    }
  };

  // טיפול במקש ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && (showDetails || showFiles)) {
        setOpenSupplier(null);
      }
    };

    if (showDetails || showFiles) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showDetails, showFiles, setOpenSupplier]);

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(supplier.id);
  };

  const getCategoryColor = (categoryName: string) => {
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-red-100 text-red-800",
      "bg-yellow-100 text-yellow-800",
      "bg-indigo-100 text-indigo-800",
      "bg-pink-100 text-pink-800",
      "bg-orange-100 text-orange-800",
    ];

    return colors[Math.abs(hash) % colors.length];
  };

  const isValidUrl = (url?: string) => {
    if (!url) return false;
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const openConnection = (connection?: string) => {
    if (!connection) return;

    if (isValidUrl(connection)) {
      const url = connection.startsWith("http")
        ? connection
        : `https://${connection}`;
      window.open(url, "_blank");
    } else if (connection.includes("@")) {
      window.open(`mailto:${connection}`, "_blank");
    } else {
      navigator.clipboard.writeText(connection);
      alert("הועתק ללוח");
    }
  };

  const handleArchive = async () => {
    if (!onArchive) return;

    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך להעביר את "${supplier.name}" לארכיון?\n\n` +
        "הספק יוסתר מהמערכת אך ההזמנות שלו יישמרו.\n" +
        "ניתן לשחזר אותו בעתיד מדף הארכיון."
    );

    if (confirmed) {
      setIsArchiving(true);
      try {
        await onArchive(supplier.id);
      } catch (error) {
        console.error("Archive error:", error);
        alert("שגיאה בהעברה לארכיון");
      } finally {
        setIsArchiving(false);
      }
    }
  };

  // רכיב החיווי - Responsive
  const ActiveOrdersBadge = () => {
    if (activeOrdersInfo.isLoading) {
      return (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent mr-1"></div>
          <span className="hidden sm:inline">בדיקה...</span>
          <span className="sm:hidden">...</span>
        </div>
      );
    }

    if (!activeOrdersInfo.hasActiveOrders) {
      return null;
    }

    return (
      <button
        onClick={() => setShowActiveOrders(!showActiveOrders)}
        className="inline-flex items-center px-2 lg:px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 transition-colors cursor-pointer"
      >
        <Circle className="h-2 w-2 mr-1 fill-current animate-pulse flex-shrink-0" />
        <span className="truncate">
          {activeOrdersInfo.activeOrdersCount === 1
            ? "הזמנה פעילה"
            : `${activeOrdersInfo.activeOrdersCount} הזמנות פעילות`}
        </span>
      </button>
    );
  };

  return (
    <div
      className={`rounded-lg shadow-md border transition-all duration-200 hover:shadow-lg ${
        showDetails
          ? "bg-blue-50 border-blue-300 shadow-blue-100 relative z-10"
          : showFiles
          ? "bg-blue-50 border-blue-200 shadow-blue-50 relative z-10"
          : activeOrdersInfo.hasActiveOrders
          ? "bg-white border-green-200 shadow-green-50"
          : "bg-white border-gray-200"
      }`}
    >
      {/* כותרת הכרטיס - Responsive */}
      <div className="p-4 lg:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 truncate">
                {supplier.name}
              </h3>

              {/* קטגוריות מוצרים - Responsive */}
              {supplier.supplierCategories &&
                supplier.supplierCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {supplier.supplierCategories.slice(0, 2).map((sc) => (
                      <span
                        key={sc.id}
                        className={`inline-flex items-center px-2 lg:px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                          sc.category.name
                        )}`}
                        title={sc.category.description || sc.category.name}
                      >
                        <Package className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{sc.category.name}</span>
                      </span>
                    ))}
                    {supplier.supplierCategories.length > 2 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{supplier.supplierCategories.length - 2}
                      </span>
                    )}
                  </div>
                )}
            </div>

            {/* פרטי יצירת קשר - Responsive */}
            <div className="space-y-1 lg:space-y-2 text-xs lg:text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <MapPin className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {supplier.city}, {supplier.country}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{supplier.email}</span>
              </div>
              {supplier.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{supplier.phone}</span>
                </div>
              )}
              {supplier.connection && (
                <div className="flex items-center space-x-2">
                  <Link className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400 flex-shrink-0" />
                  <button
                    onClick={() => openConnection(supplier.connection)}
                    className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-1 min-w-0"
                  >
                    <span className="truncate">{supplier.connection}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </button>
                </div>
              )}
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
              onClick={() => onEdit(supplier)}
              className="p-1.5 lg:p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="ערוך"
            >
              <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
            </button>
            {onArchive && (
              <button
                onClick={handleArchive}
                disabled={isArchiving}
                className="p-1.5 lg:p-2 text-orange-600 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-50"
                title="העבר לארכיון"
              >
                <Archive
                  className={`h-3 w-3 lg:h-4 lg:w-4 ${
                    isArchiving ? "animate-pulse" : ""
                  }`}
                />
              </button>
            )}
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
            {/* זמן עבודה */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
              <span className="text-gray-600 whitespace-nowrap">
                {supplier.productionTimeWeeks || 0}+
                {supplier.shippingTimeWeeks || 0} שבועות
              </span>
            </div>

            {/* הזמנות פעילות */}
            <div className="flex-shrink-0">
              <ActiveOrdersBadge />
            </div>

            {/* מטבע */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
              <span className="text-gray-600">{supplier.currency}</span>
            </div>

            {/* מקדמה */}
            <span className="text-gray-600 whitespace-nowrap">
              מקדמה{" "}
              {supplier.hasAdvancePayment ? supplier.advancePercentage : 0}%
            </span>
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
        <div className="absolute top-full left-0 right-0 bg-blue-50 border border-blue-300 border-t-0 rounded-b-lg shadow-lg z-20 px-4 lg:px-6 pb-4 lg:pb-6">
          <div className="pt-3 lg:pt-4 space-y-3 lg:space-y-4">
            {/* מידע על הזמנות פעילות */}
            {activeOrdersInfo.hasActiveOrders && (
              <div>
                <h4 className="text-xs lg:text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Activity className="h-3 w-3 lg:h-4 lg:w-4 ml-2 lg:ml-3 text-green-600" />
                  הזמנות פעילות
                </h4>
                <div className="bg-green-50 rounded-md p-2 lg:p-3 border border-green-200">
                  <div className="space-y-2 lg:space-y-3">
                    {activeOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-md p-2 lg:p-3 border border-green-100"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 lg:mb-2">
                          <div className="font-medium text-gray-900 text-xs lg:text-sm">
                            הזמנה #{order.orderNumber}
                          </div>
                          <div className="text-green-700 font-medium text-xs lg:text-sm">
                            {Number(order.totalAmount).toLocaleString("he-IL")}{" "}
                            {order.originalCurrency || "USD"}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 lg:gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">סטטוס:</span>{" "}
                            {order.status}
                          </div>
                          <div>
                            <span className="font-medium">
                              תאריך הגעה רצוי:
                            </span>{" "}
                            {order.etaFinal
                              ? new Date(order.etaFinal).toLocaleDateString(
                                  "he-IL"
                                )
                              : "לא צוין"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* זמני עבודה ורישיונות - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
              {/* זמני עבודה */}
              <div>
                <h4 className="text-xs lg:text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Clock className="h-3 w-3 lg:h-4 lg:w-4 ml-2 lg:ml-3" />
                  זמני עבודה
                </h4>
                <div className="bg-gray-50 rounded-md p-2 lg:p-3 space-y-1 lg:space-y-2 text-xs lg:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ייצור:</span>
                    <span className="font-medium text-orange-700">
                      {supplier.productionTimeWeeks || 0} שבועות
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">שילוח:</span>
                    <span className="font-medium text-blue-700">
                      {supplier.shippingTimeWeeks || 0} שבועות
                    </span>
                  </div>
                </div>
              </div>

              {/* רישיונות */}
              <div>
                <h4 className="text-xs lg:text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <FileText className="h-3 w-3 lg:h-4 lg:w-4 ml-2 lg:ml-3" />
                  רישיונות
                </h4>
                <div className="space-y-1 lg:space-y-2 text-xs lg:text-sm">
                  {supplier.importLicense && (
                    <div className="bg-green-50 rounded-md p-2 border border-green-200">
                      <div className="font-medium text-green-900 text-xs">
                        🟢 יבוא: {supplier.importLicense}
                      </div>
                      {supplier.licenseExpiry && (
                        <div className="text-xs text-green-600">
                          תוקף עד:{" "}
                          {new Date(supplier.licenseExpiry).toLocaleDateString(
                            "he-IL"
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {supplier.feedLicense && (
                    <div className="bg-purple-50 rounded-md p-2 border border-purple-200">
                      <div className="font-medium text-purple-900 text-xs">
                        🟣 מזון: {supplier.feedLicense}
                      </div>
                      {supplier.feedLicenseExpiry && (
                        <div className="text-xs text-purple-600">
                          תוקף עד:{" "}
                          {new Date(
                            supplier.feedLicenseExpiry
                          ).toLocaleDateString("he-IL")}
                        </div>
                      )}
                    </div>
                  )}
                  {!supplier.importLicense && !supplier.feedLicense && (
                    <div className="text-gray-500 text-xs">
                      אין רישיונות רשומים
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* מסמכים */}
            <div>
              <h4 className="text-xs lg:text-sm font-medium text-gray-900 mb-2 flex items-center">
                <Upload className="h-3 w-3 lg:h-4 lg:w-4 ml-2 lg:ml-3" />
                מסמכים מצורפים
              </h4>
              <div className="bg-orange-50 rounded-md p-2 lg:p-3 border border-orange-200">
                <FileUpload
                  entityId={supplier.id}
                  entityType="supplier"
                  onFilesChange={(files) => {
                    console.log("Files updated:", files);
                  }}
                />
              </div>
            </div>

            {/* הערות */}
            {supplier.notes && (
              <div>
                <h4 className="text-xs lg:text-sm font-medium text-gray-900 mb-2">
                  הערות
                </h4>
                <div className="bg-yellow-50 rounded-md p-2 lg:p-3 text-xs lg:text-sm text-yellow-800 border border-yellow-200">
                  {supplier.notes}
                </div>
              </div>
            )}

            {/* תאריכים */}
            <div className="mt-3 lg:mt-4 pt-2 lg:pt-3 border-t border-gray-200 text-xs text-gray-500 flex flex-col sm:flex-row sm:justify-between gap-1">
              <span>
                נוצר: {new Date(supplier.createdAt).toLocaleDateString("he-IL")}
              </span>
              <span>
                עודכן:{" "}
                {new Date(supplier.updatedAt).toLocaleDateString("he-IL")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* תצוגת מסמכים - Responsive */}
      {showFiles && !showDetails && (
        <div className="absolute top-full left-0 right-0 bg-blue-50 border border-blue-200 border-t-0 rounded-b-lg shadow-lg z-20 px-4 lg:px-6 pb-4 lg:pb-6">
          <div className="pt-3 lg:pt-4">
            <h4 className="text-xs lg:text-sm font-medium text-gray-900 mb-3 lg:mb-4 flex items-center">
              <Upload className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
              מסמכים מצורפים
            </h4>
            <FileUpload
              entityId={supplier.id}
              entityType="supplier"
              onFilesChange={(files) => {
                console.log("Files viewed:", files);
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
              האם אתה בטוח שברצונך למחוק את הספק "{supplier.name}"? פעולה זו לא
              ניתנת לביטול.
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
