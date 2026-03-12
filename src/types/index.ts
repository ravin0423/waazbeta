export type UserRole = 'customer' | 'admin' | 'partner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  company?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: 'standard' | 'complete';
  annualPrice: number;
  coversHardwareFailure: boolean;
  coversBattery: boolean;
  coversMotherboard: boolean;
  coversAccidentalDamage: boolean;
  coversLiquidDamage: boolean;
}

export interface CustomerDevice {
  id: string;
  customerId: string;
  deviceType: string;
  brand: string;
  model: string;
  imei: string;
  purchaseDate: string;
  subscriptionPlanId: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  status: 'active' | 'expired' | 'pending';
}

export interface Claim {
  id: string;
  customerId: string;
  deviceId: string;
  claimDate: string;
  issueType: string;
  description: string;
  status: 'submitted' | 'in_review' | 'approved' | 'in_repair' | 'completed' | 'rejected';
  repairPartnerId?: string;
  images?: string[];
  qrCode?: string;
  turnaroundDays?: number;
}

export interface ServiceTicket {
  id: string;
  customerId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  images?: string[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  date: string;
  dueDate: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  amount: number;
  status: 'draft' | 'confirmed' | 'received' | 'cancelled';
  date: string;
  items: string[];
}

export interface RepairPartner {
  id: string;
  name: string;
  city: string;
  state: string;
  slaTurnaroundTime: number;
  commissionRate: number;
  qualityRating: number;
  isActive: boolean;
  totalRepairs: number;
}

export interface PartnerSale {
  id: string;
  partnerId: string;
  customerName: string;
  planSold: string;
  amount: number;
  commission: number;
  date: string;
  status: 'completed' | 'pending';
}

export interface KPIMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: string;
}

export interface MonthlyTrend {
  month: string;
  subscriptions: number;
  claims: number;
  revenue: number;
}
