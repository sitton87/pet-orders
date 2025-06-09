"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Database, Package, Building2, Settings, FileText } from "lucide-react";
import SeedDataButton from "@/components/dev/SeedDataButton";

// Import tab components
import ProductCategories from "@/components/data/ProductCategories";
import CustomsManagement from "@/components/data/CustomsManagement";
import SystemSettings from "@/components/data/SystemSettings";
import DataTools from "@/components/data/DataTools";

export default function DataPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("categories");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) return null;

  const tabs = [
    {
      id: "categories",
      name: "קטגוריות מוצרים",
      icon: Package,
      component: ProductCategories,
    },
    {
      id: "customs",
      name: "עמילויות ומכס",
      icon: Building2,
      component: CustomsManagement,
    },
    {
      id: "settings",
      name: "הגדרות מערכת",
      icon: Settings,
      component: SystemSettings,
    },
    {
      id: "tools",
      name: "כלי ניהול",
      icon: FileText,
      component: DataTools,
    },
  ];

  const ActiveComponent =
    tabs.find((tab) => tab.id === activeTab)?.component || ProductCategories;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="w-full px-4 py-8 mt-16">
        {" "}
        {/* כותרת העמוד */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">ניהול נתונים</h1>
          </div>
          <p className="text-gray-600">
            ניהול קטגוריות, עמילויות, הגדרות מערכת וכלי נתונים
          </p>
        </div>
        {/* כפתור נתונים לדוגמה */}
        <SeedDataButton />
        {/* טאבים */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" role="tablist">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
