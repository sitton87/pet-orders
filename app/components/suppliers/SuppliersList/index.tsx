// app/components/suppliers/SuppliersList/index.tsx - Responsive Update

"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Filter } from "lucide-react";
import SupplierCard from "../SupplierCard";
import AddSupplierModal from "../AddSupplierModal";
import EditSupplierModal from "../EditSupplierModal";
import type { Supplier } from "@/types";

// Interface לספק עם נתוני הזמנות
interface SupplierWithOrders extends Supplier {
  activeOrdersCount: number;
  hasActiveOrders: boolean;
  activeOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    originalCurrency?: string;
    etaFinal: string;
    createdAt: string;
  }>;
  totalActiveOrdersValue: number;
}

export default function SuppliersList() {
  const [suppliers, setSuppliers] = useState<SupplierWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // State לניהול חלונות פתוחים
  const [openSupplier, setOpenSupplier] = useState<{
    id: string;
    type: "details" | "files";
    row: number;
  } | null>(null);

  // טעינת ספקים עם נתוני הזמנות מה-API החדש
  useEffect(() => {
    fetchSuppliersWithOrders();
  }, []);

  // הסרת הודעות אחרי 3 שניות
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchSuppliersWithOrders = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("🔄 Fetching suppliers with orders data...");
      const response = await fetch("/api/suppliers-with-orders");

      if (!response.ok) {
        throw new Error(`שגיאה: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Received suppliers with orders:", data.meta);

      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error("Error fetching suppliers with orders:", err);
      setError(err instanceof Error ? err.message : "שגיאה בטעינת ספקים");
    } finally {
      setLoading(false);
    }
  };

  // פונקציה לרענון ספקים
  const refreshSuppliers = async () => {
    await fetchSuppliersWithOrders();
  };

  const handleArchiveSupplier = async (supplierId: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/archive`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to archive supplier");
      }

      const result = await response.json();
      setMessage({ type: "success", text: result.message });
      refreshSuppliers();
    } catch (error) {
      console.error("Error archiving supplier:", error);
      setMessage({ type: "error", text: "שגיאה בהעברה לארכיון" });
    }
  };

  const handleAddSupplier = async (supplierData: any) => {
    try {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        throw new Error("שגיאה בהוספת ספק");
      }

      await refreshSuppliers();
      setShowAddModal(false);
      setMessage({ type: "success", text: "ספק נוסף בהצלחה!" });
    } catch (err) {
      console.error("Error adding supplier:", err);
      setMessage({ type: "error", text: "שגיאה בהוספת ספק" });
    }
  };

  const handleEditSupplier = async (supplierId: string, supplierData: any) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        throw new Error("שגיאה בעדכון ספק");
      }

      await refreshSuppliers();
      setShowEditModal(false);
      setSelectedSupplier(null);
      setMessage({ type: "success", text: "ספק עודכן בהצלחה!" });
    } catch (err) {
      console.error("Error editing supplier:", err);
      setMessage({ type: "error", text: "שגיאה בעדכון ספק" });
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "שגיאה במחיקת ספק");
      }

      await refreshSuppliers();
      setMessage({ type: "success", text: "ספק נמחק בהצלחה!" });
    } catch (err) {
      console.error("Error deleting supplier:", err);
      const errorMessage =
        err instanceof Error ? err.message : "שגיאה במחיקת ספק";
      setMessage({ type: "error", text: errorMessage });
    }
  };

  const handleEditClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowEditModal(true);
  };

  // סינון ספקים
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCountry =
      !selectedCountry || supplier.country === selectedCountry;

    return matchesSearch && matchesCountry;
  });

  // רשימת מדינות ייחודיות לסינון
  const uniqueCountries = [
    ...new Set(suppliers.map((supplier) => supplier.country)),
  ].sort();

  // סטטיסטיקות מהירות
  const stats = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter((s) => s.hasActiveOrders).length,
    totalActiveOrders: suppliers.reduce(
      (sum, s) => sum + s.activeOrdersCount,
      0
    ),
    filteredCount: filteredSuppliers.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">
          טוען ספקים עם נתוני הזמנות...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refreshSuppliers}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* הודעות */}
      {message && (
        <div
          className={`p-3 lg:p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* כותרת, חיפוש, סינון וכפתור הוספה - בשורה אחת */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 lg:gap-4">
        {/* כותרת */}
        <div className="flex-shrink-0">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
            רשימת ספקים ({stats.totalSuppliers})
          </h2>
          <div className="text-xs lg:text-sm text-gray-600 mt-1 space-y-1">
            <p>
              {stats.activeSuppliers} ספקים פעילים • {stats.totalActiveOrders}{" "}
              הזמנות פעילות
            </p>
            {filteredSuppliers.length !== suppliers.length && (
              <p className="text-blue-600">
                מוצגים {stats.filteredCount} מתוך {stats.totalSuppliers} ספקים
              </p>
            )}
          </div>
        </div>

        {/* אזור מרכזי - חיפוש וסינון */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          {/* חיפוש */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="חיפוש ספקים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* סינון מדינות */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-0 w-32"
            >
              <option value="">כל המדינות</option>
              {uniqueCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* כפתור הוספה */}
        <div className="flex-shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">הוסף ספק</span>
            <span className="sm:hidden">הוסף</span>
          </button>
        </div>
      </div>

      {/* רשימת ספקים - 🆕 Responsive Grid */}
      {filteredSuppliers.length === 0 ? (
        <div className="text-center py-8 lg:py-12">
          <p className="text-gray-500 text-base lg:text-lg mb-4">
            {searchTerm || selectedCountry
              ? "לא נמצאו ספקים התואמים לחיפוש"
              : "אין ספקים במערכת"}
          </p>
          {!searchTerm && !selectedCountry && (
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm lg:text-base"
            >
              הוסף ספק ראשון
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredSuppliers.map((supplier, index) => {
            // חישוב מספר השורה בהתאם למסך
            // במסכים קטנים: 1 בשורה, במסכים בינוניים: 2 בשורה, במסכים גדולים: 3 בשורה
            const getRowIndex = () => {
              if (window.innerWidth >= 1536) {
                // 2xl
                return Math.floor(index / 3);
              } else if (window.innerWidth >= 1024) {
                // lg
                return Math.floor(index / 2);
              } else {
                // sm and below
                return index; // כל כרטיס בשורה נפרדת
              }
            };

            return (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                rowIndex={getRowIndex()}
                openSupplier={openSupplier}
                setOpenSupplier={setOpenSupplier}
                onEdit={handleEditClick}
                onArchive={handleArchiveSupplier}
                onDelete={handleDeleteSupplier}
                activeOrders={supplier.activeOrders}
                activeOrdersCount={supplier.activeOrdersCount}
                hasActiveOrders={supplier.hasActiveOrders}
              />
            );
          })}
        </div>
      )}

      {/* מודלים */}
      {showAddModal && (
        <AddSupplierModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddSupplier={handleAddSupplier}
        />
      )}

      {showEditModal && selectedSupplier && (
        <EditSupplierModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSupplier(null);
          }}
          onEditSupplier={handleEditSupplier}
          supplier={{
            ...selectedSupplier,
            productionTimeWeeks: selectedSupplier.productionTimeWeeks || 1,
            shippingTimeWeeks: selectedSupplier.shippingTimeWeeks || 1,
            updatedAt: selectedSupplier.updatedAt || selectedSupplier.createdAt,
            contactPerson: selectedSupplier.contactPerson || "",
            contactEmail: selectedSupplier.contactEmail || "",
            notes: selectedSupplier.notes || "",
            paymentTerms: selectedSupplier.paymentTerms || "",
            minimumOrder: selectedSupplier.minimumOrder || 0,
            importLicense: selectedSupplier.importLicense || "",
            licenseExpiry: selectedSupplier.licenseExpiry || "",
            feedLicense: selectedSupplier.feedLicense || "",
            feedLicenseExpiry: selectedSupplier.feedLicenseExpiry || "",
            bankName: selectedSupplier.bankName || "",
            beneficiary: selectedSupplier.beneficiary || "",
            iban: selectedSupplier.iban || "",
            bic: selectedSupplier.bic || "",
            contactPosition: selectedSupplier.contactPosition || "",
            contactPhone: selectedSupplier.contactPhone || "",
            address: selectedSupplier.address || "",
            phone: selectedSupplier.phone || "",
            advancePercentage: selectedSupplier.advancePercentage || 0,
          }}
        />
      )}
    </div>
  );
}
