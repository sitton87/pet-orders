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
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  Upload,
  Package,
  Link,
  ExternalLink,
} from "lucide-react";
import type { Supplier } from "@/types";
import FileUpload from "@/components/common/FileUpload";

interface SupplierCardProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export default function SupplierCard({
  supplier,
  onEdit,
  onDelete,
}: SupplierCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  // 🆕 State למטבעות דינמיים
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(
    []
  );
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState(supplier.currency);

  // 🔄 טעינת מטבעות זמינים
  useEffect(() => {
    loadAvailableCurrencies();
  }, []);

  const loadAvailableCurrencies = async () => {
    try {
      const response = await fetch("/api/settings/currencies");
      if (response.ok) {
        const data = await response.json();
        setAvailableCurrencies(data.currencies);
      }
    } catch (error) {
      console.error("Error loading currencies:", error);
      // מטבעות ברירת מחדל במקרה של שגיאה
      setAvailableCurrencies([
        { code: "USD", name: "דולר אמריקני", symbol: "$" },
        { code: "EUR", name: "יורו", symbol: "€" },
        { code: "ILS", name: "שקל", symbol: "₪" },
        { code: "GBP", name: "פאונד", symbol: "£" },
      ]);
    }
  };

  // 🔄 פונקציה לעדכון מטבע
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
        // עדכון האובייקט המקומי
        supplier.currency = newCurrency;
      } else {
        console.error("Failed to update currency");
        // החזרת המטבע הקודם במקרה של שגיאה
        setCurrentCurrency(supplier.currency);
      }
    } catch (error) {
      console.error("Error updating currency:", error);
      setCurrentCurrency(supplier.currency);
    } finally {
      setIsUpdatingCurrency(false);
    }
  };

  // 🎨 קבלת סמל המטבע
  const getCurrencySymbol = (currencyCode: string) => {
    const currency = availableCurrencies.find((c) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(supplier.id);
  };

  // פונקציה לקבלת צבע קטגוריה לפי hash של השם
  const getCategoryColor = (categoryName: string) => {
    // יצירת צבע ייחודי לפי hash של השם
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }

    // מערך צבעים יפים
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

  // פונקציה לבדיקה אם הקישור תקין
  const isValidUrl = (url?: string) => {
    if (!url) return false;
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  // פונקציה לפתיחת קישור
  const openConnection = (connection?: string) => {
    if (!connection) return;

    if (isValidUrl(connection)) {
      const url = connection.startsWith("http")
        ? connection
        : `https://${connection}`;
      window.open(url, "_blank");
    } else if (connection.includes("@")) {
      // אם זה מייל
      window.open(`mailto:${connection}`, "_blank");
    } else {
      // אם זה טלפון או משהו אחר
      navigator.clipboard.writeText(connection);
      alert("הועתק ללוח");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      {/* כותרת הכרטיס */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {supplier.name}
              </h3>
              {/* קטגוריות מוצרים - מרובות */}
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
              {/* קישור/חיבור */}
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
              onClick={() => setShowFiles(!showFiles)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="קבצים"
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
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {supplier.productionTimeWeeks || 0}+
                {supplier.shippingTimeWeeks || 0} שבועות
              </span>
            </div>

            {/* 🆕 Dropdown לעדכון מטבע */}
            <div className="flex items-center space-x-1 relative">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <select
                value={currentCurrency}
                onChange={(e) => updateSupplierCurrency(e.target.value)}
                disabled={isUpdatingCurrency}
                className={`text-gray-600 bg-transparent border-0 cursor-pointer text-sm pr-6 pl-1
                  ${
                    isUpdatingCurrency
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }
                  focus:outline-none focus:ring-1 focus:ring-blue-500 rounded`}
                title="שנה מטבע"
              >
                {availableCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code}
                  </option>
                ))}
              </select>
              {isUpdatingCurrency && (
                <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                </div>
              )}
            </div>

            {supplier.hasAdvancePayment && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                מקדמה {supplier.advancePercentage}%
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
            {/* קטגוריות וחיבור */}
            {((supplier.supplierCategories &&
              supplier.supplierCategories.length > 0) ||
              supplier.connection) && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  מידע כללי
                </h4>
                <div className="space-y-2">
                  {supplier.supplierCategories &&
                    supplier.supplierCategories.length > 0 && (
                      <div className="bg-gray-50 rounded-md p-3 text-sm">
                        <div className="flex items-start space-x-2">
                          <Package className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-2">
                              קטגוריות מוצרים:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {supplier.supplierCategories.map((sc) => (
                                <div
                                  key={sc.id}
                                  className={`px-2 py-1 rounded text-xs ${getCategoryColor(
                                    sc.category.name
                                  )}`}
                                >
                                  <div className="font-medium">
                                    {sc.category.name}
                                  </div>
                                  {sc.category.description && (
                                    <div className="text-xs opacity-75">
                                      {sc.category.description}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  {supplier.connection && (
                    <div className="bg-gray-50 rounded-md p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Link className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            קישור/חיבור:
                          </span>
                        </div>
                        <button
                          onClick={() => openConnection(supplier.connection)}
                          className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                        >
                          <span>{supplier.connection}</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* איש קשר */}
            {supplier.contactPerson && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  איש קשר
                </h4>
                <div className="bg-gray-50 rounded-md p-3 text-sm">
                  <div className="font-medium">{supplier.contactPerson}</div>
                  {supplier.contactPhone && (
                    <div className="text-gray-600">{supplier.contactPhone}</div>
                  )}
                </div>
              </div>
            )}

            {/* זמני עבודה */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                זמני עבודה
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-orange-50 rounded-md p-3">
                  <div className="font-medium text-orange-900">ייצור</div>
                  <div className="text-orange-700">
                    {supplier.productionTimeWeeks || 0} שבועות
                  </div>
                </div>
                <div className="bg-blue-50 rounded-md p-3">
                  <div className="font-medium text-blue-900">שילוח</div>
                  <div className="text-blue-700">
                    {supplier.shippingTimeWeeks || 0} שבועות
                  </div>
                </div>
              </div>
            </div>

            {/* תשלומים */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                תשלומים
              </h4>
              <div className="bg-gray-50 rounded-md p-3 text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span>מטבע:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {getCurrencySymbol(currentCurrency)} {currentCurrency}
                    </span>
                    {availableCurrencies.find(
                      (c) => c.code === currentCurrency
                    ) && (
                      <span className="text-xs text-gray-500">
                        (
                        {
                          availableCurrencies.find(
                            (c) => c.code === currentCurrency
                          )?.name
                        }
                        )
                      </span>
                    )}
                  </div>
                </div>
                {supplier.hasAdvancePayment ? (
                  <div className="flex justify-between items-center">
                    <span>מקדמה:</span>
                    <span className="font-medium text-green-600">
                      {supplier.advancePercentage}%
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-600">ללא מקדמה</div>
                )}
                {supplier.paymentTerms && (
                  <div className="mt-2 text-xs text-gray-600">
                    {supplier.paymentTerms}
                  </div>
                )}
              </div>
            </div>

            {/* רישיונות */}
            {(supplier.importLicense || supplier.feedLicense) && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  רישיונות
                </h4>
                <div className="space-y-2 text-sm">
                  {supplier.importLicense && (
                    <div className="bg-green-50 rounded-md p-3">
                      <div className="font-medium text-green-900">
                        רישיון יבוא
                      </div>
                      <div className="text-green-700">
                        {supplier.importLicense}
                      </div>
                      {supplier.licenseExpiry && (
                        <div className="text-xs text-green-600 mt-1">
                          תוקף עד:{" "}
                          {new Date(supplier.licenseExpiry).toLocaleDateString(
                            "he-IL"
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {supplier.feedLicense && (
                    <div className="bg-purple-50 rounded-md p-3">
                      <div className="font-medium text-purple-900">
                        רישיון מזון
                      </div>
                      <div className="text-purple-700">
                        {supplier.feedLicense}
                      </div>
                      {supplier.feedLicenseExpiry && (
                        <div className="text-xs text-purple-600 mt-1">
                          תוקף עד:{" "}
                          {new Date(
                            supplier.feedLicenseExpiry
                          ).toLocaleDateString("he-IL")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* הערות */}
            {supplier.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  הערות
                </h4>
                <div className="bg-yellow-50 rounded-md p-3 text-sm text-yellow-800">
                  {supplier.notes}
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
                  <div className="font-medium text-gray-900">נוצר</div>
                  <div className="text-gray-700">
                    {new Date(supplier.createdAt).toLocaleDateString("he-IL")}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-md p-3">
                  <div className="font-medium text-gray-900">עודכן</div>
                  <div className="text-gray-700">
                    {new Date(supplier.updatedAt).toLocaleDateString("he-IL")}
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
              entityId={supplier.id}
              entityType="supplier"
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
