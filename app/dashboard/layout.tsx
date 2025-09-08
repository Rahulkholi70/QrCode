// app/dashboard/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Home,
  ChefHat,
  QrCode,
  Percent,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [restaurantName, setRestaurantName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getTokenFromCookie = () => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') {
        return value;
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = getTokenFromCookie();
      if (token) {
        try {
          const res = await fetch('/api/vendor/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.vendor?.restaurantName) {
            setRestaurantName(data.vendor.restaurantName);
          } else {
            setRestaurantName("My Restaurant");
          }
        } catch (error) {
          setRestaurantName("My Restaurant");
        }
      }
    };

    fetchProfile();
  }, []);

  const logout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/admin/login';
  }
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Menu Management", href: "/dashboard/menu", icon: ChefHat },
    { name: "QR Code", href: "/dashboard/qr", icon: QrCode },
    { name: "Discounts", href: "/dashboard/discounts", icon: Percent },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  // Find active navigation item based on current pathname
  const activeNavItem = navigation.find((item) =>
    pathname === item.href || pathname?.startsWith(item.href + "/")
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 bg-green-600">
          <h1 className="text-lg font-bold text-white">🍽️ QRScan Admin</h1>
          <button
            className="lg:hidden text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-700 transition"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5 mr-3 text-gray-500" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User footer - sticks bottom */}
         <div className="p-4 border-t border-gray-200 " >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center align-bottom">
          <span className="text-green-600 font-bold">R</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 ">
            {restaurantName}
          </p>
          <p className="text-xs text-gray-500">Restaurant Owner</p>
        </div>
      </div>
    </div>
   </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 h-screen">
        {/* Header */}
        <header className="flex items-center justify-between bg-white shadow px-6 h-16">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            {activeNavItem ? activeNavItem.name : "Dashboard"}
          </h1>

          <div className="flex items-center space-x-4">
            {/* <button className="p-2 rounded-full text-gray-600 hover:bg-gray-100">
              <Bell className="w-5 h-5" />
            </button> */}
            <button className="hidden sm:flex items-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-sm font-medium transition" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 sm:p-8 lg:p-10">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
