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
      <div className="w-full px-4 py-8 mt-16">
        {" "}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ניהול ספקים</h1>
          <p className="text-gray-600">ניהול פרטי ספקים, זמני ייצור ושילוח</p>
        </div>
        <div className="mb-8">
          <SupplierKPIs />
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <SuppliersList />
        </div>
      </div>
    </div>
  );
}
