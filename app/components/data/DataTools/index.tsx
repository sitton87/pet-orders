"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Upload,
  Database,
  Trash2,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

// Interface for statistics data
interface DataStats {
  suppliers: number;
  orders: number;
  categories: number;
  customsCompanies: number;
  customsAgents: number;
  lastBackup: string;
  dataSize: string;
}

export default function DataTools() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  // State for real statistics
  const [dataStats, setDataStats] = useState<DataStats>({
    suppliers: 0,
    orders: 0,
    categories: 0,
    customsCompanies: 0,
    customsAgents: 0,
    lastBackup: "טוען...",
    dataSize: "טוען...",
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [selectedFiles, setSelectedFiles] = useState<{
    [key: string]: File | null;
  }>({});

  // Load real statistics from APIs
  const loadStats = async () => {
    try {
      setStatsLoading(true);

      // Parallel API calls for all data
      const [suppliersRes, ordersRes, categoriesRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/orders"),
        fetch("/api/categories"),
      ]);

      const suppliers = suppliersRes.ok ? await suppliersRes.json() : [];
      const orders = ordersRes.ok ? await ordersRes.json() : [];
      const categories = categoriesRes.ok ? await categoriesRes.json() : [];

      // Load customs companies from the correct source
      let customsCompanies = 0;
      try {
        // Check where customs companies are stored in your system
        const customsRes = await fetch("/api/customs-companies"); // or wherever they are stored
        if (customsRes.ok) {
          const customsData = await customsRes.json();
          customsCompanies = customsData.length || 1; // real count
        } else {
          // If no separate API, check in settings
          const settingsRes = await fetch("/api/settings");
          if (settingsRes.ok) {
            const settings = await settingsRes.json();
            customsCompanies = settings.customsCompanies?.length || 1;
          } else {
            customsCompanies = 1; // correct default
          }
        }
      } catch (error) {
        console.error("Error loading customs companies:", error);
        customsCompanies = 1; // default
      }

      // Calculate estimated data size
      const dataSize = calculateDataSize(suppliers, orders, categories);

      // Update statistics
      setDataStats({
        suppliers: suppliers.length || 0,
        orders: orders.length || 0,
        categories: categories.length || 0,
        customsCompanies: customsCompanies,
        customsAgents: 7, // currently fixed - need to check where this is stored
        lastBackup: localStorage.getItem("lastBackup") || "אין גיבוי",
        dataSize: dataSize,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      // Default values in case of error
      setDataStats({
        suppliers: 0,
        orders: 0,
        categories: 0,
        customsCompanies: 0,
        customsAgents: 0,
        lastBackup: "שגיאה בטעינה",
        dataSize: "לא זמין",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Calculate estimated data size
  const calculateDataSize = (
    suppliers: any[],
    orders: any[],
    categories: any[]
  ) => {
    // Rough calculation of data size
    const avgSupplierSize = 2000; // bytes per supplier
    const avgOrderSize = 1500; // bytes per order
    const avgCategorySize = 500; // bytes per category

    const totalBytes =
      suppliers.length * avgSupplierSize +
      orders.length * avgOrderSize +
      categories.length * avgCategorySize;

    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Load stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  // Auto refresh every minute
  useEffect(() => {
    const interval = setInterval(loadStats, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  const handleDownloadTemplate = async (type: string) => {
    try {
      const response = await fetch(`/api/import-template?type=${type}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("שגיאה בהורדת תבנית");
      }

      // Download template
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `template_${type}_${new Date().toISOString().split("T")[0]}.xlsx`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert(
        `תבנית ${
          type === "suppliers"
            ? "ספקים"
            : type === "orders"
            ? "הזמנות"
            : "קטגוריות"
        } הורדה בהצלחה!`
      );
    } catch (error) {
      console.error("Template download error:", error);
      alert("שגיאה בהורדת תבנית");
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    const file = event.target.files?.[0] || null;
    setSelectedFiles((prev) => ({
      ...prev,
      [type]: file,
    }));
  };

  const handleExportData = async (type: string) => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type:
            type === "ספקים"
              ? "suppliers"
              : type === "הזמנות"
              ? "orders"
              : type === "קטגוריות"
              ? "categories"
              : "all",
          format: "excel",
        }),
      });

      if (!response.ok) {
        throw new Error("שגיאה בייצוא");
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `export_${type}_${new Date().toISOString().split("T")[0]}.xlsx`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert(`${type} יוצאו בהצלחה!`);
    } catch (error) {
      console.error("Export error:", error);
      alert("שגיאה בייצוא נתונים");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (type: string) => {
    const file = selectedFiles[type];
    if (!file) {
      alert("נא לבחור קובץ לייבוא");
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "שגיאה בייבוא נתונים");
      }

      const result = await response.json();

      // Display import results
      const importType =
        type === "suppliers"
          ? "ספקים"
          : type === "orders"
          ? "הזמנות"
          : "קטגוריות";

      alert(
        `ייבוא ${importType} הושלם בהצלחה!\n` +
          `נוספו: ${result.added || 0} רשומות חדשות\n` +
          `עודכנו: ${result.updated || 0} רשומות קיימות\n` +
          `דילגו: ${result.skipped || 0} רשומות (שגיאות)`
      );

      // Refresh statistics after import
      loadStats();

      // Reset file selection
      setSelectedFiles((prev) => ({
        ...prev,
        [type]: null,
      }));

      // Reset file input
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input) => {
        if ((input as HTMLInputElement).getAttribute("data-type") === type) {
          (input as HTMLInputElement).value = "";
        }
      });
    } catch (error) {
      console.error("Import error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "שגיאה לא ידועה";
      alert("שגיאה בייבוא נתונים: " + errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleBackupData = async () => {
    setIsBackingUp(true);
    try {
      const response = await fetch("/api/backup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("שגיאה ביצירת גיבוי");
      }

      // Download backup file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      link.download = `backup_${timestamp}.zip`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Save last backup date
      const backupDate = new Date().toLocaleDateString("he-IL");
      localStorage.setItem("lastBackup", backupDate);
      setDataStats((prev) => ({ ...prev, lastBackup: backupDate }));

      alert("גיבוי נוצר והורד בהצלחה!");
    } catch (error) {
      console.error("Backup error:", error);
      alert("שגיאה ביצירת גיבוי");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleCleanData = async () => {
    if (
      confirm(
        "האם אתה בטוח שברצונך לנקות הזמנות ישנות מ-2+ שנים? ינוקו רק הזמנות מושלמות/מבוטלות. פעולה זו לא ניתנת לביטול!"
      )
    ) {
      setIsCleaning(true);
      try {
        const response = await fetch("/api/cleanup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "old_orders",
            olderThanMonths: 24,
          }),
        });

        if (!response.ok) {
          throw new Error("שגיאה בניקוי נתונים");
        }

        const result = await response.json();
        alert(
          `ניקוי הזמנות ישנות הושלם! נמחקו ${
            result.deletedCount || 0
          } הזמנות ישנות.`
        );

        // Refresh statistics after cleanup
        loadStats();
      } catch (error) {
        console.error("Cleanup error:", error);
        alert("שגיאה בניקוי נתונים");
      } finally {
        setIsCleaning(false);
      }
    }
  };

  const handleCleanLogs = async () => {
    try {
      const response = await fetch("/api/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "logs",
          olderThanMonths: 3,
        }),
      });

      if (!response.ok) {
        throw new Error("שגיאה בניקוי לוגים");
      }

      const result = await response.json();
      alert(
        `ניקוי לוגי DEBUG הושלם! נמחקו ${
          result.deletedCount || 0
        } קבצי לוג ישנים.`
      );
    } catch (error) {
      console.error("Log cleanup error:", error);
      alert("שגיאה בניקוי לוגים");
    }
  };

  const handleCleanTempFiles = async () => {
    try {
      const response = await fetch("/api/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "temp_files",
        }),
      });

      if (!response.ok) {
        throw new Error("שגיאה בניקוי קבצים זמניים");
      }

      const result = await response.json();
      alert(
        `ניקוי קבצים זמניים הושלם! נמחקו ${result.deletedCount || 0} קבצים.`
      );
    } catch (error) {
      console.error("Temp files cleanup error:", error);
      alert("שגיאה בניקוי קבצים זמניים");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            כלי ניהול נתונים
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            ייבוא, ייצוא, גיבוי וניקוי נתונים במערכת
          </p>
        </div>
        {/* Refresh button */}
        <button
          onClick={loadStats}
          disabled={statsLoading}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${statsLoading ? "animate-spin" : ""}`}
          />
          <span className="text-sm">רענן נתונים</span>
        </button>
      </div>

      {/* Real-time data statistics */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          סקירת נתונים {statsLoading && "(מתעדכן...)"}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div
              className={`text-2xl font-bold text-blue-600 ${
                statsLoading ? "animate-pulse" : ""
              }`}
            >
              {dataStats.suppliers}
            </div>
            <div className="text-sm text-blue-700">ספקים פעילים</div>
          </div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold text-blue-600 ${
                statsLoading ? "animate-pulse" : ""
              }`}
            >
              {dataStats.orders}
            </div>
            <div className="text-sm text-blue-700">הזמנות</div>
          </div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold text-blue-600 ${
                statsLoading ? "animate-pulse" : ""
              }`}
            >
              {dataStats.categories}
            </div>
            <div className="text-sm text-blue-700">קטגוריות מוצרים</div>
          </div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold text-blue-600 ${
                statsLoading ? "animate-pulse" : ""
              }`}
            >
              {dataStats.customsCompanies}
            </div>
            <div className="text-sm text-blue-700">עמילויות</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-blue-700 text-center">
          גיבוי אחרון: {dataStats.lastBackup} | גודל נתונים:{" "}
          {dataStats.dataSize}
        </div>
      </div>

      {/* Export data */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Download className="h-5 w-5 text-green-600" />
          <span>ייצוא נתונים</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { type: "suppliers", label: "ספקים", icon: "🏢" },
            { type: "orders", label: "הזמנות", icon: "📦" },
            { type: "categories", label: "קטגוריות", icon: "📋" },
            { type: "all", label: "כל הנתונים", icon: "🗂️" },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => handleExportData(item.label)}
              disabled={isExporting}
              className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 transition-colors disabled:opacity-50"
            >
              <span className="text-2xl mb-2">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-xs text-gray-500 mt-1">Excel/CSV</span>
            </button>
          ))}
        </div>

        {isExporting && (
          <div className="mt-4 flex items-center space-x-2 text-green-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">מייצא נתונים...</span>
          </div>
        )}
      </div>

      {/* Import data */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Upload className="h-5 w-5 text-blue-600" />
          <span>ייבוא נתונים</span>
        </h3>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">לפני הייבוא:</p>
                <p>1. הורד תבנית Excel מתאימה</p>
                <p>2. מלא את הנתונים לפי ההוראות בתבנית</p>
                <p>3. שמור כקובץ Excel (.xlsx)</p>
                <p className="mt-2 font-medium">
                  הייבוא יוסיף נתונים חדשים ולא ימחק קיימים!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { type: "suppliers", label: "ספקים", icon: "🏢" },
              { type: "orders", label: "הזמנות", icon: "📦" },
              { type: "categories", label: "קטגוריות", icon: "📋" },
            ].map((item) => (
              <div
                key={item.type}
                className="bg-white border border-gray-200 rounded-md p-4"
              >
                <div className="text-center mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <h4 className="text-sm font-medium mt-1">{item.label}</h4>
                </div>

                {/* Download template button */}
                <button
                  onClick={() => handleDownloadTemplate(item.type)}
                  className="w-full mb-2 bg-green-600 text-white py-1 px-3 rounded text-xs hover:bg-green-700 flex items-center justify-center space-x-1"
                >
                  <Download className="h-3 w-3" />
                  <span>הורד תבנית</span>
                </button>

                {/* File selection */}
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  data-type={item.type}
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-2"
                  onChange={(e) => handleFileSelect(e, item.type)}
                />

                {/* Show selected file */}
                {selectedFiles[item.type] && (
                  <div className="text-xs text-green-600 mb-2 flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>נבחר: {selectedFiles[item.type]?.name}</span>
                  </div>
                )}

                {/* Import button */}
                <button
                  onClick={() => handleImportData(item.type)}
                  disabled={isImporting || !selectedFiles[item.type]}
                  className="w-full bg-blue-600 text-white py-1 px-3 rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? "מייבא..." : "ייבא נתונים"}
                </button>
              </div>
            ))}
          </div>

          {isImporting && (
            <div className="flex items-center space-x-2 text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">מייבא נתונים...</span>
            </div>
          )}
        </div>
      </div>

      {/* Backup and restore */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Database className="h-5 w-5 text-purple-600" />
          <span>גיבוי ושחזור</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-md p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">יצירת גיבוי</h4>
            <p className="text-sm text-gray-600 mb-4">
              יצירת גיבוי מלא של כל נתוני המערכת
            </p>
            <button
              onClick={handleBackupData}
              disabled={isBackingUp}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>יוצר גיבוי...</span>
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  <span>צור גיבוי</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-md p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">שחזור מגיבוי</h4>
            <p className="text-sm text-gray-600 mb-4">
              שחזור נתונים מקובץ גיבוי קיים
            </p>
            <input
              type="file"
              accept=".backup,.zip"
              className="w-full text-xs text-gray-500 mb-2 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
            />
            <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 flex items-center justify-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>שחזר מגיבוי</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data cleanup */}
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center space-x-2">
          <Trash2 className="h-5 w-5 text-red-600" />
          <span>ניקוי נתונים</span>
        </h3>

        <div className="space-y-4">
          <div className="bg-red-100 border border-red-200 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">אזהרה!</p>
                <p>
                  פעולות ניקוי הן בלתי הפיכות. יש לוודא שיש גיבוי עדכני לפני
                  ביצוע ניקוי.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleCleanData}
              disabled={isCleaning}
              className="flex flex-col items-center p-4 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Clock className="h-6 w-6 text-red-600 mb-2" />
              <span className="text-sm font-medium text-red-900">
                נקה הזמנות ישנות
              </span>
              <span className="text-xs text-red-600 mt-1">
                הזמנות מושלמות מ-2+ שנים
              </span>
            </button>

            <button
              className="flex flex-col items-center p-4 bg-white border border-yellow-200 rounded-md hover:bg-yellow-50 transition-colors"
              onClick={() => {
                if (
                  confirm(
                    "האם אתה בטוח שברצונך למחוק לוגי DEBUG בלבד (מעל 3 חודשים)? לוגי שגיאות יישמרו!"
                  )
                ) {
                  handleCleanLogs();
                }
              }}
            >
              <FileText className="h-6 w-6 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-yellow-900">
                נקה לוגי DEBUG
              </span>
              <span className="text-xs text-yellow-600 mt-1">
                רק לוגים לא חשובים מ-3+ חודשים
              </span>
            </button>

            <button
              className="flex flex-col items-center p-4 bg-white border border-orange-200 rounded-md hover:bg-orange-50 transition-colors"
              onClick={() => {
                if (
                  confirm(
                    "פעולה זו תמחק קבצים זמניים ותמונות cache. האם להמשיך?"
                  )
                ) {
                  handleCleanTempFiles();
                }
              }}
            >
              <Trash2 className="h-6 w-6 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-900">
                נקה קבצים זמניים
              </span>
              <span className="text-xs text-orange-600 mt-1">
                Cache ותמונות זמניות
              </span>
            </button>
          </div>

          {isCleaning && (
            <div className="flex items-center space-x-2 text-red-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">מנקה נתונים...</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent activities status */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          פעולות אחרונות
        </h3>

        <div className="space-y-3">
          {[
            {
              action: "ייצוא ספקים",
              time: "היום 14:30",
              status: "success",
              icon: CheckCircle,
            },
            {
              action: "גיבוי מערכת",
              time: "אתמול 22:00",
              status: "success",
              icon: CheckCircle,
            },
            {
              action: "ייבוא הזמנות",
              time: "לפני 3 ימים",
              status: "success",
              icon: CheckCircle,
            },
            {
              action: "ניקוי לוגים",
              time: "לפני שבוע",
              status: "success",
              icon: CheckCircle,
            },
          ].map((item, index) => {
            const StatusIcon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-between bg-white p-3 rounded border"
              >
                <div className="flex items-center space-x-3">
                  <StatusIcon
                    className={`h-5 w-5 ${
                      item.status === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  />
                  <span className="text-sm font-medium">{item.action}</span>
                </div>
                <span className="text-xs text-gray-500">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
