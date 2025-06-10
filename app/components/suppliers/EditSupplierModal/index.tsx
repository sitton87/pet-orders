"use client";

import { useState, useEffect } from "react";
import type { Supplier } from "@/types";

interface EditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditSupplier: (supplierId: string, supplierData: any) => void;
  supplier: Supplier | null;
}

export default function EditSupplierModal({
  isOpen,
  onClose,
  onEditSupplier,
  supplier,
}: EditSupplierModalProps) {
  const [formData, setFormData] = useState<Supplier>({
    id: "",
    name: "",
    country: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    contactPerson: "", // שונה מ-contactPerson
    contactPhone: "",
    contactPosition: "",
    productionTimeWeeks: 1,
    shippingTimeWeeks: 1,
    hasAdvancePayment: false,
    advancePercentage: 0,
    currency: "USD",
    importLicense: "",
    licenseExpiry: "",
    feedLicense: "",
    feedLicenseExpiry: "",
    bankName: "",
    beneficiary: "",
    iban: "",
    bic: "",
    createdAt: "",
    updatedAt: "",
    contactEmail: "",
    notes: "",
    paymentTerms: "",
    minimumOrder: 0,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // טעינת נתוני הספק כשהmodal נפתח
  useEffect(() => {
    if (supplier && isOpen) {
      setFormData({
        ...supplier,
        // וודא שהתאריכים מוצגים נכון
        licenseExpiry: supplier.licenseExpiry
          ? supplier.licenseExpiry.split("T")[0]
          : "",
        feedLicenseExpiry: supplier.feedLicenseExpiry
          ? supplier.feedLicenseExpiry.split("T")[0]
          : "",
      });
      setCurrentStep(1);
    }
  }, [supplier, isOpen]);

  const handleInputChange = (field: keyof Supplier, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!supplier) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // סימולציה

      onEditSupplier(supplier.id, formData);
      onClose();
    } catch (error) {
      console.error("שגיאה בעדכון ספק:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* כותרת */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              עריכת ספק: {supplier.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* מחוון צעדים */}
          <div className="mt-4 flex space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && <div className="w-12 h-1 bg-gray-200 mx-2"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* תוכן הטופס */}
        <div className="p-6">
          {/* שלב 1 - פרטי ספק בסיסיים */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">פרטי ספק בסיסיים</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם ספק <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="שם הספק"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    אימייל <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מדינה <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      handleInputChange("country", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="מדינה"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    עיר <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="עיר"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    כתובת
                  </label>
                  <input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="כתובת מלאה"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    טלפון
                  </label>
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="מספר טלפון"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מטבע <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      handleInputChange("currency", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD - דולר אמריקאי</option>
                    <option value="EUR">EUR - יורו</option>
                    <option value="GBP">GBP - לירה שטרלינג</option>
                    <option value="CNY">CNY - יואן סיני</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* שלב 2 - פרטי התקשרות */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">פרטי התקשרות</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    איש קשר
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson || ""}
                    onChange={(e) =>
                      handleInputChange("contactPerson", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="שם איש הקשר"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    טלפון איש קשר
                  </label>
                  <input
                    type="text"
                    value={formData.contactPhone || ""}
                    onChange={(e) =>
                      handleInputChange("contactPhone", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="מספר טלפון"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תפקיד איש קשר
                  </label>
                  <input
                    type="text"
                    value={formData.contactPosition || ""}
                    onChange={(e) =>
                      handleInputChange("contactPosition", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="תפקיד"
                  />
                </div>
              </div>
            </div>
          )}

          {/* שלב 3 - פרטי ייצור ותשלום */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">פרטי ייצור ותשלום</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    זמן ייצור (שבועות) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.productionTimeWeeks}
                    onChange={(e) =>
                      handleInputChange(
                        "productionTimeWeeks",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    זמן שילוח (שבועות) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.shippingTimeWeeks}
                    onChange={(e) =>
                      handleInputChange(
                        "shippingTimeWeeks",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasAdvancePayment}
                      onChange={(e) =>
                        handleInputChange("hasAdvancePayment", e.target.checked)
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      יש תשלום מקדמה
                    </span>
                  </label>
                </div>

                {formData.hasAdvancePayment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      אחוז מקדמה <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.advancePercentage || 0}
                      onChange={(e) =>
                        handleInputChange(
                          "advancePercentage",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="אחוז מקדמה"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* שלב 4 - מסמכים ובנק */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">מסמכים ופרטי בנק</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    רישיון ייבוא
                  </label>
                  <input
                    type="text"
                    value={formData.importLicense || ""}
                    onChange={(e) =>
                      handleInputChange("importLicense", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="מספר רישיון"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תוקף רישיון ייבוא
                  </label>
                  <input
                    type="date"
                    value={formData.licenseExpiry || ""}
                    onChange={(e) =>
                      handleInputChange("licenseExpiry", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    רישיון מספוא
                  </label>
                  <input
                    type="text"
                    value={formData.feedLicense || ""}
                    onChange={(e) =>
                      handleInputChange("feedLicense", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="מספר רישיון מספוא"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תוקף רישיון מספוא
                  </label>
                  <input
                    type="date"
                    value={formData.feedLicenseExpiry || ""}
                    onChange={(e) =>
                      handleInputChange("feedLicenseExpiry", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם בנק
                  </label>
                  <input
                    type="text"
                    value={formData.bankName || ""}
                    onChange={(e) =>
                      handleInputChange("bankName", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="שם הבנק"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מוטב
                  </label>
                  <input
                    type="text"
                    value={formData.beneficiary || ""}
                    onChange={(e) =>
                      handleInputChange("beneficiary", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="שם המוטב"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={formData.iban || ""}
                    onChange={(e) => handleInputChange("iban", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="IBAN"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BIC
                  </label>
                  <input
                    type="text"
                    value={formData.bic || ""}
                    onChange={(e) => handleInputChange("bic", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="BIC"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* כפתורי ניווט */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <div>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                ← חזור
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              ביטול
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={
                  !formData.name ||
                  !formData.email ||
                  !formData.country ||
                  !formData.city
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                המשך →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "מעדכן..." : "עדכן ספק"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
