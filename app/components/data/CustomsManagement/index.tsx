"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  User,
  Phone,
  Mail,
  Search,
} from "lucide-react";

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

export default function CustomsManagement() {
  const [companies, setCompanies] = useState<CustomsCompany[]>([]);
  const [agents, setAgents] = useState<CustomsAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<"companies" | "agents">(
    "companies"
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<
    CustomsCompany | CustomsAgent | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // For companies
    name: "",
    address: "",
    phone: "",
    email: "",
    // For agents
    position: "",
    customsCompanyId: "",
  });

  // 🔄 טעינת נתונים מה-API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // טוען חברות עמילות עם הסוכנים שלהם
      const companiesResponse = await fetch("/api/customs/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData);
      }

      // טוען כל הסוכנים עם שם החברה
      const agentsResponse = await fetch("/api/customs/agents");
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        setAgents(agentsData);
      }
    } catch (error) {
      console.error("Error loading customs data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.customsCompany?.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      agent.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🆕 הוספת חברת עמילות
  const handleAddCompany = async () => {
    if (!formData.name.trim() || !formData.email.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/customs/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
        }),
      });

      if (response.ok) {
        await loadData(); // טען מחדש את הנתונים
        resetForm();
        setShowAddModal(false);
      } else {
        const error = await response.json();
        alert(error.error || "שגיאה בהוספת חברת עמילות");
      }
    } catch (error) {
      console.error("Error adding company:", error);
      alert("שגיאה בהוספת חברת עמילות");
    } finally {
      setSubmitting(false);
    }
  };

  // 🆕 הוספת סוכן מכס
  const handleAddAgent = async () => {
    if (!formData.name.trim() || !formData.customsCompanyId) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/customs/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          position: formData.position.trim(),
          customsCompanyId: formData.customsCompanyId,
        }),
      });

      if (response.ok) {
        await loadData(); // טען מחדש את הנתונים
        resetForm();
        setShowAddModal(false);
      } else {
        const error = await response.json();
        alert(error.error || "שגיאה בהוספת סוכן מכס");
      }
    } catch (error) {
      console.error("Error adding agent:", error);
      alert("שגיאה בהוספת סוכן מכס");
    } finally {
      setSubmitting(false);
    }
  };

  // 🗑️ מחיקת חברת עמילות
  const handleDeleteCompany = async (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (!company) return;

    if (company.agents.length > 0) {
      alert(
        `לא ניתן למחוק חברה עם ${company.agents.length} סוכנים. מחק את הסוכנים קודם.`
      );
      return;
    }

    if (!confirm(`האם אתה בטוח שברצונך למחוק את "${company.name}"?`)) return;

    try {
      const response = await fetch(`/api/customs/companies?id=${companyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadData();
      } else {
        const error = await response.json();
        alert(error.error || "שגיאה במחיקת חברת עמילות");
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("שגיאה במחיקת חברת עמילות");
    }
  };

  // 🗑️ מחיקת סוכן מכס
  const handleDeleteAgent = async (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    if (!confirm(`האם אתה בטוח שברצונך למחוק את "${agent.name}"?`)) return;

    try {
      const response = await fetch(`/api/customs/agents?id=${agentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadData();
      } else {
        const error = await response.json();
        alert(error.error || "שגיאה במחיקת סוכן מכס");
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      alert("שגיאה במחיקת סוכן מכס");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      position: "",
      customsCompanyId: "",
    });
    setEditingItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">טוען נתוני עמילות...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* כותרת וניווט */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            ניהול עמילויות ומכס
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            ניהול חברות עמילות וסוכני מכס במערכת
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>הוסף {activeView === "companies" ? "חברה" : "סוכן"}</span>
        </button>
      </div>

      {/* סלקטור תצוגה */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveView("companies")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === "companies"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          חברות עמילות ({companies.length})
        </button>
        <button
          onClick={() => setActiveView("agents")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === "agents"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          סוכני מכס ({agents.length})
        </button>
      </div>

      {/* חיפוש */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder={`חיפוש ${
            activeView === "companies" ? "חברות" : "סוכנים"
          }...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* תצוגת חברות */}
      {activeView === "companies" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="bg-gray-50 rounded-lg p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    {company.name}
                  </h3>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleDeleteCompany(company.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="מחק חברה"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center space-x-2">
                  <span>📍</span>
                  <span>{company.address}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{company.phone}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{company.email}</span>
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {company.agents.length} סוכנים
                  </span>
                  <span className="text-xs text-gray-400">
                    נוצר:{" "}
                    {new Date(company.createdAt).toLocaleDateString("he-IL")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* תצוגת סוכנים */}
      {activeView === "agents" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="מחק סוכן"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>{agent.position}</p>
                <p className="flex items-center space-x-2">
                  <Building2 className="h-3 w-3" />
                  <span>{agent.customsCompany?.name}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Phone className="h-3 w-3" />
                  <span>{agent.phone}</span>
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-400">
                  נוצר: {new Date(agent.createdAt).toLocaleDateString("he-IL")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* הודעה כשאין תוצאות */}
      {((activeView === "companies" && filteredCompanies.length === 0) ||
        (activeView === "agents" && filteredAgents.length === 0)) && (
        <div className="text-center py-8">
          {activeView === "companies" ? (
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          ) : (
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          )}
          <p className="text-gray-500">
            {searchTerm
              ? `לא נמצאו ${
                  activeView === "companies" ? "חברות" : "סוכנים"
                } התואמים לחיפוש`
              : `אין ${
                  activeView === "companies" ? "חברות עמילות" : "סוכני מכס"
                } במערכת`}
          </p>
          {!searchTerm && (
            <button
              onClick={openAddModal}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              הוסף {activeView === "companies" ? "חברת עמילות" : "סוכן מכס"}{" "}
              ראשון
            </button>
          )}
        </div>
      )}

      {/* מודל הוספה */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              הוספת {activeView === "companies" ? "חברת עמילות" : "סוכן מכס"}{" "}
              חדש
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם {activeView === "companies" ? "החברה" : "הסוכן"} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    activeView === "companies" ? "שם חברת העמילות" : "שם הסוכן"
                  }
                  disabled={submitting}
                />
              </div>

              {activeView === "companies" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      כתובת
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="כתובת החברה"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      אימייל *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@company.com"
                      disabled={submitting}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      תפקיד
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="סוכן מכס, סוכן בכיר, וכו'"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      חברת עמילות *
                    </label>
                    <select
                      value={formData.customsCompanyId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customsCompanyId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={submitting}
                    >
                      <option value="">בחר חברת עמילות</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  טלפון
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="מספר טלפון"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={
                  activeView === "companies" ? handleAddCompany : handleAddAgent
                }
                disabled={
                  submitting ||
                  !formData.name.trim() ||
                  (activeView === "companies" && !formData.email.trim()) ||
                  (activeView === "agents" && !formData.customsCompanyId)
                }
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "שומר..." : "הוסף"}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
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
