"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Package, Search } from "lucide-react";

interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    supplierCategories?: number;
    orderCategories?: number;
  };
}

export default function ProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  // 🔄 טעינת קטגוריות מה-API האמיתי
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error("Error fetching categories");
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🆕 הוספת קטגוריה חדשה
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          description: newCategory.description.trim() || null,
        }),
      });

      if (response.ok) {
        const addedCategory = await response.json();
        setCategories([addedCategory, ...categories]);
        setNewCategory({ name: "", description: "" });
        setShowAddModal(false);
      } else {
        const error = await response.json();
        alert(error.error || "שגיאה בהוספת קטגוריה");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      alert("שגיאה בהוספת קטגוריה");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description || "",
    });
  };

  // 🔄 עדכון קטגוריה
  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategory.name.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingCategory.id,
          name: newCategory.name.trim(),
          description: newCategory.description.trim() || null,
        }),
      });

      if (response.ok) {
        const updatedCategory = await response.json();
        setCategories(
          categories.map((cat) =>
            cat.id === editingCategory.id ? updatedCategory : cat
          )
        );
        setEditingCategory(null);
        setNewCategory({ name: "", description: "" });
      } else {
        const error = await response.json();
        alert(error.error || "שגיאה בעדכון קטגוריה");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("שגיאה בעדכון קטגוריה");
    } finally {
      setSubmitting(false);
    }
  };

  // 🗑️ מחיקת קטגוריה
  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    // בדיקה אם יש ספקים או הזמנות מקושרות
    const totalUsage =
      (category._count?.supplierCategories || 0) +
      (category._count?.orderCategories || 0);
    if (totalUsage > 0) {
      alert(
        `לא ניתן למחוק קטגוריה זו - היא בשימוש על ידי ${totalUsage} ספקים/הזמנות`
      );
      return;
    }

    if (
      !confirm(`האם אתה בטוח שברצונך למחוק את הקטגוריה "${category.name}"?`)
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCategories(categories.filter((cat) => cat.id !== categoryId));
      } else {
        const error = await response.json();
        alert(error.error || "שגיאה במחיקת קטגוריה");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("שגיאה במחיקת קטגוריה");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">טוען קטגוריות...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* כותרת וסטטיסטיקות */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            קטגוריות מוצרים
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            ניהול קטגוריות מוצרים במערכת ({categories.length} קטגוריות)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>הוסף קטגוריה</span>
        </button>
      </div>

      {/* חיפוש */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="חיפוש קטגוריות..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* רשימת קטגוריות */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleEditCategory(category)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="ערוך קטגוריה"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="מחק קטגוריה"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {category.description && (
              <p className="text-sm text-gray-600 mb-3">
                {category.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {(category._count?.supplierCategories || 0) +
                  (category._count?.orderCategories || 0)}{" "}
                שימושים
              </span>
              <span>
                עודכן:{" "}
                {new Date(category.updatedAt).toLocaleDateString("he-IL")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm
              ? "לא נמצאו קטגוריות התואמות לחיפוש"
              : "אין קטגוריות במערכת"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              הוסף קטגוריה ראשונה
            </button>
          )}
        </div>
      )}

      {/* מודל הוספה/עריכה */}
      {(showAddModal || editingCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingCategory ? "עריכת קטגוריה" : "הוספת קטגוריה חדשה"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם הקטגוריה *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="לדוגמה: צעצועים"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="תיאור הקטגוריה..."
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={
                  editingCategory ? handleUpdateCategory : handleAddCategory
                }
                disabled={!newCategory.name.trim() || submitting}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "שומר..." : editingCategory ? "עדכן" : "הוסף"}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                  setNewCategory({ name: "", description: "" });
                }}
                disabled={submitting}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50"
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
