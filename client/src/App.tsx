import { useState, useEffect } from "react";
// Import Redirect and use navigate from useLocation
import { Switch, Route, useLocation, Redirect } from "wouter";
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
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state

// Auth context
import { AuthProvider, useAuth } from "@/hooks/use-auth";

function AppRoutes() {
  // Get isLoading state and navigate function
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect logic based on auth state and location
  useEffect(() => {
    // Wait until loading is finished
    if (isLoading) {
      return;
    }

    // If not authenticated AND not on the login page, redirect to login
    if (!isAuthenticated && location !== "/login") {
      navigate("/login", { replace: true });
    }
    // If authenticated AND on the login page, redirect to the dashboard
    else if (isAuthenticated && location === "/login") {
      navigate("/", { replace: true });
    }
    // No action needed if authenticated and not on /login, or not authenticated and on /login
  }, [isAuthenticated, isLoading, location, navigate]);

  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* Basic Loading Indicator */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-12 w-12 rounded-full bg-primary/20" />
          <Skeleton className="h-4 w-32 bg-muted" />
        </div>
      </div>
    );
  }

  // If not authenticated, only render the Login route (redirect handled by useEffect)
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        {/* Fallback redirect to login if trying to access other pages */}
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  // Authenticated: Render layout and role-based routes
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
              <Route path="/settings" component={Settings} />
              {/* Redirect from /login if somehow accessed while authenticated */}
              <Route path="/login">
                <Redirect to="/" />
              </Route>
              {/* Fallback to 404 for company admin */}
              <Route component={NotFound} />
            </>
          )}

          {/* Driver routes */}
          {isDriver && (
            <>
              <Route path="/" component={DriverDashboard} />
              <Route path="/maintenance" component={DriverMaintenance} />
              <Route path="/vehicle/:id" component={VehicleDetails} />
              <Route path="/settings" component={Settings} />
              {/* Redirect from /login if somehow accessed while authenticated */}
              <Route path="/login">
                <Redirect to="/" />
              </Route>
              {/* Fallback to 404 for driver */}
              <Route component={NotFound} />
            </>
          )}

          {/* If role is somehow unknown but authenticated, maybe show NotFound or a generic page */}
          {!isCompanyAdmin && !isDriver && <Route component={NotFound} />}
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
