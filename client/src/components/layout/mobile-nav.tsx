/* /client/src/components/layout/mobile-nav.tsx */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function MobileNav() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Only show for mobile screens
  if (typeof window !== "undefined" && window.innerWidth >= 768) {
    return null;
  }

  const isCompanyAdmin = user?.role === "company_admin";

  const isActive = (path: string) => {
    return location === path;
  };

  const companyLinks = [
    { path: "/", label: t("sidebar.dashboard"), icon: "dashboard" },
    { path: "/inventory", label: t("sidebar.inventory"), icon: "inventory" },
    { path: "/vehicles", label: t("sidebar.vehicles"), icon: "directions_car" },
    { path: "/maintenance", label: t("sidebar.maintenance"), icon: "build" },
    { path: "/orders", label: t("sidebar.orders"), icon: "shopping_cart" },
    { path: "/reports", label: t("sidebar.reports"), icon: "bar_chart" },
  ];

  const driverLinks = [
    { path: "/", label: t("sidebar.dashboard"), icon: "dashboard" },
    { path: "/maintenance", label: t("sidebar.maintenance"), icon: "build" },
  ];

  const navLinks = isCompanyAdmin ? companyLinks : driverLinks;

  const accountLinks = [
    { path: "/settings", label: t("sidebar.settings"), icon: "settings" },
    { path: "/help", label: t("sidebar.help"), icon: "help" },
  ];

  const bottomNavItems = navLinks.slice(0, 4);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white w-full shadow-md fixed top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="material-icons text-sm">directions_car</span>
            </div>
            <h1 className="ml-2 text-lg font-bold text-primary">FleetMaster</h1>
          </div>
          <button
            className="text-gray-700"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="material-icons">menu</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center py-2 px-4 z-10">
        {bottomNavItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a
              className={cn(
                "flex flex-col items-center",
                isActive(item.path) ? "text-primary" : "text-gray-500"
              )}
            >
              <span className="material-icons">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
        <button
          className="flex flex-col items-center text-gray-500"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <span className="material-icons">more_horiz</span>
          <span className="text-xs mt-1">More</span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-white w-4/5 max-w-sm h-full p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                  <span className="material-icons">directions_car</span>
                </div>
                <h1 className="ml-3 text-xl font-bold text-primary">
                  FleetMaster
                </h1>
              </div>
              <button
                className="text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="border-b pb-4 mb-4">
              <div className="flex items-center">
                <img
                  src={
                    user?.profileImage ||
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
                  }
                  alt="User profile"
                  className="w-12 h-12 rounded-full"
                />
                <div className="ml-3">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-gray-500">
                    {user?.role === "company_admin"
                      ? "Company Admin"
                      : "Driver"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="px-2 py-2 text-sm text-gray-500 uppercase">
                {isCompanyAdmin ? t("sidebar.company") : t("sidebar.driver")}
              </p>

              {navLinks.map((link) => (
                <Link key={link.path} href={link.path}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 rounded-md transition-colors",
                      isActive(link.path)
                        ? "bg-primary bg-opacity-10 text-primary"
                        : "hover:bg-gray-100 text-gray-700"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="material-icons mr-3">{link.icon}</span>
                    {link.label}
                  </a>
                </Link>
              ))}
            </div>

            <div className="mt-4">
              <p className="px-2 py-2 text-sm text-gray-500 uppercase">
                {t("sidebar.account")}
              </p>

              {accountLinks.map((link) => (
                <Link key={link.path} href={link.path}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 rounded-md transition-colors",
                      isActive(link.path)
                        ? "bg-primary bg-opacity-10 text-primary"
                        : "hover:bg-gray-100 text-gray-700"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="material-icons mr-3">{link.icon}</span>
                    {link.label}
                  </a>
                </Link>
              ))}

              <button
                className="flex items-center px-4 py-3 hover:bg-gray-100 rounded-md text-gray-700 w-full text-left"
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="material-icons mr-3">logout</span>
                {t("sidebar.logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
