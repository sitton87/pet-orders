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
  contactName: string;
  contactPosition: string;
  agents: CustomsAgent[];
  createdAt: string;
}

interface CustomsAgent {
  id: string;
  name: string;
  phone: string;
  email: string;
  position: string;
  customsCompanyId: string;
  createdAt: string;
}

export default function CustomsManagement() {
  const [companies, setCompanies] = useState<CustomsCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<"companies" | "agents">(
    "companies"
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<
    CustomsCompany | CustomsAgent | null
  >(null);

  // נתונים דמה
  useEffect(() => {
    setTimeout(() => {
      setCompanies([
        {
          id: "1",
          name: 'עמילות ישראל בע"מ',
          address: "רחוב הרצל 15, תל אביב",
          phone: "03-1234567",
          email: "info@customs-israel.co.il",
          contactName: "דוד כהן",
          contactPosition: "מנהל כללי",
          createdAt: "2025-01-15",
          agents: [
            {
              id: "1",
              name: "משה לוי",
              phone: "050-1234567",
              email: "moshe@customs-israel.co.il",
              position: "עמיל בכיר",
              customsCompanyId: "1",
              createdAt: "2025-01-15",
            },
            {
              id: "2",
              name: "שרה אברהם",
              phone: "052-2345678",
              email: "sarah@customs-israel.co.il",
              position: "עמילה",
              customsCompanyId: "1",
              createdAt: "2025-01-10",
            },
          ],
        },
        {
          id: "2",
          name: 'מכס וילונות בע"מ',
          address: "שדרות רוטשילד 22, תל אביב",
          phone: "03-9876543",
          email: "office@maches-logistics.co.il",
          contactName: "אבי רוזן",
          contactPosition: "מנהל מכס",
          createdAt: "2025-01-10",
          agents: [
            {
              id: "3",
              name: "יוסי דוד",
              phone: "054-3456789",
              email: "yossi@maches-logistics.co.il",
              position: "עמיל ראשי",
              customsCompanyId: "2",
              createdAt: "2025-01-10",
            },
          ],
        },
        {
          id: "3",
          name: "אוניברסל לוגיסטיקס",
          address: "האומן 45, חיפה",
          phone: "04-8765432",
          email: "contact@universal-log.co.il",
          contactName: "רחל גולן",
          contactPosition: "מנהלת תפעול",
          createdAt: "2025-01-05",
          agents: [
            {
              id: "4",
              name: "עמי חדד",
              phone: "053-4567890",
              email: "ami@universal-log.co.il",
              position: "עמיל",
              customsCompanyId: "3",
              createdAt: "2025-01-05",
            },
            {
              id: "5",
              name: "נועה ברק",
              phone: "055-5678901",
              email: "noa@universal-log.co.il",
              position: "עמילה בכירה",
              customsCompanyId: "3",
              createdAt: "2025-01-01",
            },
          ],
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const allAgents = companies.flatMap((company) =>
    company.agents.map((agent) => ({
      ...agent,
      companyName: company.name,
    }))
  );

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgents = allAgents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            ניהול חברות עמילות ועמילי מכס במערכת
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>הוסף {activeView === "companies" ? "חברה" : "עמיל"}</span>
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
          עמילי מכס ({allAgents.length})
        </button>
      </div>

      {/* חיפוש */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder={`חיפוש ${
            activeView === "companies" ? "חברות" : "עמילים"
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
                  <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
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
                <p className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>
                    {company.contactName} - {company.contactPosition}
                  </span>
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {company.agents.length} עמילים
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

      {/* תצוגת עמילים */}
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
                  <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>{agent.position}</p>
                <p className="flex items-center space-x-2">
                  <Building2 className="h-3 w-3" />
                  <span>{agent.companyName}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Phone className="h-3 w-3" />
                  <span>{agent.phone}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Mail className="h-3 w-3" />
                  <span>{agent.email}</span>
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
                  activeView === "companies" ? "חברות" : "עמילים"
                } התואמים לחיפוש`
              : `אין ${
                  activeView === "companies" ? "חברות עמילות" : "עמילי מכס"
                } במערכת`}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              הוסף {activeView === "companies" ? "חברת עמילות" : "עמיל מכס"}{" "}
              ראשון
            </button>
          )}
        </div>
      )}
    </div>
  );
}
