/**
 * WaaZ Test Data Generators
 * Factory functions for generating realistic test data matching the Supabase schema.
 * Usage: import { generateCustomer, generateBulk } from '@/test/data-generators';
 */

// ── Helpers ──

let _seq = 0;
const seq = () => ++_seq;
const uid = () => crypto.randomUUID();
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
};
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number, decimals = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const pastDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - rand(0, daysAgo));
  return d.toISOString();
};
const futureDate = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + rand(1, daysAhead));
  return d.toISOString();
};
const dateOnly = (iso: string) => iso.split('T')[0];

// ── Dictionaries ──

const FIRST_NAMES = [
  'Aarav', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Ananya', 'Arjun', 'Meera',
  'Karthik', 'Divya', 'Rahul', 'Neha', 'Aditya', 'Pooja', 'Suresh', 'Kavita',
  'Manish', 'Lakshmi', 'Rajesh', 'Sunita', 'Deepak', 'Anjali', 'Sanjay', 'Ritu',
];
const LAST_NAMES = [
  'Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Reddy', 'Nair', 'Iyer',
  'Mehta', 'Joshi', 'Verma', 'Rao', 'Das', 'Pillai', 'Bhat', 'Menon',
  'Chopra', 'Chauhan', 'Desai', 'Kulkarni', 'Mishra', 'Banerjee', 'Agarwal', 'Thakur',
];
const CITIES = [
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Kochi', state: 'Kerala' },
];
const PRODUCTS = [
  'iPhone 15 Pro', 'iPhone 14', 'Samsung Galaxy S24', 'Samsung Galaxy A54',
  'OnePlus 12', 'Xiaomi 14', 'Google Pixel 8', 'Vivo V30',
  'Oppo Reno 11', 'Realme GT 5', 'Nothing Phone 2', 'Motorola Edge 40',
  'iPad Air M2', 'Samsung Tab S9', 'MacBook Air M3', 'Dell XPS 15',
  'HP Spectre x360', 'Lenovo ThinkPad X1', 'Sony WH-1000XM5', 'Apple Watch Series 9',
];
const ISSUE_TYPES = [
  'Hardware Failure', 'Screen Damage', 'Battery Issue', 'Motherboard Failure',
  'Liquid Damage', 'Accidental Damage', 'Software Issue', 'Charging Port Damage',
  'Speaker Malfunction', 'Camera Issue',
];
const CLAIM_STATUSES = [
  'pending', 'in_review', 'approved', 'assigned',
  'in_repair', 'quality_check', 'ready_delivery', 'completed', 'rejected',
];
const DEVICE_STATUSES = ['pending', 'approved', 'rejected'];
const TICKET_CATEGORIES = [
  'Payment Issue', 'Subscription Query', 'Device Registration',
  'Claim Status', 'Technical Support', 'Account Issue',
  'Billing Dispute', 'Feedback', 'Feature Request', 'General Inquiry',
];
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
const PARTNER_TYPES = ['technical', 'non-technical'] as const;
const PARTNER_NAMES = [
  'TechFix Solutions', 'Digital Care Hub', 'GadgetGuard Services',
  'MobileFirst Repairs', 'QuickFix Electronics', 'SmartDevice Clinic',
  'ProRepair India', 'DeviceMasters', 'CellCare Solutions', 'FixIt Express',
  'TechSavvy Repairs', 'Digital Zone Resellers', 'GizmoFix Pro', 'RapidRepair Co',
];
const PAYMENT_METHODS = ['upi', 'bank_transfer', 'card', 'cash'] as const;
const FEEDBACK_TYPES = ['service', 'platform', 'partner', 'general'] as const;
const COMMISSION_STATUSES = ['calculated', 'approved', 'paid', 'disputed'] as const;

const DESCRIPTIONS: Record<string, string[]> = {
  'Hardware Failure': [
    'Device suddenly stopped working. No response to power button.',
    'Random restarts and overheating during normal use.',
    'Touchscreen unresponsive in certain areas.',
  ],
  'Screen Damage': [
    'Cracked screen after accidental drop from table.',
    'Display showing colored lines and flickering.',
    'Dead pixels appearing across the screen.',
  ],
  'Battery Issue': [
    'Battery draining within 2 hours of full charge.',
    'Device not charging beyond 80%.',
    'Battery swelling noticed — device back panel lifting.',
  ],
  'Motherboard Failure': [
    'Device not powering on at all after firmware update.',
    'Continuous boot loop — cannot access home screen.',
    'All functions failing — suspected motherboard damage.',
  ],
  default: [
    'Device experiencing intermittent issues requiring professional diagnosis.',
    'Multiple components malfunctioning simultaneously.',
    'Issue started after recent software update.',
  ],
};

// ── Name & Contact Generators ──

const randomName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
const randomEmail = (name?: string) => {
  const base = name
    ? name.toLowerCase().replace(/\s+/g, '.') + seq()
    : `user${seq()}.${rand(100, 999)}`;
  return `${base}@waaz.test`;
};
const randomPhone = () => `${pick(['91', '98', '97', '96', '95', '94', '93'])}${rand(10000000, 99999999)}`;
const randomImei = () => Array.from({ length: 15 }, () => rand(0, 9)).join('');
const randomSerial = () => `SN-${rand(100000, 999999)}-${String.fromCharCode(65 + rand(0, 25))}${String.fromCharCode(65 + rand(0, 25))}`;
const randomWhatsapp = () => `+91${rand(7000000000, 9999999999)}`;
const randomAddress = () => {
  const loc = pick(CITIES);
  return `${rand(1, 500)}, ${pick(['MG Road', 'Station Road', 'Main Street', 'Park Avenue', 'Lake View', 'Hill Road', 'Market Street'])}, ${loc.city}, ${loc.state} ${rand(100000, 999999)}`;
};
const randomUpiId = () => `TXN${Date.now()}${rand(1000, 9999)}`;

// ══════════════════════════════════════════
// Factory Functions
// ══════════════════════════════════════════

// ── 1. Admin User ──

export interface GeneratedAdminUser {
  profile: { id: string; full_name: string; email: string; phone: string; company: string; created_at: string; updated_at: string };
  role: { id: string; user_id: string; role: 'admin' };
  credentials: { email: string; password: string };
}

export function generateAdminUser(overrides: Partial<GeneratedAdminUser['profile']> = {}): GeneratedAdminUser {
  const id = uid();
  const name = overrides.full_name || randomName();
  const email = overrides.email || randomEmail(name);
  const now = new Date().toISOString();

  return {
    profile: {
      id, full_name: name, email, phone: randomPhone(),
      company: 'WaaZ Technologies Pvt Ltd',
      created_at: now, updated_at: now,
      ...overrides,
    },
    role: { id: uid(), user_id: id, role: 'admin' },
    credentials: { email, password: 'Test@1234' },
  };
}

// ── 2. Partner User ──

export interface GeneratedPartner {
  profile: { id: string; full_name: string; email: string; phone: string; company: string | null; created_at: string; updated_at: string };
  role: { id: string; user_id: string; role: 'partner' };
  partner: {
    id: string; user_id: string; name: string; email: string; phone: string;
    city: string; state: string; partner_type: string; commission_rate: number;
    quality_rating: number; sla_turnaround_days: number; total_repairs: number;
    is_active: boolean; region_id: string | null;
    created_at: string; updated_at: string;
  };
  credentials: { email: string; password: string };
}

export function generatePartner(overrides: Partial<GeneratedPartner['partner']> = {}): GeneratedPartner {
  const userId = uid();
  const partnerId = uid();
  const name = overrides.name || pick(PARTNER_NAMES) + ` ${seq()}`;
  const loc = pick(CITIES);
  const email = overrides.email || randomEmail(name);
  const now = new Date().toISOString();

  return {
    profile: {
      id: userId, full_name: name, email, phone: randomPhone(),
      company: name, created_at: now, updated_at: now,
    },
    role: { id: uid(), user_id: userId, role: 'partner' },
    partner: {
      id: partnerId, user_id: userId, name, email, phone: randomPhone(),
      city: loc.city, state: loc.state,
      partner_type: pick([...PARTNER_TYPES]),
      commission_rate: pick([8, 10, 12, 15]),
      quality_rating: randFloat(3.5, 5.0),
      sla_turnaround_days: pick([5, 7, 10]),
      total_repairs: rand(0, 500),
      is_active: true,
      region_id: null,
      created_at: now, updated_at: now,
      ...overrides,
    },
    credentials: { email, password: 'Test@1234' },
  };
}

// ── 3. Customer User ──

export interface GeneratedCustomer {
  profile: { id: string; full_name: string; email: string; phone: string; company: string | null; created_at: string; updated_at: string };
  role: { id: string; user_id: string; role: 'customer' };
  devices: ReturnType<typeof generateDevice>[];
  credentials: { email: string; password: string };
}

export function generateCustomer(
  overrides: Partial<GeneratedCustomer['profile']> = {},
  deviceCount?: number
): GeneratedCustomer {
  const id = overrides.id || uid();
  const name = overrides.full_name || randomName();
  const email = overrides.email || randomEmail(name);
  const now = new Date().toISOString();
  const numDevices = deviceCount ?? rand(1, 5);

  return {
    profile: {
      id, full_name: name, email, phone: randomPhone(),
      company: null, created_at: now, updated_at: now,
      ...overrides,
    },
    role: { id: uid(), user_id: id, role: 'customer' },
    devices: Array.from({ length: numDevices }, () => generateDevice({ user_id: id })),
    credentials: { email, password: 'Test@1234' },
  };
}

// ── 4. Device ──

export interface GeneratedDevice {
  id: string; user_id: string; product_name: string; serial_number: string;
  imei_number: string; whatsapp_number: string; address: string;
  status: string; payment_status: string; payment_method: string | null;
  upi_transaction_id: string | null; auto_renew: boolean;
  gadget_category_id: string | null; subscription_plan_id: string | null;
  subscription_start: string | null; subscription_end: string | null;
  approved_at: string | null; approved_by: string | null;
  rejected_at: string | null; rejected_by: string | null; rejection_reason: string | null;
  referred_by_partner_id: string | null; google_location_pin: string | null;
  created_at: string; updated_at: string;
}

export function generateDevice(overrides: Partial<GeneratedDevice> = {}): GeneratedDevice {
  const status = overrides.status || pick(DEVICE_STATUSES);
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const subStart = isApproved ? pastDate(300) : null;
  const subEnd = isApproved ? futureDate(365) : null;
  const now = new Date().toISOString();

  return {
    id: uid(),
    user_id: overrides.user_id || uid(),
    product_name: pick(PRODUCTS),
    serial_number: randomSerial(),
    imei_number: randomImei(),
    whatsapp_number: randomWhatsapp(),
    address: randomAddress(),
    status,
    payment_status: isApproved ? 'completed' : 'pending',
    payment_method: isApproved ? pick([...PAYMENT_METHODS]) : null,
    upi_transaction_id: isApproved ? randomUpiId() : null,
    auto_renew: rand(0, 1) === 1,
    gadget_category_id: null,
    subscription_plan_id: null,
    subscription_start: subStart ? dateOnly(subStart) : null,
    subscription_end: subEnd ? dateOnly(subEnd) : null,
    approved_at: isApproved ? pastDate(200) : null,
    approved_by: isApproved ? uid() : null,
    rejected_at: isRejected ? pastDate(30) : null,
    rejected_by: isRejected ? uid() : null,
    rejection_reason: isRejected ? pick(['IMEI mismatch', 'Fraudulent serial number', 'Duplicate device', 'Unsupported device model']) : null,
    referred_by_partner_id: null,
    google_location_pin: null,
    created_at: pastDate(365),
    updated_at: now,
    ...overrides,
  };
}

// ── 5. Service Claim ──

export interface GeneratedClaim {
  claim: {
    id: string; user_id: string; device_id: string | null; imei_number: string;
    issue_type: string; description: string; status: string;
    assigned_partner_id: string | null; admin_notes: string | null;
    image_urls: string[]; created_at: string; updated_at: string;
  };
  statusUpdates: { id: string; claim_id: string; status: string; notes: string; created_at: string }[];
  messages: { id: string; claim_id: string; sender_id: string; sender_role: string; message: string; created_at: string }[];
}

export function generateClaim(overrides: Partial<GeneratedClaim['claim']> = {}): GeneratedClaim {
  const claimId = uid();
  const userId = overrides.user_id || uid();
  const issueType = overrides.issue_type || pick(ISSUE_TYPES);
  const status = overrides.status || pick(CLAIM_STATUSES);
  const descs = DESCRIPTIONS[issueType] || DESCRIPTIONS.default;
  const createdAt = overrides.created_at || pastDate(90);
  const isAssigned = ['assigned', 'in_repair', 'quality_check', 'ready_delivery', 'completed'].includes(status);
  const partnerId = isAssigned ? (overrides.assigned_partner_id || uid()) : null;

  // Build realistic status history
  const statusIndex = CLAIM_STATUSES.indexOf(status);
  const history = CLAIM_STATUSES.slice(0, statusIndex + 1);
  const statusUpdates = history.map((s, i) => ({
    id: uid(),
    claim_id: claimId,
    status: s,
    notes: `Status changed to ${s}`,
    created_at: new Date(new Date(createdAt).getTime() + i * 86400000).toISOString(),
  }));

  // Generate 0-3 messages
  const msgCount = rand(0, 3);
  const messages = Array.from({ length: msgCount }, (_, i) => ({
    id: uid(),
    claim_id: claimId,
    sender_id: i % 2 === 0 ? userId : (partnerId || uid()),
    sender_role: i % 2 === 0 ? 'customer' : 'partner',
    message: pick([
      'When can I expect my device back?',
      'Repair is in progress. Will update once done.',
      'Parts have been ordered, expected delivery in 2 days.',
      'Quality check passed. Device is ready for pickup.',
      'Thank you for the update.',
      'Can you provide a tracking number?',
    ]),
    created_at: new Date(new Date(createdAt).getTime() + (i + 1) * 43200000).toISOString(),
  }));

  return {
    claim: {
      id: claimId,
      user_id: userId,
      device_id: overrides.device_id || null,
      imei_number: overrides.imei_number || randomImei(),
      issue_type: issueType,
      description: pick(descs),
      status,
      assigned_partner_id: partnerId,
      admin_notes: isAssigned ? pick(['Priority case', 'Standard SLA', 'Expedite if possible', null]) : null,
      image_urls: [],
      created_at: createdAt,
      updated_at: new Date().toISOString(),
      ...overrides,
    },
    statusUpdates,
    messages,
  };
}

// ── 6. Support Ticket ──

export interface GeneratedTicket {
  ticket: {
    id: string; user_id: string; subject: string; description: string;
    status: string; priority: string; admin_response: string | null;
    image_urls: string[]; created_at: string; updated_at: string;
  };
  messages: { id: string; ticket_id: string; sender_id: string; sender_role: string; message: string; created_at: string }[];
}

export function generateTicket(overrides: Partial<GeneratedTicket['ticket']> = {}): GeneratedTicket {
  const ticketId = uid();
  const userId = overrides.user_id || uid();
  const category = pick(TICKET_CATEGORIES);
  const status = overrides.status || pick([...TICKET_STATUSES]);
  const priority = overrides.priority || pick([...TICKET_PRIORITIES]);
  const createdAt = overrides.created_at || pastDate(60);
  const isResolved = ['resolved', 'closed'].includes(status);

  const descriptions: Record<string, string> = {
    'Payment Issue': 'UPI payment was debited but my subscription status still shows pending.',
    'Subscription Query': 'I want to upgrade my plan from Basic to Premium. How do I proceed?',
    'Device Registration': 'Unable to register my new device. The IMEI field shows an error.',
    'Claim Status': 'My claim has been in review for over a week. Need an update.',
    'Technical Support': 'App is crashing when I try to open my device details page.',
    'Account Issue': 'Need to update my registered email address and phone number.',
    'Billing Dispute': 'I was charged twice for my annual subscription renewal.',
    'Feedback': 'Great service! The repair was done within 3 days as promised.',
    'Feature Request': 'Would be great to have a chat feature with the repair partner.',
    'General Inquiry': 'What is the coverage policy for water damage on the Premium plan?',
  };

  // Generate 1-4 messages
  const msgCount = rand(1, 4);
  const messages = Array.from({ length: msgCount }, (_, i) => ({
    id: uid(),
    ticket_id: ticketId,
    sender_id: i % 2 === 0 ? userId : uid(),
    sender_role: i % 2 === 0 ? 'customer' : 'admin',
    message: pick([
      'Please help resolve this issue.',
      'We are looking into this. Will update shortly.',
      'Can you provide more details or screenshots?',
      'Thank you, the issue has been resolved.',
      'I have the same issue again. Please reopen.',
      'We have escalated this to our technical team.',
    ]),
    created_at: new Date(new Date(createdAt).getTime() + (i + 1) * 7200000).toISOString(),
  }));

  return {
    ticket: {
      id: ticketId,
      user_id: userId,
      subject: category,
      description: descriptions[category] || 'Need assistance with my account.',
      status,
      priority,
      admin_response: isResolved ? 'Issue has been resolved. Please let us know if you need further help.' : null,
      image_urls: [],
      created_at: createdAt,
      updated_at: new Date().toISOString(),
      ...overrides,
    },
    messages,
  };
}

// ── 7. Commission ──

export function generateCommission(overrides: Partial<{
  id: string; partner_id: string; claim_id: string; claim_amount: number;
  base_commission_rate: number; base_commission_amount: number;
  sla_bonus: number; rating_bonus: number; volume_bonus: number;
  penalty_deduction: number; total_commission: number;
  commission_month: string; status: string;
  created_at: string; updated_at: string;
}> = {}) {
  const claimAmount = overrides.claim_amount || rand(500, 15000);
  const rate = overrides.base_commission_rate || pick([8, 10, 12, 15]);
  const baseComm = parseFloat((claimAmount * rate / 100).toFixed(2));
  const slaBonus = rand(0, 1) ? randFloat(50, 300) : 0;
  const ratingBonus = rand(0, 1) ? randFloat(25, 200) : 0;
  const volumeBonus = rand(0, 1) ? randFloat(100, 500) : 0;
  const penalty = rand(0, 3) === 0 ? randFloat(50, 200) : 0;
  const total = parseFloat((baseComm + slaBonus + ratingBonus + volumeBonus - penalty).toFixed(2));
  const now = new Date().toISOString();

  return {
    id: uid(),
    partner_id: overrides.partner_id || uid(),
    claim_id: overrides.claim_id || uid(),
    claim_amount: claimAmount,
    base_commission_rate: rate,
    base_commission_amount: baseComm,
    sla_bonus: slaBonus,
    rating_bonus: ratingBonus,
    volume_bonus: volumeBonus,
    penalty_deduction: penalty,
    total_commission: total,
    commission_month: overrides.commission_month || new Date().toISOString().slice(0, 7),
    status: overrides.status || pick([...COMMISSION_STATUSES]),
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

// ── 8. Notification ──

export function generateNotification(overrides: Partial<{
  id: string; user_id: string; type: string; title: string;
  message: string; related_id: string | null; is_read: boolean; created_at: string;
}> = {}) {
  const types = [
    { type: 'claim_assigned', title: 'New claim assigned', message: 'A new service claim has been assigned to you.' },
    { type: 'claim_updated', title: 'Claim status updated', message: 'Your claim status has been updated.' },
    { type: 'device_decision', title: 'Device approved', message: 'Your device has been approved and subscription is active.' },
    { type: 'delivery_scheduled', title: 'Delivery scheduled', message: 'Your repaired device is scheduled for delivery.' },
  ];
  const t = pick(types);

  return {
    id: uid(),
    user_id: overrides.user_id || uid(),
    type: overrides.type || t.type,
    title: overrides.title || t.title,
    message: overrides.message || t.message,
    related_id: overrides.related_id || null,
    is_read: overrides.is_read ?? (rand(0, 1) === 1),
    created_at: overrides.created_at || pastDate(30),
    ...overrides,
  };
}

// ── 9. Feedback ──

export function generateFeedback(overrides: Partial<{
  id: string; user_id: string; rating: number; feedback_text: string;
  feedback_type: string; related_claim_id: string | null;
  related_device_id: string | null; created_at: string;
}> = {}) {
  const feedbackTexts = [
    'Excellent service! Very prompt and professional.',
    'Good experience overall. Minor delays but quality work.',
    'Average service. Could improve communication.',
    'Satisfactory repair but took longer than expected.',
    'Outstanding! Device works perfectly after repair.',
  ];

  return {
    id: uid(),
    user_id: overrides.user_id || uid(),
    rating: overrides.rating || rand(1, 5),
    feedback_text: overrides.feedback_text || pick(feedbackTexts),
    feedback_type: overrides.feedback_type || pick([...FEEDBACK_TYPES]),
    related_claim_id: overrides.related_claim_id || null,
    related_device_id: overrides.related_device_id || null,
    created_at: overrides.created_at || pastDate(90),
    ...overrides,
  };
}

// ── 10. NPS Survey ──

export function generateNpsSurvey(overrides: Partial<{
  id: string; user_id: string; score: number; comment: string | null; created_at: string;
}> = {}) {
  const comments = [
    'Love the warranty coverage — peace of mind!',
    'Fast repairs, would recommend to friends.',
    'Good concept but app needs improvement.',
    'Very satisfied with the overall experience.',
    null,
  ];

  return {
    id: uid(),
    user_id: overrides.user_id || uid(),
    score: overrides.score || rand(0, 10),
    comment: overrides.comment !== undefined ? overrides.comment : pick(comments),
    created_at: overrides.created_at || pastDate(60),
    ...overrides,
  };
}

// ══════════════════════════════════════════
// Bulk Generation & Scenarios
// ══════════════════════════════════════════

export function generateBulk<T>(factory: (overrides?: any) => T, count: number, overrides?: any): T[] {
  return Array.from({ length: count }, () => factory(overrides));
}

/** Generate a complete test scenario with interconnected data */
export function generateFullScenario(options: {
  adminCount?: number;
  partnerCount?: number;
  customerCount?: number;
  claimsPerCustomer?: number;
  ticketsPerCustomer?: number;
} = {}) {
  const {
    adminCount = 2,
    partnerCount = 5,
    customerCount = 10,
    claimsPerCustomer = 2,
    ticketsPerCustomer = 1,
  } = options;

  const admins = generateBulk(generateAdminUser, adminCount);
  const partners = generateBulk(generatePartner, partnerCount);
  const customers = generateBulk(generateCustomer, customerCount);

  const claims: GeneratedClaim[] = [];
  const tickets: GeneratedTicket[] = [];
  const commissions: ReturnType<typeof generateCommission>[] = [];
  const notifications: ReturnType<typeof generateNotification>[] = [];

  customers.forEach((customer) => {
    // Claims linked to customer devices
    for (let i = 0; i < claimsPerCustomer; i++) {
      const device = customer.devices[i % customer.devices.length];
      const partner = pick(partners);
      const claim = generateClaim({
        user_id: customer.profile.id,
        device_id: device.id,
        imei_number: device.imei_number,
        assigned_partner_id: partner.partner.id,
      });
      claims.push(claim);

      // Commission for completed claims
      if (claim.claim.status === 'completed') {
        commissions.push(generateCommission({
          partner_id: partner.partner.id,
          claim_id: claim.claim.id,
        }));
      }

      // Notification
      notifications.push(generateNotification({
        user_id: customer.profile.id,
        type: 'claim_updated',
        related_id: claim.claim.id,
      }));
    }

    // Support tickets
    for (let i = 0; i < ticketsPerCustomer; i++) {
      tickets.push(generateTicket({ user_id: customer.profile.id }));
    }
  });

  return { admins, partners, customers, claims, tickets, commissions, notifications };
}

/** Reset the sequence counter (useful between test suites) */
export function resetSequence() {
  _seq = 0;
}
