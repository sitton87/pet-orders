"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Filter } from "lucide-react";
import SupplierCard from "../SupplierCard";
import AddSupplierModal from "../AddSupplierModal";
import EditSupplierModal from "../EditSupplierModal";
import type { Supplier } from "@/types";

export default function SuppliersList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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

  // טעינת ספקים מה-API
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // הסרת הודעות אחרי 3 שניות
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/suppliers");

      if (!response.ok) {
        throw new Error(`שגיאה: ${response.status}`);
      }

      const data = await response.json();
      // אם יש suppliers במבנה data.suppliers
      if (data.suppliers) {
        setSuppliers(data.suppliers);
      } else {
        // אם data עצמו הוא המערך
        setSuppliers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError(err instanceof Error ? err.message : "שגיאה בטעינת ספקים");
    } finally {
      setLoading(false);
    }
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
      alert(result.message);
      fetchSuppliers(); // רענן את הרשימה
    } catch (error) {
      console.error("Error archiving supplier:", error);
      throw error;
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

      await fetchSuppliers(); // רענן את הרשימה
      setShowAddModal(false);
      setMessage({ type: "success", text: "ספק נוסף בהצלחה!" });
    } catch (err) {
      console.error("Error adding supplier:", err);
      setMessage({ type: "error", text: "שגיאה בהוספת ספק" });
    }
  };

  const handleEditSupplier = async (supplierId: string, supplierData: any) => {
    try {
      const response = await fetch(`/api/suppliers?id=${supplierId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        throw new Error("שגיאה בעדכון ספק");
      }

      await fetchSuppliers(); // רענן את הרשימה
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
      const response = await fetch(`/api/suppliers?id=${supplierId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "שגיאה במחיקת ספק");
      }

      await fetchSuppliers(); // רענן את הרשימה
      setMessage({ type: "success", text: "ספק נמחק בהצלחה!" });
    } catch (err) {
      console.error("Error deleting supplier:", err);
      // הצג את ההודעה הספציפית מהשרת
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">טוען ספקים...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchSuppliers}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* הודעות */}
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* כותרת וכפתור הוספה */}
      <div className="flex flex-col flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            רשימת ספקים ({suppliers.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredSuppliers.length !== suppliers.length &&
              `מוצגים ${filteredSuppliers.length} מתוך ${suppliers.length} ספקים`}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>הוסף ספק</span>
        </button>
      </div>

      {/* חיפוש וסינונים */}
      <div className="flex flex-col flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, מדינה, עיר או אימייל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* רשימת ספקים */}
      {filteredSuppliers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            {searchTerm || selectedCountry
              ? "לא נמצאו ספקים התואמים לחיפוש"
              : "אין ספקים במערכת"}
          </p>
          {!searchTerm && !selectedCountry && (
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              הוסף ספק ראשון
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onEdit={handleEditClick}
              onArchive={handleArchiveSupplier}
              onDelete={handleDeleteSupplier}
            />
          ))}
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
            // וודא שכל השדות הנדרשים קיימים
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
