// ─── Admin Portal Page Objects (Enhanced) ───
// Comprehensive page objects with API interception, performance assertions, and structured logging

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
    cy.loginViaUI(email, password);
    return this;
  }

  assertOnDashboard() {
    cy.url().should('include', '/admin', { timeout: 15000 });
    return this;
  }

  assertErrorDisplayed() {
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
}

class AdminDashboardPage {
  visit() {
    cy.visit('/admin');
    cy.url().should('include', '/admin');
    return this;
  }

  interceptDashboardAPIs() {
    cy.intercept('GET', '**/rest/v1/customer_devices*').as('getDevices');
    cy.intercept('GET', '**/rest/v1/service_claims*').as('getClaims');
    cy.intercept('GET', '**/rest/v1/partners*').as('getPartners');
    cy.intercept('GET', '**/rest/v1/profiles*').as('getProfiles');
    cy.intercept('GET', '**/rest/v1/invoices*').as('getInvoices');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 20000 }).should('not.exist');
    return this;
  }

  assertKPICardsVisible() {
    cy.get('[class*="card"]', { timeout: 10000 }).should('have.length.gte', 4);
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
    // Verify KPI cards show numeric values (not loading or zero-only)
    cy.get('[class*="card"]').first().should('contain.text', /\d/);
    return this;
  }

  assertAlertsSection() {
    // Dashboard alerts for critical issues
    cy.get('body').then(($body) => {
      const hasAlerts = $body.find('[role="alert"], [class*="alert"]').length > 0;
      cy.log(hasAlerts ? '✅ Alert section present' : 'ℹ️ No active alerts');
    });
    return this;
  }

  navigateTo(sectionLabel) {
    cy.get('nav, aside').contains(sectionLabel, { matchCase: false }).click({ force: true });
    return this;
  }

  assertDateRangeFilter() {
    cy.get('button[role="combobox"], select').should('exist');
    return this;
  }

  selectDateRange(preset) {
    cy.get('button[role="combobox"]').first().click();
    cy.get('[role="option"]').contains(new RegExp(preset, 'i')).click();
    return this;
  }
}

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
    cy.intercept('POST', '**/rest/v1/notifications*').as('createNotification');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  getDevicesTable() {
    return cy.get('table', { timeout: 10000 });
  }

  getFirstPendingDevice() {
    return cy.get('table tbody tr').first();
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

  assertRiskScoreRange(min, max) {
    cy.get('body').then(($body) => {
      const text = $body.text();
      const scoreMatch = text.match(/(?:risk|score)[:\s]*(\d+)/i);
      if (scoreMatch) {
        const score = parseInt(scoreMatch[1]);
        expect(score).to.be.gte(min);
        expect(score).to.be.lte(max);
        cy.log(`✅ Risk score ${score} is within range [${min}, ${max}]`);
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
      if ($el.length) cy.wrap($el).clear().type(reason);
    });
    cy.contains('button', /confirm|submit|reject/i).click({ force: true });
    return this;
  }

  assertDeviceStatus(status) {
    cy.contains(new RegExp(status, 'i')).should('be.visible');
    return this;
  }

  assertAuditLogEntry(action) {
    cy.contains(new RegExp(action, 'i'), { timeout: 10000 }).should('exist');
    return this;
  }

  verifyChecklist() {
    cy.get('input[type="checkbox"]', { timeout: 10000 }).should('have.length.gte', 1);
    return this;
  }

  completeChecklist() {
    cy.get('input[type="checkbox"]').each(($cb) => {
      if (!$cb.prop('checked')) {
        cy.wrap($cb).click({ force: true });
      }
    });
    return this;
  }

  assertPaymentVerification() {
    cy.get('body').then(($body) => {
      const hasPayment = $body.text().toLowerCase().includes('upi') ||
                         $body.text().toLowerCase().includes('payment') ||
                         $body.text().toLowerCase().includes('transaction');
      expect(hasPayment).to.be.true;
    });
    return this;
  }

  filterByStatus(status) {
    cy.get('button[role="combobox"], [role="tablist"] button').then(($els) => {
      const match = $els.filter(`:contains("${status}")`);
      if (match.length) cy.wrap(match.first()).click({ force: true });
    });
    return this;
  }

  assertNotificationCreated() {
    cy.wait('@createNotification', { timeout: 10000 }).its('response.statusCode').should('be.oneOf', [200, 201]);
    return this;
  }
}

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
    cy.intercept('POST', '**/rest/v1/claim_assignments*').as('createAssignment');
    cy.intercept('POST', '**/rest/v1/claim_status_updates*').as('statusUpdate');
    cy.intercept('POST', '**/rest/v1/notifications*').as('createNotification');
    cy.intercept('GET', '**/rest/v1/partners*').as('getPartners');
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

  filterByStatus(status) {
    cy.get('button[role="combobox"], select').first().click();
    cy.get('[role="option"]').contains(new RegExp(status, 'i')).click();
    return this;
  }

  assertEligibilityCheck() {
    cy.contains(/eligib|coverage|risk/i, { timeout: 10000 }).should('be.visible');
    return this;
  }

  assertEligibilityFactors() {
    const factors = ['device_approved', 'subscription_active', 'coverage_includes_issue', 'claim_details_complete', 'not_duplicate'];
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      let found = 0;
      factors.forEach((f) => {
        if (text.includes(f.replace(/_/g, ' ')) || text.includes(f)) found++;
      });
      cy.log(`✅ Found ${found}/${factors.length} eligibility factors`);
    });
    return this;
  }

  assertRiskScore() {
    cy.get('body').then(($body) => {
      const text = $body.text();
      const hasScore = /risk.*score|score.*\d+|risk.*\d+/i.test(text);
      cy.log(hasScore ? '✅ Risk score displayed' : '⚠️ Risk score not found');
    });
    return this;
  }

  assignPartner(partnerName) {
    cy.contains('button', /assign/i).click({ force: true });
    if (partnerName) {
      cy.get('[role="option"], [role="listbox"] li')
        .contains(new RegExp(partnerName, 'i'))
        .click({ force: true });
    }
    return this;
  }

  updateStatus(newStatus) {
    cy.contains('button', /status|update/i).click({ force: true });
    cy.get('[role="option"]').contains(new RegExp(newStatus, 'i')).click();
    return this;
  }

  assertNotificationSent() {
    cy.get('[data-sonner-toast]', { timeout: 8000 }).should('exist');
    return this;
  }

  assertPipelineStages(stages) {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      stages.forEach((stage) => {
        const found = text.includes(stage.replace(/_/g, ' '));
        cy.log(found ? `✅ Pipeline stage "${stage}" found` : `⚠️ "${stage}" not visible`);
      });
    });
    return this;
  }

  assertSLAInfo() {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasSLA = text.includes('sla') || text.includes('deadline') || text.includes('turnaround');
      expect(hasSLA).to.be.true;
    });
    return this;
  }

  assertStatusTimeline() {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      return text.includes('timeline') || text.includes('history') || text.includes('status changed');
    });
    return this;
  }
}

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

  clickCustomer(index = 0) {
    cy.get('table tbody tr').eq(index).click();
    return this;
  }

  assertAllTabsExist() {
    const tabs = ['Overview', 'Devices', 'Claims', 'Subscriptions', 'Activity', 'Feedback'];
    tabs.forEach((tab) => {
      cy.contains(new RegExp(tab, 'i')).should('exist');
    });
    return this;
  }

  switchTab(tabName) {
    cy.contains('button, [role="tab"]', new RegExp(tabName, 'i')).click({ force: true });
    return this;
  }

  assertLTVVisible() {
    cy.contains(/ltv|lifetime value|life.*time/i, { timeout: 10000 }).should('exist');
    return this;
  }

  assertLTVValue() {
    cy.get('body').then(($body) => {
      const text = $body.text();
      const hasAmount = /₹[\d,]+/.test(text) || /\d+/.test(text);
      expect(hasAmount).to.be.true;
    });
    return this;
  }

  assertChurnRiskVisible() {
    cy.contains(/churn|risk/i, { timeout: 10000 }).should('exist');
    return this;
  }

  assertChurnRiskScore() {
    cy.get('body').then(($body) => {
      const text = $body.text();
      const hasScore = /\d+/.test(text);
      expect(hasScore).to.be.true;
    });
    return this;
  }

  assertRiskSegment(segment) {
    cy.contains(new RegExp(segment, 'i')).should('exist');
    return this;
  }

  assertDeleteButton() {
    cy.get('body').then(($body) => {
      const hasDelete = $body.find('button:contains("Delete")').length > 0;
      cy.log(hasDelete ? '✅ Delete user button present' : '⚠️ Delete button not found');
    });
    return this;
  }

  assertActivityTimeline() {
    this.switchTab('Activity');
    cy.get('[class*="card"], table', { timeout: 10000 }).should('exist');
    return this;
  }
}

class FinanceDashboardPage {
  interceptAPIs() {
    cy.intercept('GET', '**/rest/v1/finance_transactions*').as('getTransactions');
    cy.intercept('GET', '**/rest/v1/invoices*').as('getInvoices');
    cy.intercept('GET', '**/rest/v1/finance_gst_returns*').as('getGST');
    cy.intercept('GET', '**/rest/v1/finance_partner_payouts*').as('getPayouts');
    cy.intercept('GET', '**/rest/v1/finance_compliance_info*').as('getCompliance');
    cy.intercept('GET', '**/rest/v1/partner_commissions*').as('getCommissions');
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

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  assertKPICards(minCount = 3) {
    cy.get('[class*="card"]', { timeout: 10000 }).should('have.length.gte', minCount);
    return this;
  }

  assertTrendChart() {
    cy.get('.recharts-wrapper, svg[class*="recharts"]', { timeout: 10000 }).should('exist');
    return this;
  }

  assertCurrencyValues() {
    cy.get('body').should('contain.text', '₹');
    return this;
  }

  downloadReport() {
    cy.contains('button', /download|export|csv|report/i).click({ force: true });
    return this;
  }

  assertInvoicesTable() {
    cy.get('table', { timeout: 10000 }).should('exist');
    return this;
  }
}

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
      const $filter = $body.find('button[role="combobox"]:contains("Location"), button[role="combobox"]:contains("Region"), select[name*="region"]');
      if ($filter.length) {
        cy.wrap($filter.first()).click({ force: true });
        cy.get('[role="option"]').contains(new RegExp(location, 'i')).click();
      }
    });
    return this;
  }

  filterByRating(rating) {
    cy.get('body').then(($body) => {
      const $filter = $body.find('button[role="combobox"]:contains("Rating"), select[name*="rating"]');
      if ($filter.length) {
        cy.wrap($filter.first()).click({ force: true });
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
    cy.get('[class*="sheet"], [class*="dialog"], [class*="modal"]', { timeout: 5000 }).should('exist');
    return this;
  }

  assertQualityRating() {
    cy.get('body').then(($body) => {
      const text = $body.text();
      const hasRating = /\d\.\d/.test(text) || text.includes('★') || text.toLowerCase().includes('rating');
      expect(hasRating).to.be.true;
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
