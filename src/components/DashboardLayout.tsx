import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Shield, FileText, Ticket, User, LogOut, Package, Receipt,
  Wrench, TrendingUp, Users, ShoppingCart, Settings, ChevronLeft, Menu, Smartphone,
  Layers, MapPin, UserCog
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const customerNav: NavItem[] = [
  { label: 'Dashboard', path: '/customer', icon: <LayoutDashboard size={20} /> },
  { label: 'Subscriptions', path: '/customer/subscriptions', icon: <Shield size={20} /> },
  { label: 'Claims', path: '/customer/claims', icon: <FileText size={20} /> },
  { label: 'Service Tickets', path: '/customer/tickets', icon: <Ticket size={20} /> },
  { label: 'Profile', path: '/customer/profile', icon: <User size={20} /> },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
  { label: 'Gadget Categories', path: '/admin/gadget-categories', icon: <Layers size={20} /> },
  { label: 'Regions', path: '/admin/regions', icon: <MapPin size={20} /> },
  { label: 'Partners', path: '/admin/partners-manage', icon: <Users size={20} /> },
  { label: 'Subscriptions', path: '/admin/subscriptions', icon: <Shield size={20} /> },
  { label: 'Subscription Plans', path: '/admin/subscription-plans', icon: <Package size={20} /> },
  { label: 'Invoices', path: '/admin/invoices', icon: <Receipt size={20} /> },
  { label: 'Purchase Orders', path: '/admin/purchase-orders', icon: <Package size={20} /> },
  { label: 'Service Bookings', path: '/admin/services', icon: <Wrench size={20} /> },
  { label: 'Legacy Partners', path: '/admin/partners', icon: <Users size={20} /> },
  { label: 'Analytics', path: '/admin/analytics', icon: <TrendingUp size={20} /> },
  { label: 'Fraud Monitor', path: '/admin/fraud-monitoring', icon: <Shield size={20} /> },
  { label: 'Device Verification', path: '/admin/device-verification', icon: <Smartphone size={20} /> },
  { label: 'Users & Roles', path: '/admin/user-roles', icon: <UserCog size={20} /> },
];

const partnerNav: NavItem[] = [
  { label: 'Dashboard', path: '/partner', icon: <LayoutDashboard size={20} /> },
  { label: 'Sales', path: '/partner/sales', icon: <ShoppingCart size={20} /> },
  { label: 'Commissions', path: '/partner/commissions', icon: <Receipt size={20} /> },
  { label: 'Customers', path: '/partner/customers', icon: <Users size={20} /> },
  { label: 'Settings', path: '/partner/settings', icon: <Settings size={20} /> },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'partner' ? partnerNav : customerNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
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
