import type { User, SubscriptionPlan, CustomerDevice, Claim, ServiceTicket, Invoice, PurchaseOrder, RepairPartner, PartnerSale, MonthlyTrend } from '@/types';

export const mockUsers: User[] = [
  { id: 'c1', name: 'Rajesh Kumar', email: 'rajesh@example.com', role: 'customer', phone: '+91 98765 43210' },
  { id: 'a1', name: 'Priya Sharma', email: 'priya@waaz.in', role: 'admin', phone: '+91 98765 11111', company: 'WaaZ' },
  { id: 'p1', name: 'Vikram Singh', email: 'vikram@techfix.in', role: 'partner', phone: '+91 98765 22222', company: 'TechFix Coonoor' },
];

export const subscriptionPlans: SubscriptionPlan[] = [
  { id: 'sp1', name: 'WaaZ Standard Care', code: 'standard', annualPrice: 899, coversHardwareFailure: true, coversBattery: true, coversMotherboard: true, coversAccidentalDamage: false, coversLiquidDamage: false },
  { id: 'sp2', name: 'WaaZ+ Complete Care', code: 'complete', annualPrice: 1599, coversHardwareFailure: true, coversBattery: true, coversMotherboard: true, coversAccidentalDamage: true, coversLiquidDamage: true },
];

export const customerDevices: CustomerDevice[] = [
  { id: 'd1', customerId: 'c1', deviceType: 'Smartphone', brand: 'Samsung', model: 'Galaxy S23', imei: '354678091234567', purchaseDate: '2025-06-15', subscriptionPlanId: 'sp2', subscriptionStart: '2025-06-15', subscriptionEnd: '2026-06-15', status: 'active' },
  { id: 'd2', customerId: 'c1', deviceType: 'Smartphone', brand: 'Apple', model: 'iPhone 15', imei: '354678091234999', purchaseDate: '2025-09-01', subscriptionPlanId: 'sp1', subscriptionStart: '2025-09-01', subscriptionEnd: '2026-09-01', status: 'active' },
];

export const claims: Claim[] = [
  { id: 'cl1', customerId: 'c1', deviceId: 'd1', claimDate: '2025-12-10', issueType: 'Hardware Failure', description: 'Screen not responding to touch', status: 'completed', repairPartnerId: 'rp1', turnaroundDays: 4, images: [] },
  { id: 'cl2', customerId: 'c1', deviceId: 'd2', claimDate: '2026-02-20', issueType: 'Battery Issue', description: 'Battery draining too fast', status: 'in_repair', repairPartnerId: 'rp2', turnaroundDays: 3, images: [] },
];

export const serviceTickets: ServiceTicket[] = [
  { id: 'st1', customerId: 'c1', subject: 'Cannot access claim portal', description: 'Getting error when trying to submit a new claim', status: 'resolved', priority: 'high', createdAt: '2026-01-15', images: [] },
  { id: 'st2', customerId: 'c1', subject: 'Subscription renewal query', description: 'Want to upgrade from Standard to Complete care', status: 'open', priority: 'medium', createdAt: '2026-03-01', images: [] },
];

export const invoices: Invoice[] = [
  { id: 'inv1', invoiceNumber: 'INV-2025-001', customerId: 'c1', customerName: 'Rajesh Kumar', amount: 1599, status: 'paid', date: '2025-06-15', dueDate: '2025-07-15' },
  { id: 'inv2', invoiceNumber: 'INV-2025-002', customerId: 'c1', customerName: 'Rajesh Kumar', amount: 899, status: 'paid', date: '2025-09-01', dueDate: '2025-10-01' },
  { id: 'inv3', invoiceNumber: 'INV-2026-003', customerId: 'c2', customerName: 'Anita Desai', amount: 1599, status: 'pending', date: '2026-02-01', dueDate: '2026-03-01' },
  { id: 'inv4', invoiceNumber: 'INV-2026-004', customerId: 'c3', customerName: 'Mohammed Ali', amount: 899, status: 'overdue', date: '2026-01-01', dueDate: '2026-02-01' },
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: 'po1', poNumber: 'PO-2026-001', vendor: 'Samsung Parts India', amount: 45000, status: 'received', date: '2026-01-10', items: ['LCD Screen', 'Battery Pack', 'Charging Port'] },
  { id: 'po2', poNumber: 'PO-2026-002', vendor: 'Apple Authorized Parts', amount: 72000, status: 'confirmed', date: '2026-02-15', items: ['Display Assembly', 'Battery', 'Speaker Module'] },
  { id: 'po3', poNumber: 'PO-2026-003', vendor: 'Universal Mobile Parts', amount: 28000, status: 'draft', date: '2026-03-01', items: ['Adhesive Strips', 'Screws Kit', 'Tools'] },
];

export const repairPartners: RepairPartner[] = [
  { id: 'rp1', name: 'TechFix Coonoor', city: 'Coonoor', state: 'Tamil Nadu', slaTurnaroundTime: 7, commissionRate: 10, qualityRating: 5.0, isActive: true, totalRepairs: 156 },
  { id: 'rp2', name: 'Mobile Care Chennai', city: 'Chennai', state: 'Tamil Nadu', slaTurnaroundTime: 5, commissionRate: 10, qualityRating: 4.8, isActive: true, totalRepairs: 312 },
  { id: 'rp3', name: 'QuickFix Coimbatore', city: 'Coimbatore', state: 'Tamil Nadu', slaTurnaroundTime: 7, commissionRate: 10, qualityRating: 4.5, isActive: true, totalRepairs: 89 },
];

export const partnerSales: PartnerSale[] = [
  { id: 'ps1', partnerId: 'p1', customerName: 'Suresh Menon', planSold: 'WaaZ+ Complete Care', amount: 1599, commission: 159.9, date: '2026-02-15', status: 'completed' },
  { id: 'ps2', partnerId: 'p1', customerName: 'Deepa Nair', planSold: 'WaaZ Standard Care', amount: 899, commission: 89.9, date: '2026-02-28', status: 'completed' },
  { id: 'ps3', partnerId: 'p1', customerName: 'Karthik Raj', planSold: 'WaaZ+ Complete Care', amount: 1599, commission: 159.9, date: '2026-03-05', status: 'pending' },
  { id: 'ps4', partnerId: 'p1', customerName: 'Lakshmi Iyer', planSold: 'WaaZ Standard Care', amount: 899, commission: 89.9, date: '2026-03-10', status: 'completed' },
];

export const monthlyTrends: MonthlyTrend[] = [
  { month: 'Oct', subscriptions: 120, claims: 18, revenue: 125000 },
  { month: 'Nov', subscriptions: 185, claims: 25, revenue: 198000 },
  { month: 'Dec', subscriptions: 240, claims: 32, revenue: 285000 },
  { month: 'Jan', subscriptions: 310, claims: 28, revenue: 345000 },
  { month: 'Feb', subscriptions: 380, claims: 35, revenue: 420000 },
  { month: 'Mar', subscriptions: 450, claims: 40, revenue: 510000 },
];
