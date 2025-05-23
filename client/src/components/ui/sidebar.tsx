/* /client/src/components/ui/sidebar.tsx */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Only show sidebar for larger screens
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return null;
  }

  const isCompanyAdmin = user?.role === "company_admin";

  const isActive = (path: string) => {
    return location === path;
  };

  const companyLinks = [
    { path: "/", label: t("sidebar.dashboard"), icon: "dashboard" },
    { path: "/inventory", label: t("sidebar.inventory"), icon: "inventory_2" }, // Changed icon
    { path: "/vehicles", label: t("sidebar.vehicles"), icon: "directions_car" },
    { path: "/maintenance", label: t("sidebar.maintenance"), icon: "build" },
    { path: "/orders", label: t("sidebar.orders"), icon: "shopping_cart" },
    { path: "/reports", label: t("sidebar.reports"), icon: "bar_chart" },
  ];

  const driverLinks = [
    { path: "/", label: t("sidebar.dashboard"), icon: "dashboard" },
    { path: "/maintenance", label: t("sidebar.maintenance"), icon: "build" },
    // Add link to vehicle details if needed
  ];

  const navLinks = isCompanyAdmin ? companyLinks : driverLinks;

  const accountLinks = [
    { path: "/settings", label: t("sidebar.settings"), icon: "settings" },
    { path: "/help", label: t("sidebar.help"), icon: "help_outline" }, // Changed icon
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white shadow-lg">
      <div className="flex items-center p-4 border-b">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
          <span className="material-icons">directions_car</span>
        </div>
        <h1 className="ml-3 text-xl font-bold text-primary">FleetMaster</h1>
      </div>

      <div className="p-2">
        <p className="px-4 py-2 text-sm text-gray-500 uppercase">
          {isCompanyAdmin ? t("sidebar.company") : t("sidebar.driver")}
        </p>

        {navLinks.map((link) => (
          <Link key={link.path} href={link.path}>
            <a
              className={cn(
                "flex items-center px-4 py-3 rounded-md transition-colors",
                isActive(link.path)
                  ? "bg-primary bg-opacity-10 text-primary border-l-4 border-primary"
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              <span className="material-icons mr-3">{link.icon}</span>
              {link.label}
            </a>
          </Link>
        ))}
      </div>

      <div className="mt-4 p-2">
        <p className="px-4 py-2 text-sm text-gray-500 uppercase">
          {t("sidebar.account")}
        </p>

        {accountLinks.map((link) => (
          <Link key={link.path} href={link.path}>
            <a
              className={cn(
                "flex items-center px-4 py-3 rounded-md transition-colors",
                isActive(link.path)
                  ? "bg-primary bg-opacity-10 text-primary border-l-4 border-primary"
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              <span className="material-icons mr-3">{link.icon}</span>
              {link.label}
            </a>
          </Link>
        ))}
      </div>

      <div className="mt-auto p-4 border-t">
        <div className="flex items-center">
          <img
            src={
              user?.profileImage ||
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
            }
            alt="User profile"
            className="w-8 h-8 rounded-full"
          />
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-gray-500">
              {user?.role === "company_admin" ? "Company Admin" : "Driver"}
            </p>
          </div>
          <button
            className="ml-auto text-gray-500"
            onClick={logout}
            title={t("sidebar.logout")} // Add title for accessibility
          >
            <span className="material-icons">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
