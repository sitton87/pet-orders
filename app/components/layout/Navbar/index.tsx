"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Database, Package, ShoppingCart, Calendar } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Auto-logout functionality
  useEffect(() => {
    if (!session) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // המסך ננעל או הדף נסגר
        signOut({ callbackUrl: "/" });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session]);

  if (!session) {
    return null; // לא מציג navbar למשתמשים לא מחוברים
  }

  const navigationItems = [
    {
      name: "ספקים",
      href: "/suppliers",
      icon: Package,
    },
    {
      name: "הזמנות",
      href: "/orders",
      icon: ShoppingCart,
    },
    {
      name: "לוח שנה",
      href: "/calendar",
      icon: Calendar,
    },
    {
      name: "נתונים",
      href: "/data",
      icon: Database,
    },
  ];

  return (
    <nav className="bg-white shadow-lg border-b fixed top-0 left-0 w-full z-50">
      <div className="w-full px-4">
        <div className="flex items-center h-16">
          {/* לוגו */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800">
              R4PET Management
            </h1>
          </div>

          {/* תפריט ניווט - במרכז */}
          <div className="flex space-x-6 justify-center flex-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* פרטי משתמש */}
          <div className="relative pr-20">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {session.user?.image && (
                <img
                  className="h-8 w-8 rounded-full"
                  src={session.user.image}
                  alt={session.user?.name || "User"}
                />
              )}
              <span className="text-gray-700 font-medium">
                {session.user?.name}
              </span>
            </button>

            {/* תפריט משתמש */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 text-sm text-gray-500 border-b">
                  {session.user?.email}
                </div>
                <button
                  onClick={() =>
                    signOut({
                      callbackUrl: "/",
                      redirect: true,
                    })
                  }
                  className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  התנתק
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
