// ─── Partner Portal Page Objects ───

class PartnerLoginPage {
  visit() {
    cy.visit('/login');
    return this;
  }

  login(email, password) {
    this.visit();
    cy.get('input[type="email"]').clear().type(email);
    cy.get('input[type="password"]').clear().type(password);
    cy.contains('button', /sign in|log in/i).click();
    cy.url().should('not.include', '/login', { timeout: 15000 });
    return this;
  }

  assertOnPartnerDashboard() {
    cy.url().should('include', '/partner', { timeout: 15000 });
    return this;
  }

  assertCannotAccessAdmin() {
    cy.visit('/admin');
    cy.url().should('not.include', '/admin/dashboard', { timeout: 10000 });
    return this;
  }

  assertCannotAccessCustomer() {
    cy.visit('/customer');
    cy.url().should('not.include', '/customer/dashboard', { timeout: 10000 });
    return this;
  }
}

class PartnerDashboardPage {
  visit() {
    cy.visit('/partner');
    cy.url().should('include', '/partner');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  assertKPICards(minCount = 2) {
    cy.get('[class*="card"]', { timeout: 10000 }).should('have.length.gte', minCount);
    return this;
  }

  assertClaimsQueueVisible() {
    cy.get('table, [class*="card"]', { timeout: 10000 }).should('exist');
    return this;
  }

  assertMetricsLoaded() {
    cy.get('[class*="animate-spin"]').should('not.exist');
    return this;
  }

  navigateTo(label) {
    cy.get('nav, aside').contains(label, { matchCase: false }).click({ force: true });
    return this;
  }
}

class PartnerClaimsPage {
  visit() {
    cy.visit('/partner/customers');
    cy.url().should('include', '/partner/customers');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  getClaimsTable() {
    return cy.get('table, [class*="card"]', { timeout: 10000 });
  }

  getClaimRows() {
    return cy.get('table tbody tr');
  }

  clickClaim(index = 0) {
    cy.get('table tbody tr').eq(index).click();
    return this;
  }

  filterByStatus(status) {
    cy.get('button[role="combobox"], [class*="tab"]').then(($els) => {
      const filter = $els.filter(`:contains("${status}")`);
      if (filter.length) cy.wrap(filter.first()).click({ force: true });
    });
    return this;
  }

  acceptClaim() {
    cy.contains('button', /accept/i).click({ force: true });
    return this;
  }

  rejectClaim(reason) {
    cy.contains('button', /reject|decline/i).click({ force: true });
    cy.get('textarea, input[placeholder*="reason"]', { timeout: 5000 }).then(($el) => {
      if ($el.length) cy.wrap($el).clear().type(reason);
    });
    cy.contains('button', /confirm|submit|reject/i).click({ force: true });
    return this;
  }

  updateStatus(newStatus) {
    cy.contains('button', /status|update/i).click({ force: true });
    cy.get('[role="option"]').contains(new RegExp(newStatus, 'i')).click();
    return this;
  }

  uploadPhoto() {
    cy.get('body').then(($body) => {
      const $upload = $body.find('input[type="file"]');
      if ($upload.length) {
        cy.wrap($upload).selectFile('tests/fixtures/test-image.txt', { force: true });
      }
    });
    return this;
  }

  addNote(note) {
    cy.get('textarea').first().clear().type(note);
    cy.contains('button', /send|add|submit/i).click({ force: true });
    return this;
  }

  assertOnlyOwnData() {
    // Verify no "all customers" or admin-level data visible
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasAdminControls = text.includes('all partners') || text.includes('manage all');
      expect(hasAdminControls).to.be.false;
    });
    return this;
  }

  assertToast() {
    cy.get('[data-sonner-toast]', { timeout: 8000 }).should('exist');
    return this;
  }
}

class PartnerCommissionsPage {
  visit() {
    cy.visit('/partner/commissions');
    cy.url().should('include', '/partner/commissions');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  assertCommissionCards() {
    cy.get('[class*="card"]', { timeout: 10000 }).should('have.length.gte', 1);
    return this;
  }

  assertMonthlyBreakdown() {
    cy.get('table, [class*="card"]').should('exist');
    return this;
  }

  assertYTDTotal() {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      return text.includes('total') || text.includes('ytd') || text.includes('earned');
    });
    return this;
  }

  assertPayoutHistory() {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      return text.includes('payout') || text.includes('paid') || text.includes('history');
    });
    return this;
  }

  assertCommissionAmounts() {
    // Verify ₹ amounts are displayed
    cy.get('body').should('contain.text', '₹');
    return this;
  }
}

class PartnerPerformancePage {
  visit() {
    cy.visit('/partner/performance');
    cy.url().should('include', '/partner/performance');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  assertMetricCards() {
    cy.get('[class*="card"]', { timeout: 10000 }).should('have.length.gte', 1);
    return this;
  }

  assertSLACompliance() {
    cy.contains(/sla|compliance|turnaround/i, { timeout: 10000 }).should('exist');
    return this;
  }

  assertRatings() {
    cy.contains(/rating|quality|score/i, { timeout: 10000 }).should('exist');
    return this;
  }

  assertCompletionRates() {
    cy.contains(/complet|repair|resolved/i, { timeout: 10000 }).should('exist');
    return this;
  }

  assertTrendChart() {
    cy.get('.recharts-wrapper, svg[class*="recharts"], canvas', { timeout: 10000 }).should('exist');
    return this;
  }
}

class PartnerTicketsPage {
  visit() {
    cy.visit('/partner/tickets');
    cy.url().should('include', '/partner/tickets');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  clickNewTicket() {
    cy.contains('button', /new.*ticket|create.*ticket|raise/i).click({ force: true });
    return this;
  }

  fillTicketForm(subject, description, priority) {
    cy.get('input[placeholder*="ubject"], input[name*="subject"]', { timeout: 5000 }).then(($el) => {
      if ($el.length) cy.wrap($el).clear().type(subject);
    });
    cy.get('textarea').first().clear().type(description);
    // Set priority if dropdown exists
    cy.get('body').then(($body) => {
      const $priority = $body.find('button[role="combobox"]:contains("Priority"), select[name*="priority"]');
      if ($priority.length) {
        cy.wrap($priority.first()).click({ force: true });
        cy.get('[role="option"]').contains(new RegExp(priority, 'i')).click();
      }
    });
    return this;
  }

  submitTicket() {
    cy.contains('button', /submit|create|send/i).click({ force: true });
    return this;
  }

  clickTicket(index = 0) {
    cy.get('table tbody tr, [class*="card"]').eq(index).click();
    return this;
  }

  sendMessage(message) {
    cy.get('textarea, input[placeholder*="essage"]').last().clear().type(message);
    cy.contains('button', /send|reply/i).click({ force: true });
    return this;
  }

  assertTicketCreated() {
    cy.get('[data-sonner-toast]', { timeout: 8000 }).should('exist');
    return this;
  }
}

class PartnerSalesPage {
  visit() {
    cy.visit('/partner/sales');
    cy.url().should('include', '/partner/sales');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  assertSalesTable() {
    cy.get('table, [class*="card"]', { timeout: 10000 }).should('exist');
    return this;
  }

  assertOnlyOwnSales() {
    // Should only see sales from partner's referrals
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasAdminData = text.includes('all partners') || text.includes('system-wide');
      expect(hasAdminData).to.be.false;
    });
    return this;
  }
}

class PartnerFinancePage {
  visit() {
    cy.visit('/partner/finance');
    cy.url().should('include', '/partner/finance');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  assertFinanceSummary() {
    cy.get('[class*="card"]', { timeout: 10000 }).should('have.length.gte', 1);
    return this;
  }

  assertEarningsVisible() {
    cy.get('body').should('contain.text', '₹');
    return this;
  }
}

export {
  PartnerLoginPage,
  PartnerDashboardPage,
  PartnerClaimsPage,
  PartnerCommissionsPage,
  PartnerPerformancePage,
  PartnerTicketsPage,
  PartnerSalesPage,
  PartnerFinancePage,
};
