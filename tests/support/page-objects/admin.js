// ─── Admin Portal Page Objects ───
// Centralized selectors and actions for all admin pages

class AdminLoginPage {
  visit() {
    cy.visit('/login');
    return this;
  }

  fillEmail(email) {
    cy.get('input[type="email"]').clear().type(email);
    return this;
  }

  fillPassword(password) {
    cy.get('input[type="password"]').clear().type(password);
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
    cy.url().should('not.include', '/login', { timeout: 15000 });
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
}

class AdminDashboardPage {
  visit() {
    cy.visit('/admin');
    cy.url().should('include', '/admin');
    return this;
  }

  assertKPICardsVisible() {
    cy.get('[class*="card"]', { timeout: 10000 }).should('have.length.gte', 3);
    return this;
  }

  assertMetricsLoaded() {
    // Verify cards don't show loading spinners
    cy.get('[class*="animate-spin"]').should('not.exist', { timeout: 15000 });
    return this;
  }

  navigateTo(sectionLabel) {
    cy.get('nav, aside').contains(sectionLabel, { matchCase: false }).click({ force: true });
    return this;
  }
}

class DeviceApprovalPage {
  visit() {
    cy.visit('/admin/device-approvals');
    cy.url().should('include', '/admin/device-approvals');
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

  clickDevice(index = 0) {
    cy.get('table tbody tr').eq(index).click();
    return this;
  }

  assertRiskScoreVisible() {
    cy.contains(/risk|score/i, { timeout: 10000 }).should('be.visible');
    return this;
  }

  approveDevice() {
    cy.contains('button', /approve/i).click({ force: true });
    return this;
  }

  rejectDevice(reason = 'Test rejection') {
    cy.contains('button', /reject/i).click({ force: true });
    // Fill rejection reason if modal appears
    cy.get('textarea, input[placeholder*="reason"]', { timeout: 5000 })
      .then(($el) => {
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
}

class ClaimsManagementPage {
  visit() {
    cy.visit('/admin/claims-monitoring');
    cy.url().should('include', '/admin/claims-monitoring');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  getClaimsTable() {
    return cy.get('table', { timeout: 10000 });
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
}

class CustomerDatabasePage {
  visit() {
    cy.visit('/admin/customers');
    cy.url().should('include', '/admin/customers');
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

  assertChurnRiskVisible() {
    cy.contains(/churn|risk/i, { timeout: 10000 }).should('exist');
    return this;
  }

  assertRiskSegment(segment) {
    cy.contains(new RegExp(segment, 'i')).should('exist');
    return this;
  }
}

class FinanceDashboardPage {
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

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  getPartnersTable() {
    return cy.get('table', { timeout: 10000 });
  }

  clickPartner(index = 0) {
    cy.get('table tbody tr').eq(index).click();
    return this;
  }

  assertCommissionData() {
    cy.contains(/commission|rate|%/i).should('exist');
    return this;
  }
}

// Export all page objects
export {
  AdminLoginPage,
  AdminDashboardPage,
  DeviceApprovalPage,
  ClaimsManagementPage,
  CustomerDatabasePage,
  FinanceDashboardPage,
  PartnerManagementPage,
};
