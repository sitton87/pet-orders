"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Edit,
  Save,
  X,
  Plus,
  CheckCircle,
  AlertCircle,
  Settings,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface OrderStageTemplate {
  id: string;
  name: string;
  durationDays: number;
  order: number;
  isConditional: boolean;
  condition: string | null;
  isDynamic: boolean;
  calculationMethod: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function OrderStagesManagement() {
  const [stages, setStages] = useState<OrderStageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchStages();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchStages = async () => {
    try {
      const response = await fetch("/api/order-stages");
      if (!response.ok) throw new Error("Failed to fetch stages");
      const data = await response.json();
      setStages(
        data.sort(
          (a: OrderStageTemplate, b: OrderStageTemplate) => a.order - b.order
        )
      );
    } catch (error) {
      console.error("Error fetching stages:", error);
      setMessage({ type: "error", text: "שגיאה בטעינת שלבים" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (updatedStage: OrderStageTemplate) => {
    try {
      const response = await fetch("/api/order-stages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStage),
      });

      if (!response.ok) throw new Error("Failed to update stage");

      // 🆕 רענון מיידי של הטבלה
      await fetchStages();
      setEditingStage(null);
      setMessage({ type: "success", text: "שלב עודכן בהצלחה!" });

      // 🆕 התראה לקומפוננטות אחרות
      window.dispatchEvent(new CustomEvent("stagesUpdated"));
    } catch (error) {
      console.error("Error updating stage:", error);
      setMessage({ type: "error", text: "שגיאה בעדכון שלב" });
    }
  };

  const handleToggleActive = async (stage: OrderStageTemplate) => {
    await handleUpdateStage({ ...stage, isActive: !stage.isActive });
  };

  const handleMoveStage = async (
    stage: OrderStageTemplate,
    direction: "up" | "down"
  ) => {
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);
    const currentIndex = sortedStages.findIndex((s) => s.id === stage.id);

    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === sortedStages.length - 1)
    ) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const targetStage = sortedStages[targetIndex];

    // החלף סדר
    const updatedStage = { ...stage, order: targetStage.order };
    const updatedTargetStage = { ...targetStage, order: stage.order };

    try {
      await Promise.all([
        handleUpdateStage(updatedStage),
        handleUpdateStage(updatedTargetStage),
      ]);
    } catch (error) {
      console.error("Error moving stage:", error);
      setMessage({ type: "error", text: "שגיאה בהעברת שלב" });
    }
  };

  const StageRow = ({ stage }: { stage: OrderStageTemplate }) => {
    const [editedStage, setEditedStage] = useState(stage);
    const isEditing = editingStage === stage.id;

    if (isEditing) {
      return (
        <tr className="bg-blue-50 border-l-4 border-l-blue-500">
          <td className="px-6 py-4">
            <input
              type="text"
              value={editedStage.name}
              onChange={(e) =>
                setEditedStage({ ...editedStage, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={editedStage.durationDays}
                onChange={(e) =>
                  setEditedStage({
                    ...editedStage,
                    durationDays: parseInt(e.target.value) || 0,
                  })
                }
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="0"
              />
              <span className="text-xs text-gray-500">ימים</span>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editedStage.isConditional}
                  onChange={(e) =>
                    setEditedStage({
                      ...editedStage,
                      isConditional: e.target.checked,
                      condition: e.target.checked ? "hasAdvancePayment" : null,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm">תנאי</span>
              </label>
              {editedStage.isConditional && (
                <input
                  type="text"
                  value={editedStage.condition || ""}
                  onChange={(e) =>
                    setEditedStage({
                      ...editedStage,
                      condition: e.target.value,
                    })
                  }
                  placeholder="hasAdvancePayment"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
              )}
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editedStage.isDynamic}
                  onChange={(e) =>
                    setEditedStage({
                      ...editedStage,
                      isDynamic: e.target.checked,
                      calculationMethod: e.target.checked
                        ? "productionTimeWeeks * 7"
                        : null,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm">דינמי</span>
              </label>
              {editedStage.isDynamic && (
                <input
                  type="text"
                  value={editedStage.calculationMethod || ""}
                  onChange={(e) =>
                    setEditedStage({
                      ...editedStage,
                      calculationMethod: e.target.value,
                    })
                  }
                  placeholder="productionTimeWeeks * 7"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
              )}
            </div>
          </td>
          <td className="px-6 py-4">
            <textarea
              value={editedStage.description || ""}
              onChange={(e) =>
                setEditedStage({ ...editedStage, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={2}
              placeholder="תיאור השלב..."
            />
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleUpdateStage(editedStage)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                title="שמור"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={() => setEditingStage(null)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                title="בטל"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr className={`hover:bg-gray-50 ${!stage.isActive ? "opacity-60" : ""}`}>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {stage.order}
            </span>
            <div>
              <div className="font-medium text-gray-900">{stage.name}</div>
              {stage.description && (
                <div className="text-sm text-gray-500">{stage.description}</div>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
            {stage.isDynamic ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <Clock className="w-3 h-3 mr-1" />
                דינמי
              </span>
            ) : (
              <span className="text-sm font-medium text-gray-900">
                {stage.durationDays} ימים
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          {stage.isConditional ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              תנאי: {stage.condition}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              חובה
            </span>
          )}
        </td>
        <td className="px-6 py-4">
          {stage.isDynamic && stage.calculationMethod && (
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              {stage.calculationMethod}
            </code>
          )}
        </td>
        <td className="px-6 py-4">
          <button
            onClick={() => handleToggleActive(stage)}
            className="flex items-center space-x-1"
          >
            {stage.isActive ? (
              <>
                <ToggleRight className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-600 font-medium">פעיל</span>
              </>
            ) : (
              <>
                <ToggleLeft className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-400">כבוי</span>
              </>
            )}
          </button>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleMoveStage(stage, "up")}
              disabled={stage.order === 1}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="העבר למעלה"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleMoveStage(stage, "down")}
              disabled={stage.order === stages.length}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="העבר למטה"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditingStage(stage.id)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="ערוך"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* כותרת */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            ניהול שלבי הזמנות
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            עריכת השלבים הקבועים שחלים על כל הזמנה חדשה
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {stages.filter((s) => s.isActive).length} שלבים פעילים מתוך{" "}
            {stages.length}
          </span>
        </div>
      </div>

      {/* הודעות */}
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* טבלת שלבים */}
      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                שלב
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                משך זמן
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                סוג
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                חישוב
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                סטטוס
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stages.map((stage) => (
              <StageRow key={stage.id} stage={stage} />
            ))}
          </tbody>
        </table>
      </div>

      {/* מידע נוסף */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">הסבר על השלבים:</p>
            <ul className="space-y-1 text-xs">
              <li>
                <strong>דינמי:</strong> משך השלב מחושב לפי הספק (ייצור/שילוח)
              </li>
              <li>
                <strong>תנאי:</strong> השלב מתבצע רק אם התנאי מתקיים (כמו מקדמה)
              </li>
              <li>
                <strong>סדר:</strong> ניתן לשנות את סדר השלבים עם החצים
              </li>
              <li>
                <strong>פעיל/כבוי:</strong> שלבים כבויים לא ייכללו בהזמנות חדשות
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
