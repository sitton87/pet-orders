"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Loader2,
} from "lucide-react";

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    order_statuses: [] as string[],
    currencies: [] as Currency[],
    default_currency: "USD",
    default_production_time: 4,
    default_shipping_time: 2,
    default_advance_percentage: 30,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newCurrency, setNewCurrency] = useState({
    code: "",
    name: "",
    symbol: "",
  });
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // 🆕 מצבי עריכה
  const [editingStatus, setEditingStatus] = useState<{
    index: number;
    value: string;
  } | null>(null);
  const [editingCurrency, setEditingCurrency] = useState<{
    index: number;
    currency: Currency;
  } | null>(null);

  // טעינת הגדרות מה-API
  useEffect(() => {
    loadSettings();
  }, []);

  // טעינת הגדרות מה-APIs הנפרדים
  const loadSettings = async () => {
    try {
      setLoading(true);

      // טעינת סטטוסים
      const statusesResponse = await fetch("/api/settings/statuses");
      const statusesData = statusesResponse.ok
        ? await statusesResponse.json()
        : { statuses: [] };

      // טעינת מטבעות
      const currenciesResponse = await fetch("/api/settings/currencies");
      const currenciesData = currenciesResponse.ok
        ? await currenciesResponse.json()
        : { currencies: [] };

      // טעינת הגדרות כלליות (אם יש)
      let generalSettings = {
        default_currency: "USD",
        default_production_time: 4,
        default_shipping_time: 2,
        default_advance_percentage: 30,
      };

      try {
        const generalResponse = await fetch("/api/settings");
        if (generalResponse.ok) {
          const generalData = await generalResponse.json();
          generalSettings = { ...generalSettings, ...generalData };
        }
      } catch (e) {
        console.log("No general settings API, using defaults");
      }

      setSettings({
        order_statuses: statusesData.statuses || [],
        currencies: currenciesData.currencies || [],
        ...generalSettings,
      });
    } catch (error) {
      console.error("Error loading settings:", error);
      await initializeDefaultSettings();
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultSettings = async () => {
    const defaultSettings = {
      order_statuses: [
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
      default_currency: "USD",
      default_production_time: 4,
      default_shipping_time: 2,
      default_advance_percentage: 30,
    };

    setSettings(defaultSettings);
    await saveSettings(defaultSettings);
  };

  const saveSettings = async (settingsToSave = settings) => {
    setSaving(true);
    try {
      // שמירת סטטוסים
      const statusesResponse = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            order_statuses: settingsToSave.order_statuses,
          },
        }),
      });

      // שמירת מטבעות
      const currenciesResponse = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            currencies: settingsToSave.currencies,
          },
        }),
      });

      // שמירת הגדרות כלליות
      const generalResponse = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            default_currency: settingsToSave.default_currency,
            default_production_time: settingsToSave.default_production_time,
            default_shipping_time: settingsToSave.default_shipping_time,
            default_advance_percentage:
              settingsToSave.default_advance_percentage,
          },
        }),
      });

      if (statusesResponse.ok && currenciesResponse.ok) {
        alert("הגדרות נשמרו בהצלחה!");
      } else {
        alert("שגיאה בשמירת הגדרות");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("שגיאה בשמירת הגדרות");
    } finally {
      setSaving(false);
    }
  };
  // 🆕 עריכת סטטוס
  const handleEditStatus = (index: number) => {
    setEditingStatus({ index, value: settings.order_statuses[index] });
  };

  const handleSaveStatusEdit = () => {
    if (!editingStatus || !editingStatus.value.trim()) return;

    const newStatuses = [...settings.order_statuses];
    newStatuses[editingStatus.index] = editingStatus.value.trim();

    setSettings({ ...settings, order_statuses: newStatuses });
    setEditingStatus(null);
  };

  const handleCancelStatusEdit = () => {
    setEditingStatus(null);
  };

  // 🆕 עריכת מטבע
  const handleEditCurrency = (index: number) => {
    setEditingCurrency({ index, currency: { ...settings.currencies[index] } });
  };

  const handleSaveCurrencyEdit = () => {
    if (
      !editingCurrency ||
      !editingCurrency.currency.code ||
      !editingCurrency.currency.name ||
      !editingCurrency.currency.symbol
    )
      return;

    const newCurrencies = [...settings.currencies];
    newCurrencies[editingCurrency.index] = editingCurrency.currency;

    setSettings({ ...settings, currencies: newCurrencies });
    setEditingCurrency(null);
  };

  const handleCancelCurrencyEdit = () => {
    setEditingCurrency(null);
  };

  const handleAddStatus = () => {
    if (
      newStatus.trim() &&
      !settings.order_statuses.includes(newStatus.trim())
    ) {
      setSettings({
        ...settings,
        order_statuses: [...settings.order_statuses, newStatus.trim()],
      });
      setNewStatus("");
    }
  };

  const handleRemoveStatus = (status: string) => {
    setSettings({
      ...settings,
      order_statuses: settings.order_statuses.filter((s) => s !== status),
    });
  };

  const handleAddCurrency = () => {
    if (newCurrency.code && newCurrency.name && newCurrency.symbol) {
      if (settings.currencies.some((c) => c.code === newCurrency.code)) {
        alert("מטבע בקוד זה כבר קיים");
        return;
      }

      setSettings({
        ...settings,
        currencies: [...settings.currencies, newCurrency],
      });
      setNewCurrency({ code: "", name: "", symbol: "" });
      setShowCurrencyModal(false);
    }
  };

  const handleRemoveCurrency = (code: string) => {
    if (code === settings.default_currency) {
      alert("לא ניתן למחוק את מטבע ברירת המחדל");
      return;
    }

    setSettings({
      ...settings,
      currencies: settings.currencies.filter((c) => c.code !== code),
    });
  };

  const handleDefaultSettingsChange = (field: string, value: any) => {
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleResetSettings = async () => {
    if (confirm("האם אתה בטוח שברצונך לאפס את כל ההגדרות לברירת מחדל?")) {
      await initializeDefaultSettings();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">טוען הגדרות מערכת...</span>
      </div>
    );
  }

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
            disabled={saving}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            <span>איפוס</span>
          </button>
          <button
            onClick={() => saveSettings()}
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? "שומר..." : "שמור הגדרות"}</span>
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
              disabled={!newStatus.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              הוסף
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {settings.order_statuses.map((status, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white p-3 rounded border"
              >
                {editingStatus?.index === index ? (
                  // מצב עריכה
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="text"
                      value={editingStatus.value}
                      onChange={(e) =>
                        setEditingStatus({
                          ...editingStatus,
                          value: e.target.value,
                        })
                      }
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleSaveStatusEdit();
                        if (e.key === "Escape") handleCancelStatusEdit();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveStatusEdit}
                      className="text-green-600 hover:text-green-800"
                      title="שמור"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelStatusEdit}
                      className="text-gray-500 hover:text-gray-700"
                      title="בטל"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  // מצב רגיל
                  <>
                    <span className="text-sm flex-1">{status}</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditStatus(index)}
                        className="text-blue-500 hover:text-blue-700"
                        title="ערוך סטטוס"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveStatus(status)}
                        className="text-red-500 hover:text-red-700"
                        title="מחק סטטוס"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
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
          {settings.currencies.map((currency, index) => (
            <div key={currency.code} className="bg-white p-4 rounded border">
              {editingCurrency?.index === index ? (
                // מצב עריכה
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      קוד
                    </label>
                    <input
                      type="text"
                      value={editingCurrency.currency.code}
                      onChange={(e) =>
                        setEditingCurrency({
                          ...editingCurrency,
                          currency: {
                            ...editingCurrency.currency,
                            code: e.target.value.toUpperCase(),
                          },
                        })
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      maxLength={3}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      שם
                    </label>
                    <input
                      type="text"
                      value={editingCurrency.currency.name}
                      onChange={(e) =>
                        setEditingCurrency({
                          ...editingCurrency,
                          currency: {
                            ...editingCurrency.currency,
                            name: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      סמל
                    </label>
                    <input
                      type="text"
                      value={editingCurrency.currency.symbol}
                      onChange={(e) =>
                        setEditingCurrency({
                          ...editingCurrency,
                          currency: {
                            ...editingCurrency.currency,
                            symbol: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      maxLength={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleSaveCurrencyEdit}
                      className="text-green-600 hover:text-green-800"
                      title="שמור"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelCurrencyEdit}
                      className="text-gray-500 hover:text-gray-700"
                      title="בטל"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                // מצב רגיל
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{currency.name}</div>
                    <div className="text-sm text-gray-600">
                      {currency.code} ({currency.symbol})
                      {currency.code === settings.default_currency && (
                        <span className="text-blue-600 font-medium">
                          {" "}
                          • ברירת מחדל
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditCurrency(index)}
                      className="text-blue-500 hover:text-blue-700"
                      title="ערוך מטבע"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveCurrency(currency.code)}
                      disabled={currency.code === settings.default_currency}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={
                        currency.code === settings.default_currency
                          ? "לא ניתן למחוק מטבע ברירת מחדל"
                          : "מחק מטבע"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
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
              value={settings.default_currency}
              onChange={(e) =>
                handleDefaultSettingsChange("default_currency", e.target.value)
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
              value={settings.default_production_time}
              onChange={(e) =>
                handleDefaultSettingsChange(
                  "default_production_time",
                  parseInt(e.target.value) || 1
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
              value={settings.default_shipping_time}
              onChange={(e) =>
                handleDefaultSettingsChange(
                  "default_shipping_time",
                  parseInt(e.target.value) || 1
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
              value={settings.default_advance_percentage}
              onChange={(e) =>
                handleDefaultSettingsChange(
                  "default_advance_percentage",
                  parseInt(e.target.value) || 0
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
