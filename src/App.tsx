import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerSubscriptions from "./pages/customer/CustomerSubscriptions";
import CustomerClaims from "./pages/customer/CustomerClaims";
import CustomerTickets from "./pages/customer/CustomerTickets";
import CustomerProfile from "./pages/customer/CustomerProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminInvoices from "./pages/admin/AdminInvoices";
import AdminPurchaseOrders from "./pages/admin/AdminPurchaseOrders";
import AdminServices from "./pages/admin/AdminServices";
import AdminPartners from "./pages/admin/AdminPartners";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminFraudMonitoring from "./pages/admin/AdminFraudMonitoring";
import AdminDeviceVerification from "./pages/admin/AdminDeviceVerification";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerSales from "./pages/partner/PartnerSales";
import PartnerCommissions from "./pages/partner/PartnerCommissions";
import PartnerCustomers from "./pages/partner/PartnerCustomers";
import PartnerSettings from "./pages/partner/PartnerSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to={`/${user?.role}`} replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={`/${user?.role}`} replace /> : <Login />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? `/${user?.role}` : '/login'} replace />} />

      {/* Customer routes */}
      <Route path="/customer" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/customer/subscriptions" element={<ProtectedRoute role="customer"><CustomerSubscriptions /></ProtectedRoute>} />
      <Route path="/customer/claims" element={<ProtectedRoute role="customer"><CustomerClaims /></ProtectedRoute>} />
      <Route path="/customer/tickets" element={<ProtectedRoute role="customer"><CustomerTickets /></ProtectedRoute>} />
      <Route path="/customer/profile" element={<ProtectedRoute role="customer"><CustomerProfile /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/subscriptions" element={<ProtectedRoute role="admin"><AdminSubscriptions /></ProtectedRoute>} />
      <Route path="/admin/invoices" element={<ProtectedRoute role="admin"><AdminInvoices /></ProtectedRoute>} />
      <Route path="/admin/purchase-orders" element={<ProtectedRoute role="admin"><AdminPurchaseOrders /></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute role="admin"><AdminServices /></ProtectedRoute>} />
      <Route path="/admin/partners" element={<ProtectedRoute role="admin"><AdminPartners /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/fraud-monitoring" element={<ProtectedRoute role="admin"><AdminFraudMonitoring /></ProtectedRoute>} />
      <Route path="/admin/device-verification" element={<ProtectedRoute role="admin"><AdminDeviceVerification /></ProtectedRoute>} />

      {/* Partner routes */}
      <Route path="/partner" element={<ProtectedRoute role="partner"><PartnerDashboard /></ProtectedRoute>} />
      <Route path="/partner/sales" element={<ProtectedRoute role="partner"><PartnerSales /></ProtectedRoute>} />
      <Route path="/partner/commissions" element={<ProtectedRoute role="partner"><PartnerCommissions /></ProtectedRoute>} />
      <Route path="/partner/customers" element={<ProtectedRoute role="partner"><PartnerCustomers /></ProtectedRoute>} />
      <Route path="/partner/settings" element={<ProtectedRoute role="partner"><PartnerSettings /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
