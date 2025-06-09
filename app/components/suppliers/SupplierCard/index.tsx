"use client";

import { useState } from "react";
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
} from "lucide-react";
import type { Supplier } from "@/types";
import FileUpload from "@/components/common/FileUpload";

interface SupplierCardProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
}

export default function SupplierCard({
  supplier,
  onEdit,
  onDelete,
}: SupplierCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(supplier.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      {/* כותרת הכרטיס */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {supplier.name}
            </h3>
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
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{supplier.currency}</span>
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
            {/* איש קשר */}
            {supplier.contactName && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  איש קשר
                </h4>
                <div className="bg-gray-50 rounded-md p-3 text-sm">
                  <div className="font-medium">{supplier.contactName}</div>
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
                  <span className="font-medium">{supplier.currency}</span>
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
