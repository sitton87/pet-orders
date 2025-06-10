"use client";

import { useState, useEffect } from "react";
import {
  Archive,
  RotateCcw,
  Search,
  MapPin,
  Calendar,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import type { Supplier } from "@/types";

export default function ArchiveManagement() {
  const [archivedSuppliers, setArchivedSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadArchivedSuppliers();
  }, []);

  const loadArchivedSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/suppliers/archive");
      if (response.ok) {
        const data = await response.json();
        setArchivedSuppliers(data);
      }
    } catch (error) {
      console.error("Error loading archived suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (supplierId: string, supplierName: string) => {
    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך לשחזר את "${supplierName}" מהארכיון?\n\nהספק יחזור להיות פעיל במערכת.`
    );

    if (!confirmed) return;

    setRestoring(supplierId);
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/restore`, {
        method: "PATCH",
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        loadArchivedSuppliers();
      } else {
        throw new Error("Failed to restore supplier");
      }
    } catch (error) {
      console.error("Error restoring supplier:", error);
      alert("שגיאה בשחזור ספק");
    } finally {
      setRestoring(null);
    }
  };

  const handleDeletePermanently = async (
    supplierId: string,
    supplierName: string
  ) => {
    const confirmed = window.confirm(
      `⚠️ אזהרה: מחיקה סופית!\n\n` +
        `האם אתה בטוח לחלוטין שברצונך למחוק את "${supplierName}" לצמיתות?\n\n` +
        `פעולה זו תמחק:\n` +
        `• את הספק לחלוטין\n` +
        `• את כל ההזמנות שלו\n` +
        `• את כל הקבצים הקשורים\n` +
        `• את כל הקשרים לקטגוריות\n\n` +
        `לא ניתן לשחזר את הנתונים לאחר מחיקה!`
    );

    if (!confirmed) return;

    // אישור נוסף למחיקה סופית
    const userInput = prompt(
      `הקלד "מחק" כדי לאשר מחיקה סופית של "${supplierName}":`
    );

    if (userInput !== "מחק") {
      alert("המחיקה בוטלה - טקסט לא תואם");
      return;
    }

    setDeleting(supplierId);
    try {
      const response = await fetch(
        `/api/suppliers/${supplierId}/delete-permanently`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        loadArchivedSuppliers();
      } else {
        throw new Error("Failed to delete supplier permanently");
      }
    } catch (error) {
      console.error("Error deleting supplier permanently:", error);
      alert("שגיאה במחיקה סופית");
    } finally {
      setDeleting(null);
    }
  };

  const filteredSuppliers = archivedSuppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Archive className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              ארכיון ספקים
            </h2>
            <p className="text-gray-600">
              ספקים שהועברו לארכיון - ניתן לשחזר או למחוק לצמיתות
            </p>
          </div>
        </div>
        <button
          onClick={loadArchivedSuppliers}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>רענן</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="חפש ספק בארכיון..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm ? "לא נמצאו ספקים התואמים לחיפוש" : "אין ספקים בארכיון"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            נמצאו {filteredSuppliers.length} ספקים בארכיון
          </div>

          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {supplier.name}
                  </h3>
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {supplier.city}, {supplier.country}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500 mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      הועבר לארכיון:{" "}
                      {new Date(supplier.updatedAt).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* כפתור שחזור */}
                  <button
                    onClick={() => handleRestore(supplier.id, supplier.name)}
                    disabled={restoring === supplier.id}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
                    title="שחזר מארכיון"
                  >
                    <RotateCcw
                      className={`h-4 w-4 ${
                        restoring === supplier.id ? "animate-spin" : ""
                      }`}
                    />
                    <span className="text-sm">שחזר</span>
                  </button>

                  {/* כפתור מחיקה סופית */}
                  <button
                    onClick={() =>
                      handleDeletePermanently(supplier.id, supplier.name)
                    }
                    disabled={deleting === supplier.id}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center space-x-1"
                    title="מחק לצמיתות"
                  >
                    <Trash2
                      className={`h-4 w-4 ${
                        deleting === supplier.id ? "animate-pulse" : ""
                      }`}
                    />
                    <span className="text-sm">מחק לצמיתות</span>
                  </button>
                </div>
              </div>

              {/* מידע נוסף */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                {supplier.email && <div>📧 {supplier.email}</div>}
                {supplier.phone && <div>📞 {supplier.phone}</div>}
                {supplier.contactPerson && (
                  <div>👤 {supplier.contactPerson}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
