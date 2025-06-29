"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Supplier } from "@/types";

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (orderData: any) => void;
  suppliers: Supplier[];
}

interface OrderFormData {
  supplierId: string;
  etaFinal: string;
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
}

export default function AddOrderModal({
  isOpen,
  onClose,
  onAddOrder,
  suppliers,
}: AddOrderModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OrderFormData>({
    supplierId: "",
    etaFinal: "",
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
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );

  // 🆕 פונקציה ליצירת קיצור ספק אוטומטי
  const generateSupplierPrefix = (supplierName: string): string => {
    // ניקוי רווחים מיותרים ופיצול למילים
    const words = supplierName
      .trim()
      .split(/[\s\-]+/)
      .filter((word) => word.length > 0);
    if (words.length === 1) {
      // מילה אחת → 4 אותיות ראשונות
      return words[0].substring(0, 4).toUpperCase();
    } else if (words.length === 2) {
      // שתי מילים → 2 אותיות מכל מילה
      return (
        words[0].substring(0, 2) + words[1].substring(0, 2)
      ).toUpperCase();
    } else {
      // 3+ מילים → 2 מהראשונה, 1 מהשנייה, 1 מהשלישית
      return (
        words[0].substring(0, 2) +
        words[1].substring(0, 1) +
        words[2].substring(0, 1)
      ).toUpperCase();
    }
  };

  // 🆕 פונקציה ליצירת מספר הזמנה חכם
  const generateOrderNumber = async (): Promise<string> => {
    if (!selectedSupplier) {
      throw new Error("No supplier selected");
    }

    try {
      // קבלת ספירת הזמנות השנה הנוכחית
      const currentYear = new Date().getFullYear();
      const response = await fetch(`/api/orders/count?year=${currentYear}`);

      let orderCount = 0;
      if (response.ok) {
        const data = await response.json();
        orderCount = data.count || 0;
      } else {
        console.warn("Failed to fetch order count, using fallback");
      }

      // יצירת רכיבי מספר ההזמנה
      const supplierPrefix = generateSupplierPrefix(selectedSupplier.name);
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0"); // 01-12
      const year = String(now.getFullYear()).slice(-2); // 25, 26, etc.
      const sequentialNumber = String(orderCount + 1).padStart(3, "0"); // 001, 002, etc.

      return `${supplierPrefix}-${month}${year}-${sequentialNumber}`;
    } catch (error) {
      console.error("Error generating order number:", error);
      // fallback למספר הזמנה פשוט במקרה של שגיאה
      return `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    }
  };

  // עדכון ספק נבחר
  useEffect(() => {
    if (formData.supplierId) {
      const supplier = suppliers.find((s) => s.id === formData.supplierId);
      setSelectedSupplier(supplier || null);
      if (supplier) {
        setFormData((prev) => ({
          ...prev,
          originalCurrency: supplier.currency,
        }));
      }
    }
  }, [formData.supplierId, suppliers]);

  // חישוב אוטומטי של מקדמה ותשלום סופי
  useEffect(() => {
    if (selectedSupplier && formData.totalAmount > 0) {
      if (
        selectedSupplier.hasAdvancePayment &&
        selectedSupplier.advancePercentage
      ) {
        const advanceAmount =
          (formData.totalAmount * selectedSupplier.advancePercentage) / 100;
        const finalPaymentAmount = formData.totalAmount - advanceAmount;

        setFormData((prev) => ({
          ...prev,
          advanceAmount,
          finalPaymentAmount,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          advanceAmount: 0,
          finalPaymentAmount: formData.totalAmount,
        }));
      }
    }
  }, [selectedSupplier, formData.totalAmount]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("Amount") ||
        name.includes("Rate") ||
        name.includes("Cost")
          ? parseFloat(value) || 0
          : value,
    }));

    // מחיקת שגיאה כשמתחילים להקליד
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1:
        if (!formData.supplierId) newErrors.supplierId = "יש לבחור ספק";
        if (!formData.etaFinal) newErrors.etaFinal = "יש להזין תאריך הגעה רצוי";
        if (formData.totalAmount <= 0)
          newErrors.totalAmount = "יש להזין סכום תקין";
        break;
      case 2:
        if (formData.exchangeRate <= 0)
          newErrors.exchangeRate = "יש להזין שער חליפין תקין";
        break;
      case 3:
        // בדיקות אופציונליות לשלב 3
        break;
      case 4:
        // בדיקות אופציונליות לשלב 4
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      try {
        // 🆕 יצירת מספר הזמנה חכם
        const orderNumber = await generateOrderNumber();

        const orderData = {
          ...formData,
          orderNumber,
          status: "הכנת הזמנה",
        };

        onAddOrder(orderData);
        handleClose();
      } catch (error) {
        console.error("Error creating order:", error);
        alert("שגיאה ביצירת מספר הזמנה. נסה שוב.");
      }
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      supplierId: "",
      etaFinal: "",
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
    });
    setErrors({});
    setSelectedSupplier(null);
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">פרטי הזמנה בסיסיים</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ספק *
        </label>
        <select
          name="supplierId"
          value={formData.supplierId}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.supplierId ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">בחר ספק</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name} - {supplier.country}
            </option>
          ))}
        </select>
        {errors.supplierId && (
          <p className="text-red-500 text-sm mt-1">{errors.supplierId}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          תאריך הגעה רצוי*
        </label>
        <input
          type="date"
          name="etaFinal"
          value={formData.etaFinal}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.etaFinal ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.etaFinal && (
          <p className="text-red-500 text-sm mt-1">{errors.etaFinal}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          סכום כולל ({formData.originalCurrency}) *
        </label>
        <input
          type="number"
          name="totalAmount"
          value={formData.totalAmount}
          onChange={handleInputChange}
          placeholder="0.00"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.totalAmount ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.totalAmount && (
          <p className="text-red-500 text-sm mt-1">{errors.totalAmount}</p>
        )}
      </div>

      {/* 🆕 תצוגת מספר הזמנה חזוי */}
      {selectedSupplier && (
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>פרטי ספק:</strong>
            <br />
            זמן ייצור: {selectedSupplier.productionTimeWeeks} שבועות
            <br />
            זמן שילוח: {selectedSupplier.shippingTimeWeeks} שבועות
            <br />
            {selectedSupplier.hasAdvancePayment && (
              <>
                מקדמה נדרשת: {selectedSupplier.advancePercentage}%<br />
              </>
            )}
            <strong>מספר הזמנה חזוי:</strong>{" "}
            {generateSupplierPrefix(selectedSupplier.name)}-
            {String(new Date().getMonth() + 1).padStart(2, "0")}
            {String(new Date().getFullYear()).slice(-2)}-XXX
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">פרטים כספיים</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          שער חליפין (₪ ל-{formData.originalCurrency})
        </label>
        <input
          type="number"
          name="exchangeRate"
          value={formData.exchangeRate}
          onChange={handleInputChange}
          step="0.01"
          placeholder="3.70"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.exchangeRate ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.exchangeRate && (
          <p className="text-red-500 text-sm mt-1">{errors.exchangeRate}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            מקדמה ({formData.originalCurrency})
          </label>
          <input
            type="number"
            name="advanceAmount"
            value={formData.advanceAmount}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly={selectedSupplier?.hasAdvancePayment}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            תשלום סופי ({formData.originalCurrency})
          </label>
          <input
            type="number"
            name="finalPaymentAmount"
            value={formData.finalPaymentAmount}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly={selectedSupplier?.hasAdvancePayment}
          />
        </div>
      </div>

      <div className="bg-green-50 p-3 rounded-md">
        <p className="text-sm text-green-700">
          <strong>סיכום כספי:</strong>
          <br />
          סכום כולל: {formData.totalAmount.toLocaleString()}{" "}
          {formData.originalCurrency}
          <br />
          בשקלים: ₪
          {(formData.totalAmount * formData.exchangeRate).toLocaleString()}
          <br />
          מקדמה: {formData.advanceAmount.toLocaleString()}{" "}
          {formData.originalCurrency}
          <br />
          תשלום סופי: {formData.finalPaymentAmount.toLocaleString()}{" "}
          {formData.originalCurrency}
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">פרטי שילוח ומכס</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          מספר קונטיינר
        </label>
        <input
          type="text"
          name="containerNumber"
          value={formData.containerNumber}
          onChange={handleInputChange}
          placeholder="MSKU1234567"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          עלות שחרור נמל (₪)
        </label>
        <input
          type="number"
          name="portReleaseCost"
          value={formData.portReleaseCost}
          onChange={handleInputChange}
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          חברת עמילות
        </label>
        <select
          name="customsCompanyId"
          value={formData.customsCompanyId}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">בחר חברת עמילות</option>
          <option value="1">עמילות ישראל</option>
          <option value="2">מכס וילונות</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          עמיל מכס
        </label>
        <select
          name="customsAgentId"
          value={formData.customsAgentId}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">בחר עמיל מכס</option>
          <option value="1">משה כהן</option>
          <option value="2">דינה לוי</option>
        </select>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">הערות וסיכום</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          הערות
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows={4}
          placeholder="הערות נוספות על ההזמנה..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-semibold mb-2">סיכום הזמנה:</h4>
        <div className="space-y-1 text-sm">
          <p>
            <strong>ספק:</strong> {selectedSupplier?.name}
          </p>
          <p>
            <strong>תאריך הגעה:</strong> {formData.etaFinal}
          </p>
          <p>
            <strong>סכום כולל:</strong> {formData.totalAmount.toLocaleString()}{" "}
            {formData.originalCurrency}
          </p>
          <p>
            <strong>מקדמה:</strong> {formData.advanceAmount.toLocaleString()}{" "}
            {formData.originalCurrency}
          </p>
          <p>
            <strong>תשלום סופי:</strong>{" "}
            {formData.finalPaymentAmount.toLocaleString()}{" "}
            {formData.originalCurrency}
          </p>
          {formData.containerNumber && (
            <p>
              <strong>קונטיינר:</strong> {formData.containerNumber}
            </p>
          )}
          {/* 🆕 הצגת מספר הזמנה חזוי */}
          {selectedSupplier && (
            <p>
              <strong>מספר הזמנה חזוי:</strong>{" "}
              {generateSupplierPrefix(selectedSupplier.name)}-
              {String(new Date().getMonth() + 1).padStart(2, "0")}
              {String(new Date().getFullYear()).slice(-2)}-XXX
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">הוספת הזמנה חדשה</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step <= currentStep
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 text-gray-400"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>פרטי בסיס</span>
            <span>כספים</span>
            <span>שילוח ומכס</span>
            <span>סיכום</span>
          </div>
        </div>

        <div className="p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`px-4 py-2 rounded-md ${
              currentStep === 1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-600 text-white hover:bg-gray-700"
            }`}
          >
            הקודם
          </button>

          <div className="flex space-x-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              ביטול
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                הבא
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                צור הזמנה
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
