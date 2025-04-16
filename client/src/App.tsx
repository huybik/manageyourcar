import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

// Pages
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import CompanyDashboard from "@/pages/company/dashboard";
import InventoryPage from "@/pages/company/inventory";
import VehiclesPage from "@/pages/company/vehicles";
import MaintenancePage from "@/pages/company/maintenance";
import OrdersPage from "@/pages/company/orders";
import ReportsPage from "@/pages/company/reports";
import DriverDashboard from "@/pages/driver/dashboard";
import DriverMaintenance from "@/pages/driver/maintenance";
import VehicleDetails from "@/pages/driver/vehicle-details";
import Settings from "@/pages/settings";

// Components
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";

// Auth context
import { AuthProvider, useAuth } from "@/hooks/use-auth";

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && location !== "/login") {
      window.location.href = "/login";
    }
  }, [isAuthenticated, location]);

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/:rest*">
          <Login />
        </Route>
      </Switch>
    );
  }

  // Check user role for routing
  const isCompanyAdmin = user?.role === "company_admin";
  const isDriver = user?.role === "driver";

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Switch>
          {/* Company admin routes */}
          {isCompanyAdmin && (
            <>
              <Route path="/" component={CompanyDashboard} />
              <Route path="/inventory" component={InventoryPage} />
              <Route path="/vehicles" component={VehiclesPage} />
              <Route path="/maintenance" component={MaintenancePage} />
              <Route path="/orders" component={OrdersPage} />
              <Route path="/reports" component={ReportsPage} />
            </>
          )}
          
          {/* Driver routes */}
          {isDriver && (
            <>
              <Route path="/" component={DriverDashboard} />
              <Route path="/maintenance" component={DriverMaintenance} />
              <Route path="/vehicle/:id" component={VehicleDetails} />
            </>
          )}
          
          {/* Common routes */}
          <Route path="/settings" component={Settings} />
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
