import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerSubscriptions from "./pages/customer/CustomerSubscriptions";
import CustomerClaims from "./pages/customer/CustomerClaims";
import CustomerTickets from "./pages/customer/CustomerTickets";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerInvoices from "./pages/customer/CustomerInvoices";
import DeviceOnboardingWizard from "./pages/customer/DeviceOnboardingWizard";
import CustomerDevices from "./pages/customer/CustomerDevices";
import ClaimDetailPage from "./pages/customer/ClaimDetailPage";
import CustomerNotifications from "./pages/customer/CustomerNotifications";
import CustomerFeedback from "./pages/customer/CustomerFeedback";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminSubscriptionPlans from "./pages/admin/AdminSubscriptionPlans";
import AdminInvoices from "./pages/admin/AdminInvoices";
import AdminPurchaseOrders from "./pages/admin/AdminPurchaseOrders";
import AdminServices from "./pages/admin/AdminServices";
import AdminCustomerDatabase from "./pages/admin/AdminCustomerDatabase";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminFraudMonitoring from "./pages/admin/AdminFraudMonitoring";
import AdminDeviceVerification from "./pages/admin/AdminDeviceVerification";
import AdminGadgetCategories from "./pages/admin/AdminGadgetCategories";
import AdminRegions from "./pages/admin/AdminRegions";
import AdminPartnersManage from "./pages/admin/AdminPartnersManage";
import AdminUserRoles from "./pages/admin/AdminUserRoles";
import AdminLandingPage from "./pages/admin/AdminLandingPage";
import AdminDeviceApprovals from "./pages/admin/AdminDeviceApprovals";
import AdminApprovalChecklist from "./pages/admin/AdminApprovalChecklist";
import AdminPaymentSettings from "./pages/admin/AdminPaymentSettings";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminFinanceOverview from "./pages/admin/AdminFinanceOverview";
import AdminFinanceGST from "./pages/admin/AdminFinanceGST";
import AdminFinanceTransactions from "./pages/admin/AdminFinanceTransactions";
import AdminFinancePartnerPayments from "./pages/admin/AdminFinancePartnerPayments";
import AdminFinanceCompliance from "./pages/admin/AdminFinanceCompliance";
import ClaimAssignment from "./pages/admin/ClaimAssignment";
import ClaimsMonitoringDashboard from "./pages/admin/ClaimsMonitoringDashboard";
import AdminAccountDeletions from "./pages/admin/AdminAccountDeletions";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerSales from "./pages/partner/PartnerSales";
import PartnerCommissions from "./pages/partner/PartnerCommissions";
import PartnerCustomers from "./pages/partner/PartnerCustomers";
import PartnerSettings from "./pages/partner/PartnerSettings";
import PartnerFinance from "./pages/partner/PartnerFinance";
import PartnerPerformance from "./pages/partner/PartnerPerformance";
import PartnerTickets from "./pages/partner/PartnerTickets";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to={`/${user?.role}`} replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated && user ? <Navigate to={`/${user.role}`} replace /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated && user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />

      {/* Customer routes */}
      <Route path="/customer" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/customer/subscriptions" element={<ProtectedRoute role="customer"><CustomerSubscriptions /></ProtectedRoute>} />
      <Route path="/customer/claims" element={<ProtectedRoute role="customer"><CustomerClaims /></ProtectedRoute>} />
      <Route path="/customer/claims/:claimId" element={<ProtectedRoute role="customer"><ClaimDetailPage /></ProtectedRoute>} />
      <Route path="/customer/tickets" element={<ProtectedRoute role="customer"><CustomerTickets /></ProtectedRoute>} />
      <Route path="/customer/invoices" element={<ProtectedRoute role="customer"><CustomerInvoices /></ProtectedRoute>} />
      <Route path="/customer/profile" element={<ProtectedRoute role="customer"><CustomerProfile /></ProtectedRoute>} />
      <Route path="/customer/register-device" element={<ProtectedRoute role="customer"><DeviceOnboardingWizard /></ProtectedRoute>} />
      <Route path="/customer/devices" element={<ProtectedRoute role="customer"><CustomerDevices /></ProtectedRoute>} />
      <Route path="/customer/notifications" element={<ProtectedRoute role="customer"><CustomerNotifications /></ProtectedRoute>} />
      <Route path="/customer/feedback" element={<ProtectedRoute role="customer"><CustomerFeedback /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/gadget-categories" element={<ProtectedRoute role="admin"><AdminGadgetCategories /></ProtectedRoute>} />
      <Route path="/admin/regions" element={<ProtectedRoute role="admin"><AdminRegions /></ProtectedRoute>} />
      <Route path="/admin/partners-manage" element={<ProtectedRoute role="admin"><AdminPartnersManage /></ProtectedRoute>} />
      <Route path="/admin/subscriptions" element={<ProtectedRoute role="admin"><AdminSubscriptions /></ProtectedRoute>} />
      <Route path="/admin/subscription-plans" element={<ProtectedRoute role="admin"><AdminSubscriptionPlans /></ProtectedRoute>} />
      <Route path="/admin/invoices" element={<ProtectedRoute role="admin"><AdminInvoices /></ProtectedRoute>} />
      <Route path="/admin/purchase-orders" element={<ProtectedRoute role="admin"><AdminPurchaseOrders /></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute role="admin"><AdminServices /></ProtectedRoute>} />
      <Route path="/admin/customer-database" element={<ProtectedRoute role="admin"><AdminCustomerDatabase /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/fraud-monitoring" element={<ProtectedRoute role="admin"><AdminFraudMonitoring /></ProtectedRoute>} />
      <Route path="/admin/device-verification" element={<ProtectedRoute role="admin"><AdminDeviceVerification /></ProtectedRoute>} />
      <Route path="/admin/user-roles" element={<ProtectedRoute role="admin"><AdminUserRoles /></ProtectedRoute>} />
      <Route path="/admin/landing-page" element={<ProtectedRoute role="admin"><AdminLandingPage /></ProtectedRoute>} />
      <Route path="/admin/device-approvals" element={<ProtectedRoute role="admin"><AdminDeviceApprovals /></ProtectedRoute>} />
      <Route path="/admin/approval-checklist" element={<ProtectedRoute role="admin"><AdminApprovalChecklist /></ProtectedRoute>} />
      <Route path="/admin/payment-settings" element={<ProtectedRoute role="admin"><AdminPaymentSettings /></ProtectedRoute>} />
      <Route path="/admin/tickets" element={<ProtectedRoute role="admin"><AdminTickets /></ProtectedRoute>} />
      <Route path="/admin/finance" element={<ProtectedRoute role="admin"><AdminFinanceOverview /></ProtectedRoute>} />
      <Route path="/admin/finance-gst" element={<ProtectedRoute role="admin"><AdminFinanceGST /></ProtectedRoute>} />
      <Route path="/admin/finance-transactions" element={<ProtectedRoute role="admin"><AdminFinanceTransactions /></ProtectedRoute>} />
      <Route path="/admin/finance-partner-payments" element={<ProtectedRoute role="admin"><AdminFinancePartnerPayments /></ProtectedRoute>} />
      <Route path="/admin/finance-compliance" element={<ProtectedRoute role="admin"><AdminFinanceCompliance /></ProtectedRoute>} />
      <Route path="/admin/claim-assignment" element={<ProtectedRoute role="admin"><ClaimAssignment /></ProtectedRoute>} />
      <Route path="/admin/claims-monitoring" element={<ProtectedRoute role="admin"><ClaimsMonitoringDashboard /></ProtectedRoute>} />

      {/* Partner routes */}
      <Route path="/partner" element={<ProtectedRoute role="partner"><PartnerDashboard /></ProtectedRoute>} />
      <Route path="/partner/sales" element={<ProtectedRoute role="partner"><PartnerSales /></ProtectedRoute>} />
      <Route path="/partner/commissions" element={<ProtectedRoute role="partner"><PartnerCommissions /></ProtectedRoute>} />
      <Route path="/partner/finance" element={<ProtectedRoute role="partner"><PartnerFinance /></ProtectedRoute>} />
      <Route path="/partner/customers" element={<ProtectedRoute role="partner"><PartnerCustomers /></ProtectedRoute>} />
      <Route path="/partner/performance" element={<ProtectedRoute role="partner"><PartnerPerformance /></ProtectedRoute>} />
      <Route path="/partner/tickets" element={<ProtectedRoute role="partner"><PartnerTickets /></ProtectedRoute>} />
      <Route path="/partner/settings" element={<ProtectedRoute role="partner"><PartnerSettings /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
