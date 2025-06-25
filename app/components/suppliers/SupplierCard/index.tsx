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
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  Upload,
  Package,
  Link,
  ExternalLink,
  Activity, // 🆕 אייקון לחיווי פעילות
  Circle, // 🆕 אייקון נקודה
} from "lucide-react";
import type { Supplier } from "@/types";
import FileUpload from "@/components/common/FileUpload";

interface SupplierCardProps {
  supplier: Supplier;
  rowIndex: number; // 🆕
  openSupplier: { id: string; type: "details" | "files"; row: number } | null; // 🆕
  setOpenSupplier: (
    value: { id: string; type: "details" | "files"; row: number } | null
  ) => void; // 🆕
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
  onArchive?: (supplierId: string) => void;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

// 🆕 Interface להזמנות פעילות
interface ActiveOrdersInfo {
  hasActiveOrders: boolean;
  activeOrdersCount: number;
  isLoading: boolean;
}

export default function SupplierCard({
  supplier,
  rowIndex,
  openSupplier,
  setOpenSupplier,
  onEdit,
  onDelete,
  onArchive,
}: SupplierCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // חישוב מצב פתוח/סגור מה-state המשותף
  const showDetails =
    openSupplier?.id === supplier.id &&
    openSupplier?.type === "details" &&
    openSupplier?.row === rowIndex;
  const showFiles =
    openSupplier?.id === supplier.id &&
    openSupplier?.type === "files" &&
    openSupplier?.row === rowIndex;

  const [isArchiving, setIsArchiving] = useState(false);
  const [showActiveOrders, setShowActiveOrders] = useState(false);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  // State למטבעות דינמיים
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(
    []
  );
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState(supplier.currency);

  // 🆕 State להזמנות פעילות
  const [activeOrdersInfo, setActiveOrdersInfo] = useState<ActiveOrdersInfo>({
    hasActiveOrders: false,
    activeOrdersCount: 0,
    isLoading: true,
  });

  // פונקציות לניהול פתיחה/סגירה
  const handleToggleDetails = () => {
    if (showDetails) {
      setOpenSupplier(null); // סגור
    } else {
      setOpenSupplier({ id: supplier.id, type: "details", row: rowIndex }); // פתח פרטים
    }
  };

  const handleToggleFiles = () => {
    if (showFiles) {
      setOpenSupplier(null); // סגור
    } else {
      setOpenSupplier({ id: supplier.id, type: "files", row: rowIndex }); // פתח מסמכים
    }
  };

  // טעינת מטבעות זמינים
  useEffect(() => {
    loadAvailableCurrencies();
  }, []);

  // 🆕 טעינת מידע על הזמנות פעילות
  useEffect(() => {
    loadActiveOrdersInfo();
  }, [supplier.id]);

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

  // 🆕 פונקציה לטעינת מידע על הזמנות פעילות
  const loadActiveOrdersInfo = async () => {
    try {
      setActiveOrdersInfo((prev) => ({ ...prev, isLoading: true }));

      const response = await fetch("/api/orders");
      if (response.ok) {
        const orders = await response.json();

        // סינון הזמנות פעילות של הספק הזה
        const filteredActiveOrders = orders.filter(
          (order: any) =>
            order.supplierId === supplier.id &&
            order.status !== "הושלם" &&
            order.status !== "מבוטלת"
        );

        setActiveOrders(filteredActiveOrders);
        setActiveOrdersInfo({
          hasActiveOrders: filteredActiveOrders.length > 0,
          activeOrdersCount: filteredActiveOrders.length,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Error loading active orders info:", error);
      setActiveOrdersInfo({
        hasActiveOrders: false,
        activeOrdersCount: 0,
        isLoading: false,
      });
    }
  };

  const loadAvailableCurrencies = async () => {
    try {
      const response = await fetch("/api/settings/currencies");
      if (response.ok) {
        const data = await response.json();
        setAvailableCurrencies(data.currencies);
      }
    } catch (error) {
      console.error("Error loading currencies:", error);
      setAvailableCurrencies([
        { code: "USD", name: "דולר אמריקני", symbol: "$" },
        { code: "EUR", name: "יורו", symbol: "€" },
        { code: "ILS", name: "שקל", symbol: "₪" },
        { code: "GBP", name: "פאונד", symbol: "£" },
      ]);
    }
  };

  const updateSupplierCurrency = async (newCurrency: string) => {
    if (newCurrency === currentCurrency) return;

    setIsUpdatingCurrency(true);
    try {
      const response = await fetch(`/api/suppliers/${supplier.id}/currency`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: newCurrency }),
      });

      if (response.ok) {
        setCurrentCurrency(newCurrency);
        supplier.currency = newCurrency;
      } else {
        console.error("Failed to update currency");
        setCurrentCurrency(supplier.currency);
      }
    } catch (error) {
      console.error("Error updating currency:", error);
      setCurrentCurrency(supplier.currency);
    } finally {
      setIsUpdatingCurrency(false);
    }
  };

  const getCurrencySymbol = (currencyCode: string) => {
    const currency = availableCurrencies.find((c) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

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

  // 🆕 רכיב החיווי
  const ActiveOrdersBadge = () => {
    if (activeOrdersInfo.isLoading) {
      return (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent mr-1"></div>
          בדיקה...
        </div>
      );
    }

    if (!activeOrdersInfo.hasActiveOrders) {
      return null;
    }

    return (
      <button
        onClick={() => setShowActiveOrders(!showActiveOrders)}
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 transition-colors cursor-pointer"
      >
        <Circle className="h-2 w-2 mr-1 fill-current animate-pulse" />
        {activeOrdersInfo.activeOrdersCount === 1
          ? "הזמנה פעילה"
          : `${activeOrdersInfo.activeOrdersCount} הזמנות פעילות`}
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
      {/* כותרת הכרטיס */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {supplier.name}
              </h3>

              {/* קטגוריות מוצרים */}
              {supplier.supplierCategories &&
                supplier.supplierCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {supplier.supplierCategories.map((sc) => (
                      <span
                        key={sc.id}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                          sc.category.name
                        )}`}
                        title={sc.category.description || sc.category.name}
                      >
                        <Package className="h-3 w-3 mr-1" />
                        {sc.category.name}
                      </span>
                    ))}
                  </div>
                )}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>
                  {supplier.city}, {supplier.country}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{supplier.email}</span>
              </div>
              {supplier.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.connection && (
                <div className="flex items-center space-x-2">
                  <Link className="h-4 w-4 text-gray-400" />
                  <button
                    onClick={() => openConnection(supplier.connection)}
                    className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                  >
                    <span>{supplier.connection}</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleFiles}
              disabled={showDetails}
              className={`p-2 rounded-md transition-colors ${
                showDetails
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
              title={showDetails ? "לא זמין כשפרטים נוספים פתוח" : "קבצים"}
            >
              <FileText className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(supplier)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="ערוך"
            >
              <Edit className="h-4 w-4" />
            </button>
            {onArchive && (
              <button
                onClick={handleArchive}
                disabled={isArchiving}
                className="p-2 text-orange-600 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-50"
                title="העבר לארכיון"
              >
                <Archive
                  className={`h-4 w-4 ${isArchiving ? "animate-pulse" : ""}`}
                />
              </button>
            )}
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
            {/* מקום 1: זמן עבודה - תמיד קיים */}
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {supplier.productionTimeWeeks || 0}+
                {supplier.shippingTimeWeeks || 0} שבועות
              </span>
            </div>

            {/* מקום 2: הזמנות פעילות - קבוע (גם אם ריק) */}
            <div className="min-w-[120px]">
              <ActiveOrdersBadge />
            </div>

            {/* מקום 3: מטבע - תמיד קיים */}
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 text-sm">
                {getCurrencySymbol(currentCurrency)} {currentCurrency}
              </span>
            </div>

            {/* מקום 4: מקדמה - תמיד קיים */}
            <span className="text-gray-600 text-sm">
              מקדמה{" "}
              {supplier.hasAdvancePayment ? supplier.advancePercentage : 0}%
            </span>
          </div>

          <button
            onClick={handleToggleDetails}
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
        <div className="absolute top-full left-0 right-0 bg-blue-50 border border-blue-300 border-t-0 rounded-b-lg shadow-lg z-20 px-6 pb-6">
          <div className="pt-4 space-y-4">
            {/* מידע על הזמנות פעילות */}
            {activeOrdersInfo.hasActiveOrders && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Activity className="h-4 w-4 ml-3 text-green-600" />
                  הזמנות פעילות
                </h4>
                <div className="bg-green-50 rounded-md p-3 border border-green-200">
                  <div className="space-y-3">
                    {activeOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-md p-3 border border-green-100"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-900">
                            הזמנה #{order.orderNumber}
                          </div>
                          <div className="text-green-700 font-medium text-sm">
                            {Number(order.totalAmount).toLocaleString("he-IL")}{" "}
                            {order.originalCurrency || "USD"}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
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

            {/* שורה ראשונה - זמני עבודה ורישיונות */}
            <div className="grid grid-cols-2 gap-4">
              {/* זמני עבודה */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Clock className="h-4 w-4 ml-3" />
                  זמני עבודה
                </h4>
                <div className="bg-gray-50 rounded-md p-3 space-y-2 text-sm">
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
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <FileText className="h-4 w-4 ml-3" />
                  רישיונות
                </h4>
                <div className="space-y-2 text-sm">
                  {supplier.importLicense && (
                    <div className="bg-green-50 rounded-md p-2 border border-green-200">
                      <div className="font-medium text-green-900">
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
                      <div className="font-medium text-purple-900">
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

            {/* שורה שנייה - מסמכים */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <Upload className="h-4 w-4 ml-3" />
                מסמכים מצורפים
              </h4>

              <div className="bg-orange-50 rounded-md p-3 border border-orange-200">
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
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  הערות
                </h4>
                <div className="bg-yellow-50 rounded-md p-3 text-sm text-yellow-800 border border-yellow-200">
                  {supplier.notes}
                </div>
              </div>
            )}

            {/* תאריכים בתחתית */}
            <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
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

      {/* תצוגת מסמכים - כרטיס סגור */}
      {showFiles && !showDetails && (
        <div className="absolute top-full left-0 right-0 bg-blue-50 border border-blue-200 border-t-0 rounded-b-lg shadow-lg z-20 px-6 pb-6">
          <div className="pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <Upload className="h-4 w-4 mr-2" />
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

      {/* דיאלוג אישור מחיקה */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              אישור מחיקה
            </h3>
            <p className="text-gray-600 mb-6">
              האם אתה בטוח שברצונך למחוק את הספק "{supplier.name}"? פעולה זו לא
              ניתנת לביטול.
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
