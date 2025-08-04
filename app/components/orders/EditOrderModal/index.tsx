"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Order, Supplier } from "@/types";

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrder: (orderData: any) => void;
  order: Order | null;
  suppliers: Supplier[];
  customsCompanies: CustomsCompany[];
  customsAgents: CustomsAgent[];
}

interface OrderFormData {
  id: string;
  supplierId: string;
  etaFinal: string;
  status: string;
  totalAmount: number;
  advanceAmount: number;
  finalPaymentAmount: number;
  exchangeRate: number;
  containerNumber: string;
  customsCompanyId: string;
  customsAgentId: string;
  notes: string;
  portReleaseCost: number;
  originalCurrency: string;
  actualEta: string;
}

interface CustomsCompany {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  agents: CustomsAgent[];
  createdAt: string;
  updatedAt: string;
}

interface CustomsAgent {
  id: string;
  name: string;
  phone: string;
  position: string;
  customsCompanyId: string;
  customsCompany?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function EditOrderModal({
  isOpen,
  onClose,
  onUpdateOrder,
  order,
  suppliers,
  customsCompanies,
  customsAgents,
}: EditOrderModalProps) {
  // 🆕 הוסף State עבור סטטוסים
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);

  const [formData, setFormData] = useState<OrderFormData>({
    id: "",
    supplierId: "",
    etaFinal: "",
    status: "",
    totalAmount: 0,
    advanceAmount: 0,
    finalPaymentAmount: 0,
    exchangeRate: 1,
    containerNumber: "",
    customsCompanyId: "",
    customsAgentId: "",
    notes: "",
    portReleaseCost: 0,
    originalCurrency: "USD",
    actualEta: "",
  });

  // 🆕 useEffect לטעינת סטטוסים
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const response = await fetch("/api/settings/statuses");
        if (response.ok) {
          const data = await response.json();
          console.log("Loaded statuses:", data.statuses); // debug
          setAvailableStatuses(data.statuses || []);
        } else {
          console.error("Failed to load statuses");
        }
      } catch (error) {
        console.error("Error loading statuses:", error);
      }
    };
    loadStatuses();
  }, []);

  useEffect(() => {
    if (order) {
      const etaFinalFormatted = order.etaFinal
        ? new Date(order.etaFinal).toISOString().split("T")[0]
        : "";

      const actualEtaFormatted = order.actualEta
        ? new Date(order.actualEta).toISOString().split("T")[0]
        : "";

      setFormData({
        id: order.id,
        supplierId: order.supplierId,
        etaFinal: etaFinalFormatted,
        status: order.status,
        totalAmount: order.totalAmount,
        advanceAmount: order.advanceAmount || 0,
        finalPaymentAmount: order.finalPaymentAmount || 0,
        exchangeRate: order.exchangeRate || 1,
        containerNumber: order.containerNumber || "",
        customsCompanyId: order.customsCompanyId || "",
        customsAgentId: order.customsAgentId || "",
        notes: order.notes || "",
        portReleaseCost: order.portReleaseCost || 0,
        originalCurrency: order.originalCurrency || "USD",
        actualEta: actualEtaFormatted || etaFinalFormatted,
      });
    }
  }, [order]);

  const handleInputChange = (field: keyof OrderFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (supplier) {
      setFormData((prev) => {
        const newData = {
          ...prev,
          supplierId,
          originalCurrency: supplier.currency,
        };

        // חישוב אוטומטי של סכומי תשלום
        if (
          supplier.hasAdvancePayment &&
          supplier.advancePercentage &&
          newData.totalAmount > 0
        ) {
          const advanceAmount =
            (newData.totalAmount * supplier.advancePercentage) / 100;
          const finalAmount = newData.totalAmount - advanceAmount;
          return {
            ...newData,
            advanceAmount,
            finalPaymentAmount: finalAmount,
          };
        } else {
          return {
            ...newData,
            advanceAmount: 0,
            finalPaymentAmount: newData.totalAmount,
          };
        }
      });
    }
  };

  const handleTotalAmountChange = (amount: number) => {
    const supplier = suppliers.find((s) => s.id === formData.supplierId);

    setFormData((prev) => {
      if (
        supplier?.hasAdvancePayment &&
        supplier.advancePercentage &&
        amount > 0
      ) {
        const advanceAmount = (amount * supplier.advancePercentage) / 100;
        const finalAmount = amount - advanceAmount;
        return {
          ...prev,
          totalAmount: amount,
          advanceAmount,
          finalPaymentAmount: finalAmount,
        };
      } else {
        return {
          ...prev,
          totalAmount: amount,
          advanceAmount: 0,
          finalPaymentAmount: amount,
        };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOrder(formData);
  };

  if (!isOpen || !order) return null;

  const selectedSupplier = suppliers.find((s) => s.id === formData.supplierId);

  // Debug logs
  console.log("Debugging form data:");
  console.log("supplierId:", formData.supplierId);
  console.log("etaFinal:", formData.etaFinal);
  console.log("status:", formData.status);
  console.log("totalAmount:", formData.totalAmount);
  console.log("Available statuses:", availableStatuses);
  console.log(
    "Button should be disabled:",
    !formData.supplierId ||
      !formData.etaFinal ||
      !formData.status ||
      formData.totalAmount <= 0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            עריכת הזמנה {order.orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[70vh]">
          <div className="p-6 space-y-6">
            {/* פרטים בסיסיים */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                פרטים בסיסיים
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ספק <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">בחר ספק</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סטטוס <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      console.log("Status changed to:", e.target.value);
                      handleInputChange("status", e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">בחר סטטוס</option>
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תאריך הגעה רצוי<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.etaFinal}
                    onChange={(e) =>
                      handleInputChange("etaFinal", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    עדכון תאריך - חברת עמילות
                  </label>
                  <input
                    type="date"
                    value={formData.actualEta}
                    onChange={(e) =>
                      handleInputChange("actualEta", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="עדכון תאריך - חברת עמילות"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מטבע
                  </label>
                  <input
                    type="text"
                    value={
                      selectedSupplier?.currency || formData.originalCurrency
                    }
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* פרטי תשלום */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                פרטי תשלום
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סכום כולל <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalAmount}
                    onChange={(e) =>
                      handleTotalAmountChange(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שער חליפין
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.exchangeRate}
                    onChange={(e) =>
                      handleInputChange(
                        "exchangeRate",
                        parseFloat(e.target.value) || 1
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סכום מקדמה (מחושב אוטומטית)
                  </label>
                  <input
                    type="number"
                    value={formData.advanceAmount}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תשלום סופי (מחושב אוטומטית)
                  </label>
                  <input
                    type="number"
                    value={formData.finalPaymentAmount}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                פרטים נוספים
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מספר מכולה
                  </label>
                  <input
                    type="text"
                    value={formData.containerNumber}
                    onChange={(e) =>
                      handleInputChange("containerNumber", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="MSCU1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    עלות שחרור בנמל
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.portReleaseCost}
                    onChange={(e) =>
                      handleInputChange(
                        "portReleaseCost",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="סכום בשקלים"
                  />
                </div>

                {/* חברת עמילות דינמית */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    חברת עמילות
                  </label>
                  <select
                    value={formData.customsCompanyId}
                    onChange={(e) => {
                      handleInputChange("customsCompanyId", e.target.value);
                      // איפוס סוכן המכס כשמשנים חברה
                      handleInputChange("customsAgentId", "");
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">בחר חברת עמילות</option>
                    {customsCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* סוכן מכס דינמי - מסונן לפי חברה נבחרת */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סוכן מכס
                  </label>
                  <select
                    value={formData.customsAgentId}
                    onChange={(e) =>
                      handleInputChange("customsAgentId", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.customsCompanyId}
                  >
                    <option value="">
                      {!formData.customsCompanyId
                        ? "בחר חברת עמילות תחילה"
                        : "בחר סוכן מכס"}
                    </option>
                    {customsAgents
                      .filter(
                        (agent) =>
                          agent.customsCompanyId === formData.customsCompanyId
                      )
                      .map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} - {agent.position}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    הערות
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="הערות נוספות על ההזמנה..."
                  />
                </div>
              </div>
            </div>

            {/* מידע הספק */}
            {selectedSupplier && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  פרטי ספק
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  זמן ייצור: {selectedSupplier.productionTimeWeeks} שבועות
                  <br />
                  זמן שילוח: {selectedSupplier.shippingTimeWeeks} שבועות
                  <br />
                  <p>
                    תשלום:{" "}
                    {selectedSupplier.hasAdvancePayment
                      ? `${selectedSupplier.advancePercentage}% מקדמה`
                      : "תשלום מלא"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* כפתורי פעולה */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={
                !formData.supplierId ||
                !formData.etaFinal ||
                !formData.status?.trim() ||
                formData.totalAmount <= 0
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              שמור שינויים
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
