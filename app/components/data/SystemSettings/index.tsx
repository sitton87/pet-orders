"use client";

import { useState } from "react";
import { Settings, Save, RotateCcw, Plus, Trash2, Edit } from "lucide-react";

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    orderStatuses: [
      "הוזמן מהספק",
      "בייצור",
      "נשלח",
      "הגיע לנמל",
      "במכס",
      "הושלם",
      "מבוטלת",
    ],
    currencies: [
      { code: "USD", name: "דולר אמריקני", symbol: "$" },
      { code: "EUR", name: "יורו", symbol: "€" },
      { code: "GBP", name: "לירה שטרלינג", symbol: "£" },
      { code: "CNY", name: "יואן סיני", symbol: "¥" },
      { code: "ILS", name: "שקל ישראלי", symbol: "₪" },
    ],
    defaultSettings: {
      defaultCurrency: "USD",
      defaultProductionTime: 4,
      defaultShippingTime: 2,
      defaultAdvancePercentage: 30,
    },
  });

  const [newStatus, setNewStatus] = useState("");
  const [newCurrency, setNewCurrency] = useState({
    code: "",
    name: "",
    symbol: "",
  });
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  const handleAddStatus = () => {
    if (
      newStatus.trim() &&
      !settings.orderStatuses.includes(newStatus.trim())
    ) {
      setSettings({
        ...settings,
        orderStatuses: [...settings.orderStatuses, newStatus.trim()],
      });
      setNewStatus("");
    }
  };

  const handleRemoveStatus = (status: string) => {
    setSettings({
      ...settings,
      orderStatuses: settings.orderStatuses.filter((s) => s !== status),
    });
  };

  const handleAddCurrency = () => {
    if (newCurrency.code && newCurrency.name && newCurrency.symbol) {
      setSettings({
        ...settings,
        currencies: [...settings.currencies, newCurrency],
      });
      setNewCurrency({ code: "", name: "", symbol: "" });
      setShowCurrencyModal(false);
    }
  };

  const handleRemoveCurrency = (code: string) => {
    setSettings({
      ...settings,
      currencies: settings.currencies.filter((c) => c.code !== code),
    });
  };

  const handleDefaultSettingsChange = (field: string, value: any) => {
    setSettings({
      ...settings,
      defaultSettings: {
        ...settings.defaultSettings,
        [field]: value,
      },
    });
  };

  const handleSaveSettings = () => {
    // כאן נשמור את ההגדרות ל-API או localStorage
    alert("הגדרות נשמרו בהצלחה!");
  };

  const handleResetSettings = () => {
    if (confirm("האם אתה בטוח שברצונך לאפס את כל ההגדרות לברירת מחדל?")) {
      // איפוס להגדרות ברירת מחדל
      alert("הגדרות אופסו לברירת מחדל");
    }
  };

  return (
    <div className="space-y-8">
      {/* כותרת */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">הגדרות מערכת</h2>
          <p className="text-sm text-gray-600 mt-1">
            ניהול הגדרות כלליות, סטטוסים ומטבעות
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleResetSettings}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>איפוס</span>
          </button>
          <button
            onClick={handleSaveSettings}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            <span>שמור הגדרות</span>
          </button>
        </div>
      </div>

      {/* סטטוסי הזמנות */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          סטטוסי הזמנות
        </h3>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="הוסף סטטוס חדש..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === "Enter" && handleAddStatus()}
            />
            <button
              onClick={handleAddStatus}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              הוסף
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {settings.orderStatuses.map((status, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white p-3 rounded border"
              >
                <span className="text-sm">{status}</span>
                <button
                  onClick={() => handleRemoveStatus(status)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* מטבעות */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">מטבעות</h3>
          <button
            onClick={() => setShowCurrencyModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>הוסף מטבע</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.currencies.map((currency) => (
            <div
              key={currency.code}
              className="flex items-center justify-between bg-white p-4 rounded border"
            >
              <div>
                <div className="font-medium">{currency.name}</div>
                <div className="text-sm text-gray-600">
                  {currency.code} ({currency.symbol})
                </div>
              </div>
              <button
                onClick={() => handleRemoveCurrency(currency.code)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* הגדרות ברירת מחדל */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          הגדרות ברירת מחדל
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מטבע ברירת מחדל
            </label>
            <select
              value={settings.defaultSettings.defaultCurrency}
              onChange={(e) =>
                handleDefaultSettingsChange("defaultCurrency", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {settings.currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              זמן ייצור ברירת מחדל (שבועות)
            </label>
            <input
              type="number"
              min="1"
              value={settings.defaultSettings.defaultProductionTime}
              onChange={(e) =>
                handleDefaultSettingsChange(
                  "defaultProductionTime",
                  parseInt(e.target.value)
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              זמן שילוח ברירת מחדל (שבועות)
            </label>
            <input
              type="number"
              min="1"
              value={settings.defaultSettings.defaultShippingTime}
              onChange={(e) =>
                handleDefaultSettingsChange(
                  "defaultShippingTime",
                  parseInt(e.target.value)
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              אחוז מקדמה ברירת מחדל (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={settings.defaultSettings.defaultAdvancePercentage}
              onChange={(e) =>
                handleDefaultSettingsChange(
                  "defaultAdvancePercentage",
                  parseInt(e.target.value)
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* מודל הוספת מטבע */}
      {showCurrencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">הוספת מטבע חדש</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  קוד מטבע *
                </label>
                <input
                  type="text"
                  value={newCurrency.code}
                  onChange={(e) =>
                    setNewCurrency({
                      ...newCurrency,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="USD"
                  maxLength={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם המטבע *
                </label>
                <input
                  type="text"
                  value={newCurrency.name}
                  onChange={(e) =>
                    setNewCurrency({ ...newCurrency, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="דולר אמריקני"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סמל המטבע *
                </label>
                <input
                  type="text"
                  value={newCurrency.symbol}
                  onChange={(e) =>
                    setNewCurrency({ ...newCurrency, symbol: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="$"
                  maxLength={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddCurrency}
                disabled={
                  !newCurrency.code || !newCurrency.name || !newCurrency.symbol
                }
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                הוסף
              </button>
              <button
                onClick={() => {
                  setShowCurrencyModal(false);
                  setNewCurrency({ code: "", name: "", symbol: "" });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
