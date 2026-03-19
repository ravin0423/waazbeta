import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Shield, FileText, Ticket, User, LogOut, Package, Receipt,
  Wrench, TrendingUp, Users, ShoppingCart, Settings, ChevronLeft, Menu, Smartphone,
  Layers, MapPin, UserCog, Globe, ShieldCheck, ListChecks, QrCode, IndianRupee,
  ChevronDown, Wallet, BadgeCheck, Building2, Target, Activity, Bell, Star, UserX
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import NotificationBell from '@/components/NotificationBell';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const customerNavFull: NavItem[] = [
  { label: 'Dashboard', path: '/customer', icon: <LayoutDashboard size={20} /> },
  { label: 'My Devices', path: '/customer/devices', icon: <Smartphone size={20} /> },
  { label: 'Subscriptions', path: '/customer/subscriptions', icon: <Shield size={20} /> },
  { label: 'Claims', path: '/customer/claims', icon: <FileText size={20} /> },
  { label: 'Invoices', path: '/customer/invoices', icon: <Receipt size={20} /> },
  { label: 'Service Tickets', path: '/customer/tickets', icon: <Ticket size={20} /> },
  { label: 'Notifications', path: '/customer/notifications', icon: <Bell size={20} /> },
  { label: 'Feedback', path: '/customer/feedback', icon: <Star size={20} /> },
  { label: 'Profile', path: '/customer/profile', icon: <User size={20} /> },
];


const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
  { label: 'Gadget Categories', path: '/admin/gadget-categories', icon: <Layers size={20} /> },
  { label: 'Regions', path: '/admin/regions', icon: <MapPin size={20} /> },
  { label: 'Partners', path: '/admin/partners-manage', icon: <Users size={20} /> },
  { label: 'Subscriptions', path: '/admin/subscriptions', icon: <Shield size={20} /> },
  { label: 'Subscription Plans', path: '/admin/subscription-plans', icon: <Package size={20} /> },
  {
    label: 'Finance', path: '/admin/finance', icon: <IndianRupee size={20} />,
    children: [
      { label: 'Overview', path: '/admin/finance', icon: <TrendingUp size={18} /> },
      { label: 'Invoices', path: '/admin/invoices', icon: <Receipt size={18} /> },
      { label: 'GST & Tax Filing', path: '/admin/finance-gst', icon: <FileText size={18} /> },
      { label: 'Income & Expenses', path: '/admin/finance-transactions', icon: <Wallet size={18} /> },
      { label: 'Partner Payments', path: '/admin/finance-partner-payments', icon: <Users size={18} /> },
      { label: 'Compliance & MSME', path: '/admin/finance-compliance', icon: <BadgeCheck size={18} /> },
    ],
  },
  { label: 'Purchase Orders', path: '/admin/purchase-orders', icon: <Package size={20} /> },
  { label: 'Service Bookings', path: '/admin/services', icon: <Wrench size={20} /> },
  { label: 'Claim Assignment', path: '/admin/claim-assignment', icon: <Target size={20} /> },
  { label: 'Claims Monitor', path: '/admin/claims-monitoring', icon: <Activity size={20} /> },
  { label: 'Support Tickets', path: '/admin/tickets', icon: <Ticket size={20} /> },
  { label: 'Customer Database', path: '/admin/customer-database', icon: <Users size={20} /> },
  { label: 'Analytics', path: '/admin/analytics', icon: <TrendingUp size={20} /> },
  { label: 'Fraud Monitor', path: '/admin/fraud-monitoring', icon: <Shield size={20} /> },
  { label: 'Device Verification', path: '/admin/device-verification', icon: <Smartphone size={20} /> },
  { label: 'Approvals', path: '/admin/device-approvals', icon: <ShieldCheck size={20} /> },
  { label: 'Approval Checklist', path: '/admin/approval-checklist', icon: <ListChecks size={20} /> },
  { label: 'Payment Settings', path: '/admin/payment-settings', icon: <QrCode size={20} /> },
  { label: 'Users & Roles', path: '/admin/user-roles', icon: <UserCog size={20} /> },
  { label: 'Landing Page', path: '/admin/landing-page', icon: <Globe size={20} /> },
  { label: 'Account Deletions', path: '/admin/account-deletions', icon: <UserX size={20} /> },
];

const partnerNav: NavItem[] = [
  { label: 'Dashboard', path: '/partner', icon: <LayoutDashboard size={20} /> },
  { label: 'Sales', path: '/partner/sales', icon: <ShoppingCart size={20} /> },
  { label: 'Commissions', path: '/partner/commissions', icon: <Receipt size={20} /> },
  { label: 'My Financials', path: '/partner/finance', icon: <IndianRupee size={20} /> },
  { label: 'Performance', path: '/partner/performance', icon: <TrendingUp size={20} /> },
  { label: 'Support Tickets', path: '/partner/tickets', icon: <Ticket size={20} /> },
  { label: 'Customers', path: '/partner/customers', icon: <Users size={20} /> },
  { label: 'Settings', path: '/partner/settings', icon: <Settings size={20} /> },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const getNavItems = () => {
    if (user?.role === 'admin') return adminNav;
    if (user?.role === 'partner') return partnerNav;
    return customerNavFull;
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const roleLabel = user?.role === 'admin' ? 'Admin Panel' : user?.role === 'partner' ? 'Partner Portal' : 'Customer Portal';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative z-50 h-full flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
          collapsed ? "w-[70px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary">
            <Shield size={20} className="text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-heading text-lg font-bold text-sidebar-foreground">WaaZ</h1>
              <p className="text-xs text-sidebar-foreground/60">{roleLabel}</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const hasChildren = item.children && item.children.length > 0;
            const isChildActive = hasChildren && item.children!.some(c => location.pathname === c.path);
            const isExpanded = expandedGroups.includes(item.label) || isChildActive;

            if (hasChildren) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => {
                      if (collapsed) return;
                      setExpandedGroups(prev => prev.includes(item.label) ? prev.filter(g => g !== item.label) : [...prev, item.label]);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isChildActive
                        ? "bg-sidebar-primary/10 text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {item.icon}
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown size={14} className={cn("transition-transform", isExpanded && "rotate-180")} />
                      </>
                    )}
                  </button>
                  {!collapsed && isExpanded && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                      {item.children!.map(child => {
                        const childActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors",
                              childActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            {child.icon}
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 mb-3">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                {user?.fullName?.charAt(0) || user?.email?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.fullName || 'User'}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-8 h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated"
        >
          <ChevronLeft size={14} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-3">
          <button className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <NotificationBell />
          <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
