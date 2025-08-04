"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import SupplierKPIs from "@/components/suppliers/SupplierKPIs";
import SuppliersList from "@/components/suppliers/SuppliersList/index";
import { Supplier } from "@/types";

export default function SuppliersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="w-full px-4 py-4 mt-16">
        <div className="mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">ניהול ספקים</h1>
            <div className="h-6 w-px bg-gray-300"></div>
            <p className="text-gray-600">ניהול פרטי ספקים, זמני ייצור ושילוח</p>
          </div>
        </div>
        <div className="mb-6">
          <SupplierKPIs />
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <SuppliersList />
        </div>
      </div>
    </div>
  );
}
