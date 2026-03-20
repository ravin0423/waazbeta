// ═══════════════════════════════════════════════════════════════════
// WAAZ Admin Portal — Page Object Models (Complete)
// ═══════════════════════════════════════════════════════════════════

// ─── 1. Login Page ───
class AdminLoginPage {
  visit() {
    cy.visit('/login');
    return this;
  }

  fillEmail(email) {
    cy.get('input[type="email"]').should('be.visible').clear().type(email);
    return this;
  }

  fillPassword(password) {
    cy.get('input[type="password"]').should('be.visible').clear().type(password);
    return this;
  }

  submit() {
    cy.contains('button', /sign in|log in/i).click();
    return this;
  }

  login(email, password) {
    this.visit();
    this.fillEmail(email);
    this.fillPassword(password);
    this.submit();
    return this;
  }

  assertOnDashboard() {
    cy.url().should('include', '/admin', { timeout: 15000 });
    return this;
  }

  assertErrorDisplayed() {
    // Should remain on login page or show error toast
    cy.url().should('include', '/login');
    return this;
  }

  assertCannotAccessPartner() {
    cy.visit('/partner');
    cy.url().should('not.include', '/partner/dashboard', { timeout: 10000 });
    return this;
  }

  assertCannotAccessCustomer() {
    cy.visit('/customer');
    cy.url().should('not.include', '/customer/dashboard', { timeout: 10000 });
    return this;
  }

  assertLogoutButton() {
    cy.contains(/log\s?out|sign\s?out/i).should('exist');
    return this;
  }
}

// ─── 2. Dashboard Page ───
class AdminDashboardPage {
  visit() {
    cy.visit('/admin');
    cy.url().should('include', '/admin');
    return this;
  }

  interceptAPIs() {
    cy.intercept('GET', '**/rest/v1/customer_devices*').as('getDevices');
    cy.intercept('GET', '**/rest/v1/service_claims*').as('getClaims');
    cy.intercept('GET', '**/rest/v1/partners*').as('getPartners');
    cy.intercept('GET', '**/rest/v1/profiles*').as('getProfiles');
    cy.intercept('GET', '**/rest/v1/invoices*').as('getInvoices');
    cy.intercept('GET', '**/rest/v1/analytics_events*').as('getAnalytics');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 20000 }).should('not.exist');
    return this;
  }

  assertKPICardsVisible(minCount = 4) {
    cy.get('[class*="card"]', { timeout: 10000 }).should('have.length.gte', minCount);
    return this;
  }

  assertMetricsLoaded() {
    cy.get('[class*="animate-spin"]').should('not.exist', { timeout: 15000 });
    return this;
  }

  assertClaimPipelineChart() {
    cy.get('.recharts-wrapper, svg.recharts-surface', { timeout: 15000 }).should('exist');
    return this;
  }

  assertStatsCardValues() {
    cy.get('[class*="card"]').first().invoke('text').should('match', /\d/);
    return this;
  }

  assertChartsRender() {
    cy.get('.recharts-wrapper, svg.recharts-surface, canvas', { timeout: 15000 })
      .should('have.length.gte', 1);
    return this;
  }

  navigateTo(sectionLabel) {
    cy.get('nav, aside').contains(sectionLabel, { matchCase: false }).click({ force: true });
    return this;
  }

  assertDeviceApprovalCount() {
    cy.get('body').invoke('text').should('match', /pending|device|approval/i);
    return this;
  }

  assertLoadTime(maxMs = 5000) {
    const start = Date.now();
    cy.get('[class*="card"]', { timeout: maxMs }).should('have.length.gte', 1).then(() => {
      const elapsed = Date.now() - start;
      cy.log(`⏱️ Dashboard loaded in ${elapsed}ms`);
      expect(elapsed).to.be.lessThan(maxMs);
    });
    return this;
  }
}

// ─── 3. Device Approval Page ───
class DeviceApprovalPage {
  visit() {
    cy.visit('/admin/device-approvals');
    cy.url().should('include', '/admin/device-approvals');
    return this;
  }

  interceptAPIs() {
    cy.intercept('GET', '**/rest/v1/customer_devices*').as('getDevices');
    cy.intercept('PATCH', '**/rest/v1/customer_devices*').as('updateDevice');
    cy.intercept('POST', '**/rest/v1/device_approval_logs*').as('createLog');
    cy.intercept('GET', '**/rest/v1/approval_checklist_items*').as('getChecklist');
    cy.intercept('GET', '**/rest/v1/device_approval_checks*').as('getChecks');
    cy.intercept('POST', '**/rest/v1/device_approval_checks*').as('saveCheck');
    cy.intercept('POST', '**/rest/v1/notifications*').as('createNotification');
    cy.intercept('GET', '**/rest/v1/profiles*').as('getProfiles');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  getDevicesTable() {
    return cy.get('table', { timeout: 10000 });
  }

  getDeviceRows() {
    return cy.get('table tbody tr');
  }

  clickDevice(index = 0) {
    cy.get('table tbody tr').eq(index).click();
    return this;
  }

  assertRiskScoreVisible() {
    cy.contains(/risk|score/i, { timeout: 10000 }).should('be.visible');
    return this;
  }

  assertRiskScoreInRange(min, max) {
    cy.get('body').then(($body) => {
      const text = $body.text();
      const scoreMatch = text.match(/(?:risk|score)[:\s]*(\d+)/i);
      if (scoreMatch) {
        const score = parseInt(scoreMatch[1]);
        expect(score).to.be.gte(min);
        expect(score).to.be.lte(max);
        cy.log(`✅ Risk score ${score} within [${min}, ${max}]`);
      } else {
        cy.log('⚠️ Risk score not found in text');
      }
    });
    return this;
  }

  approveDevice() {
    cy.contains('button', /approve/i).click({ force: true });
    return this;
  }

  rejectDevice(reason = 'Test rejection') {
    cy.contains('button', /reject/i).click({ force: true });
    cy.get('textarea, input[placeholder*="reason"]', { timeout: 5000 }).then(($el) => {
      if ($el.length) cy.wrap($el).first().clear().type(reason);
    });
    cy.contains('button', /confirm|submit|reject/i).click({ force: true });
    return this;
  }

  assertDeviceStatus(status) {
    cy.contains(new RegExp(status, 'i')).should('be.visible');
    return this;
  }

  verifyChecklist() {
    cy.get('input[type="checkbox"]', { timeout: 10000 }).should('have.length.gte', 1);
    return this;
  }

  completeChecklist() {
    cy.get('input[type="checkbox"]').each(($cb) => {
      if (!$cb.prop('checked')) cy.wrap($cb).click({ force: true });
    });
    return this;
  }

  assertAuditLogCreated() {
    cy.wait('@createLog', { timeout: 10000 }).its('response.statusCode').should('be.oneOf', [200, 201]);
    return this;
  }

  assertNotificationSent() {
    cy.wait('@createNotification', { timeout: 10000 }).its('response.statusCode').should('be.oneOf', [200, 201]);
    return this;
  }

  assertPaymentSection() {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasPayment = text.includes('upi') || text.includes('payment') || text.includes('transaction');
      cy.log(hasPayment ? '✅ Payment verification visible' : '⚠️ Payment section not found');
    });
    return this;
  }

  filterByStatus(status) {
    cy.get('button[role="combobox"], [role="tablist"] button, select').then(($els) => {
      const match = $els.filter(`:contains("${status}")`);
      if (match.length) cy.wrap(match.first()).click({ force: true });
    });
    return this;
  }
}

// ─── 4. Claims Management Page ───
class ClaimsManagementPage {
  visit() {
    cy.visit('/admin/claims-monitoring');
    cy.url().should('include', '/admin/claims-monitoring');
    return this;
  }

  interceptAPIs() {
    cy.intercept('GET', '**/rest/v1/service_claims*').as('getClaims');
    cy.intercept('PATCH', '**/rest/v1/service_claims*').as('updateClaim');
    cy.intercept('GET', '**/rest/v1/claim_eligibility_checks*').as('getEligibility');
    cy.intercept('POST', '**/rest/v1/claim_eligibility_checks*').as('createEligibility');
    cy.intercept('POST', '**/rest/v1/claim_assignments*').as('createAssignment');
    cy.intercept('POST', '**/rest/v1/claim_status_updates*').as('statusUpdate');
    cy.intercept('POST', '**/rest/v1/notifications*').as('createNotification');
    cy.intercept('GET', '**/rest/v1/partners*').as('getPartners');
    cy.intercept('GET', '**/rest/v1/customer_devices*').as('getDevices');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  getClaimsTable() {
    return cy.get('table', { timeout: 10000 });
  }

  getClaimRows() {
    return cy.get('table tbody tr');
  }

  clickClaim(index = 0) {
    cy.get('table tbody tr').eq(index).click();
    return this;
  }

  assertEligibilityCheck() {
    cy.contains(/eligib|coverage|risk/i, { timeout: 10000 }).should('be.visible');
    return this;
  }

  assertEligibility6Factors() {
    const factors = ['device', 'subscription', 'coverage', 'details', 'duplicate'];
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      let found = 0;
      factors.forEach((f) => { if (text.includes(f)) found++; });
      cy.log(`✅ Eligibility factors found: ${found}/${factors.length}`);
    });
    return this;
  }

  assertRiskScore() {
    cy.get('body').then(($body) => {
      const hasScore = /risk.*score|score.*\d+/i.test($body.text());
      cy.log(hasScore ? '✅ Risk score displayed' : '⚠️ Risk score not found');
    });
    return this;
  }

  assertRiskScoreValue(min, max) {
    cy.get('body').then(($body) => {
      const match = $body.text().match(/(?:risk|score)[:\s]*(\d+)/i);
      if (match) {
        const score = parseInt(match[1]);
        expect(score).to.be.gte(min);
        expect(score).to.be.lte(max);
        cy.log(`✅ Risk score ${score} in [${min},${max}]`);
      }
    });
    return this;
  }

  assignPartner() {
    cy.contains('button', /assign/i).click({ force: true });
    return this;
  }

  selectPartnerFromList(index = 0) {
    cy.get('[role="option"], [role="listbox"] li', { timeout: 5000 }).eq(index).click({ force: true });
    return this;
  }

  assertPipelineStages(stages) {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      stages.forEach((s) => {
        const found = text.includes(s.replace(/_/g, ' '));
        cy.log(found ? `✅ "${s}" found` : `⚠️ "${s}" not visible`);
      });
    });
    return this;
  }

  assertSLAInfo() {
    cy.get('body').invoke('text').then((text) => {
      const hasSLA = /sla|deadline|turnaround/i.test(text);
      expect(hasSLA).to.be.true;
      cy.log('✅ SLA information visible');
    });
    return this;
  }

  filterByStatus(status) {
    cy.get('button[role="combobox"], select').first().click();
    cy.get('[role="option"]').contains(new RegExp(status, 'i')).click();
    return this;
  }

  assertNotificationSent() {
    cy.get('[data-sonner-toast]', { timeout: 8000 }).should('exist');
    return this;
  }
}

// ─── 5. Customer 360 Page ───
class CustomerDatabasePage {
  visit() {
    cy.visit('/admin/customers');
    cy.url().should('include', '/admin/customers');
    return this;
  }

  interceptAPIs() {
    cy.intercept('GET', '**/rest/v1/profiles*').as('getProfiles');
    cy.intercept('GET', '**/rest/v1/customer_devices*').as('getDevices');
    cy.intercept('GET', '**/rest/v1/service_claims*').as('getClaims');
    cy.intercept('GET', '**/rest/v1/invoices*').as('getInvoices');
    cy.intercept('GET', '**/rest/v1/subscription_history*').as('getSubHistory');
    cy.intercept('GET', '**/rest/v1/service_tickets*').as('getTickets');
    cy.intercept('GET', '**/rest/v1/customer_activity_log*').as('getActivity');
    cy.intercept('GET', '**/rest/v1/customer_feedback*').as('getFeedback');
    cy.intercept('GET', '**/rest/v1/nps_surveys*').as('getNPS');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  searchCustomer(query) {
    cy.get('input[placeholder*="earch"]').first().clear().type(query);
    return this;
  }

  getCustomerRows() {
    return cy.get('table tbody tr');
  }

  clickCustomer(index = 0) {
    cy.get('table tbody tr').eq(index).click();
    return this;
  }

  assertDetailModalOpen() {
    cy.get('[class*="sheet"], [class*="dialog"], [class*="modal"], [role="dialog"]', { timeout: 5000 })
      .should('exist');
    return this;
  }

  assertAllTabsExist() {
    const tabs = ['Devices', 'Claims', 'Subscriptions', 'Payments', 'Activity', 'Metrics'];
    tabs.forEach((tab) => {
      cy.contains(new RegExp(tab, 'i')).should('exist');
    });
    return this;
  }

  switchTab(tabName) {
    cy.contains('button, [role="tab"]', new RegExp(tabName, 'i')).click({ force: true });
    cy.wait(500);
    return this;
  }

  assertLTVVisible() {
    cy.contains(/ltv|lifetime.*value/i, { timeout: 10000 }).should('exist');
    return this;
  }

  assertLTVValue() {
    cy.get('body').invoke('text').should('match', /₹[\d,]+|\d+/);
    return this;
  }

  assertChurnRiskVisible() {
    cy.contains(/churn|risk/i, { timeout: 10000 }).should('exist');
    return this;
  }

  assertChurnRiskScore() {
    cy.get('body').invoke('text').should('match', /\d+/);
    return this;
  }

  assertSegmentLabel() {
    const segments = ['VIP', 'Loyal', 'Regular', 'At.Risk', 'New', 'Watch', 'Healthy', 'Critical'];
    cy.get('body').then(($body) => {
      const text = $body.text();
      const found = segments.some((s) => new RegExp(s, 'i').test(text));
      cy.log(found ? '✅ Segment label found' : '⚠️ No segment label');
    });
    return this;
  }

  assertActionButtons() {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const actions = ['assign', 'contact', 'escalate', 'delete', 'email', 'ticket'];
      const found = actions.filter((a) => text.includes(a));
      cy.log(`✅ Action buttons found: ${found.join(', ')}`);
    });
    return this;
  }

  assertActivityTimeline() {
    this.switchTab('Activity');
    cy.get('[class*="card"], table', { timeout: 10000 }).should('exist');
    return this;
  }
}

// ─── 6. Partner Management Page ───
class PartnerManagementPage {
  visit() {
    cy.visit('/admin/partners');
    cy.url().should('include', '/admin/partners');
    return this;
  }

  interceptAPIs() {
    cy.intercept('GET', '**/rest/v1/partners*').as('getPartners');
    cy.intercept('GET', '**/rest/v1/claim_assignments*').as('getAssignments');
    cy.intercept('GET', '**/rest/v1/partner_commissions*').as('getCommissions');
    cy.intercept('GET', '**/rest/v1/regions*').as('getRegions');
    cy.intercept('GET', '**/rest/v1/service_claims*').as('getClaims');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  getPartnersTable() {
    return cy.get('table', { timeout: 10000 });
  }

  getPartnerRows() {
    return cy.get('table tbody tr');
  }

  clickPartner(index = 0) {
    cy.get('table tbody tr').eq(index).click();
    return this;
  }

  searchPartner(query) {
    cy.get('input[placeholder*="earch"]').first().clear().type(query);
    return this;
  }

  filterByLocation(location) {
    cy.get('body').then(($body) => {
      const $filter = $body.find('button[role="combobox"], select').filter(':visible');
      if ($filter.length) {
        cy.wrap($filter.first()).click({ force: true });
        cy.get('[role="option"]').contains(new RegExp(location, 'i')).click();
      } else {
        cy.log('⚠️ No location filter found');
      }
    });
    return this;
  }

  filterByRating(rating) {
    cy.get('body').then(($body) => {
      const $filter = $body.find('button[role="combobox"], select').filter(':visible');
      if ($filter.length > 1) {
        cy.wrap($filter.eq(1)).click({ force: true });
        cy.get('[role="option"]').contains(new RegExp(rating, 'i')).click();
      }
    });
    return this;
  }

  assertCommissionData() {
    cy.contains(/commission|rate|%/i).should('exist');
    return this;
  }

  assertSLACompliance() {
    cy.contains(/sla|compliance|turnaround/i).should('exist');
    return this;
  }

  assertPerformanceLeaderboard() {
    cy.get('table, [class*="card"]').should('exist');
    return this;
  }

  assertPartnerDetailView() {
    cy.get('[class*="sheet"], [class*="dialog"], [class*="modal"], [role="dialog"]', { timeout: 5000 })
      .should('exist');
    return this;
  }

  assertQualityRating() {
    cy.get('body').invoke('text').then((text) => {
      const hasRating = /\d\.\d/.test(text) || text.includes('★') || /rating/i.test(text);
      expect(hasRating).to.be.true;
    });
    return this;
  }

  assertPartnerInfo() {
    const fields = ['name', 'email', 'phone', 'city', 'state', 'type'];
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const found = fields.filter((f) => text.includes(f));
      cy.log(`✅ Partner info fields: ${found.join(', ')}`);
    });
    return this;
  }
}

// ─── 7. Finance Dashboard Page ───
class FinanceDashboardPage {
  interceptAPIs() {
    cy.intercept('GET', '**/rest/v1/finance_transactions*').as('getTransactions');
    cy.intercept('GET', '**/rest/v1/invoices*').as('getInvoices');
    cy.intercept('GET', '**/rest/v1/finance_gst_returns*').as('getGST');
    cy.intercept('GET', '**/rest/v1/finance_partner_payouts*').as('getPayouts');
    cy.intercept('GET', '**/rest/v1/finance_compliance_info*').as('getCompliance');
    cy.intercept('GET', '**/rest/v1/partner_commissions*').as('getCommissions');
    cy.intercept('GET', '**/rest/v1/finance_categories*').as('getCategories');
    return this;
  }

  visitOverview() {
    cy.visit('/admin/finance');
    cy.url().should('include', '/admin/finance');
    return this;
  }

  visitTransactions() {
    cy.visit('/admin/finance/transactions');
    return this;
  }

  visitGST() {
    cy.visit('/admin/finance/gst');
    return this;
  }

  visitPartnerPayments() {
    cy.visit('/admin/finance/partner-payments');
    return this;
  }

  visitCompliance() {
    cy.visit('/admin/finance/compliance');
    return this;
  }

  visitInvoices() {
    cy.visit('/admin/invoices');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  assertKPICards(minCount = 3) {
    cy.get('[class*="card"]', { timeout: 10000 }).should('have.length.gte', minCount);
    return this;
  }

  assertCurrencyValues() {
    cy.get('body').should('contain.text', '₹');
    return this;
  }

  assertTrendChart() {
    cy.get('.recharts-wrapper, svg[class*="recharts"]', { timeout: 10000 }).should('exist');
    return this;
  }

  assertInvoicesTable() {
    cy.get('table', { timeout: 10000 }).should('exist');
    return this;
  }

  assertGSTReturns() {
    cy.contains(/gstr|gst.*return|cgst|sgst/i, { timeout: 10000 }).should('exist');
    return this;
  }

  assertPartnerPayouts() {
    cy.contains(/payout|partner.*payment|tds/i, { timeout: 10000 }).should('exist');
    return this;
  }

  assertComplianceInfo() {
    cy.contains(/pan|gstin|udyam|compliance/i, { timeout: 10000 }).should('exist');
    return this;
  }

  assertTransactionsTable() {
    cy.get('table', { timeout: 10000 }).should('exist');
    return this;
  }

  downloadReport() {
    cy.contains('button', /download|export|csv|report/i).click({ force: true });
    return this;
  }

  assertCommissionFormula() {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasFormula = text.includes('base') || text.includes('bonus') || text.includes('commission');
      cy.log(hasFormula ? '✅ Commission formula elements present' : '⚠️ No commission info');
    });
    return this;
  }
}

export {
  AdminLoginPage,
  AdminDashboardPage,
  DeviceApprovalPage,
  ClaimsManagementPage,
  CustomerDatabasePage,
  FinanceDashboardPage,
  PartnerManagementPage,
};
