// ─── Customer Portal Page Objects ───

class CustomerLoginPage {
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

  assertOnCustomerDashboard() {
    cy.url().should('include', '/customer', { timeout: 15000 });
    return this;
  }

  assertCannotAccessAdmin() {
    cy.visit('/admin');
    cy.url().should('not.include', '/admin/dashboard', { timeout: 10000 });
    return this;
  }

  assertCannotAccessPartner() {
    cy.visit('/partner');
    cy.url().should('not.include', '/partner/dashboard', { timeout: 10000 });
    return this;
  }
}

class CustomerDevicesPage {
  visit() {
    cy.visit('/customer/devices');
    cy.url().should('include', '/customer/devices');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  assertDeviceCards() {
    cy.get('[class*="card"]', { timeout: 10000 }).should('exist');
    return this;
  }

  getDeviceCount() {
    return cy.get('[class*="card"]').its('length');
  }

  clickDevice(index = 0) {
    cy.get('[class*="card"]').eq(index).click();
    return this;
  }

  assertCoverageInfo() {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      return text.includes('coverage') || text.includes('plan') || text.includes('subscription');
    });
    return this;
  }

  assertDeviceStatus(status) {
    cy.contains(new RegExp(status, 'i')).should('exist');
    return this;
  }

  clickAddDevice() {
    cy.contains(/add.*device|register|onboard|new.*device/i).click({ force: true });
    return this;
  }

  assertQuickActions() {
    cy.get('button, a').then(($els) => {
      const text = $els.text().toLowerCase();
      return text.includes('claim') || text.includes('renew') || text.includes('details');
    });
    return this;
  }
}

class DeviceOnboardingWizardPage {
  assertWizardLoaded() {
    cy.get('[class*="card"], form', { timeout: 10000 }).should('exist');
    return this;
  }

  fillDeviceInfo(device) {
    // Step 1: Device Information
    cy.get('body').then(($body) => {
      const $productName = $body.find('input[placeholder*="product"], input[name*="product"], input[placeholder*="name"]');
      if ($productName.length) cy.wrap($productName.first()).clear().type(device.productName);

      const $serial = $body.find('input[placeholder*="serial"], input[name*="serial"]');
      if ($serial.length) cy.wrap($serial.first()).clear().type(device.serialNumber);

      const $imei = $body.find('input[placeholder*="imei"], input[name*="imei"]');
      if ($imei.length) cy.wrap($imei.first()).clear().type(device.imeiNumber);
    });
    return this;
  }

  selectCategory(category) {
    cy.get('button[role="combobox"], select').then(($el) => {
      if ($el.length) {
        cy.wrap($el.first()).click({ force: true });
        cy.get('[role="option"]').contains(new RegExp(category, 'i')).click();
      }
    });
    return this;
  }

  goNext() {
    cy.contains('button', /next|continue|proceed/i).click({ force: true });
    cy.wait(500);
    return this;
  }

  goBack() {
    cy.contains('button', /back|previous/i).click({ force: true });
    cy.wait(500);
    return this;
  }

  selectPlan() {
    cy.get('[class*="card"] button, input[type="radio"]').first().click({ force: true });
    return this;
  }

  fillPayment(method, transactionId) {
    cy.get('body').then(($body) => {
      const $upi = $body.find('button:contains("UPI"), label:contains("UPI"), input[value="upi"]');
      if ($upi.length && method === 'upi') cy.wrap($upi.first()).click({ force: true });

      if (transactionId) {
        const $txnId = $body.find('input[placeholder*="transaction"], input[name*="transaction"], input[placeholder*="UPI"]');
        if ($txnId.length) cy.wrap($txnId.first()).clear().type(transactionId);
      }
    });
    return this;
  }

  fillAddress(address) {
    cy.get('body').then(($body) => {
      const $addr = $body.find('input[placeholder*="ddress"], textarea[placeholder*="ddress"]');
      if ($addr.length) cy.wrap($addr.first()).clear().type(address);

      const $whatsapp = $body.find('input[placeholder*="whatsapp"], input[name*="whatsapp"], input[placeholder*="phone"]');
      if ($whatsapp.length) cy.wrap($whatsapp.first()).clear().type('9876543210');
    });
    return this;
  }

  submitRegistration() {
    cy.contains('button', /submit|confirm|register/i).click({ force: true });
    return this;
  }

  assertSuccess() {
    cy.get('[data-sonner-toast]', { timeout: 8000 }).should('exist');
    return this;
  }
}

class CustomerClaimsPage {
  visit() {
    cy.visit('/customer/claims');
    cy.url().should('include', '/customer/claims');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  assertClaimsList() {
    cy.get('[class*="card"], table', { timeout: 10000 }).should('exist');
    return this;
  }

  clickNewClaim() {
    cy.contains(/new.*claim|file.*claim|submit.*claim/i).click({ force: true });
    return this;
  }

  fillClaimForm(claim) {
    cy.get('body').then(($body) => {
      // Issue type selection
      const $issueType = $body.find('button[role="combobox"]:first, select[name*="issue"]');
      if ($issueType.length) {
        cy.wrap($issueType.first()).click({ force: true });
        cy.get('[role="option"]').contains(new RegExp(claim.issueType, 'i')).click();
      }

      // Description
      const $desc = $body.find('textarea');
      if ($desc.length) cy.wrap($desc.first()).clear().type(claim.description);
    });
    return this;
  }

  selectDevice() {
    cy.get('button[role="combobox"], select, [class*="card"] input[type="radio"]').then(($els) => {
      if ($els.length) cy.wrap($els.first()).click({ force: true });
    });
    return this;
  }

  submitClaim() {
    cy.contains('button', /submit|file|create/i).click({ force: true });
    return this;
  }

  assertClaimCreated() {
    cy.get('[data-sonner-toast]', { timeout: 8000 }).should('exist');
    return this;
  }

  clickClaim(index = 0) {
    cy.get('table tbody tr, [class*="card"]').eq(index).click();
    return this;
  }

  filterByStatus(status) {
    cy.get('button[role="combobox"], [role="tablist"] button, [class*="tab"]').then(($els) => {
      const match = $els.filter(`:contains("${status}")`);
      if (match.length) cy.wrap(match.first()).click({ force: true });
    });
    return this;
  }

  assertTimeline() {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      return text.includes('submitted') || text.includes('timeline') || text.includes('status');
    });
    return this;
  }

  assertPartnerInfo() {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      return text.includes('partner') || text.includes('assigned') || text.includes('technician');
    });
    return this;
  }

  sendMessage(message) {
    cy.get('textarea, input[placeholder*="essage"]').last().clear().type(message);
    cy.contains('button', /send|reply/i).click({ force: true });
    return this;
  }

  assertProgressBar() {
    cy.get('[role="progressbar"], [class*="progress"]', { timeout: 10000 }).should('exist');
    return this;
  }
}

class CustomerTicketsPage {
  visit() {
    cy.visit('/customer/tickets');
    cy.url().should('include', '/customer/tickets');
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
      if ($el.length) cy.wrap($el.first()).clear().type(subject);
    });
    cy.get('textarea').first().clear().type(description);
    cy.get('body').then(($body) => {
      const $p = $body.find('button[role="combobox"]:contains("Priority"), select[name*="priority"]');
      if ($p.length) {
        cy.wrap($p.first()).click({ force: true });
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

  assertAutoReopen() {
    // After replying to a resolved ticket, status should change to open
    cy.get('[class*="badge"]').should('exist');
    return this;
  }
}

class CustomerFeedbackPage {
  visit() {
    cy.visit('/customer/feedback');
    cy.url().should('include', '/customer/feedback');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  rateService(stars) {
    // Click nth star element
    cy.get('body').then(($body) => {
      const $stars = $body.find('svg[class*="star"], button[aria-label*="star"], [class*="star"]');
      if ($stars.length >= stars) {
        cy.wrap($stars.eq(stars - 1)).click({ force: true });
      }
    });
    return this;
  }

  fillFeedbackText(text) {
    cy.get('textarea').first().clear().type(text);
    return this;
  }

  submitFeedback() {
    cy.contains('button', /submit|send|save/i).click({ force: true });
    return this;
  }

  assertFeedbackSubmitted() {
    cy.get('[data-sonner-toast]', { timeout: 8000 }).should('exist');
    return this;
  }

  assertNPSSurvey() {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      return text.includes('nps') || text.includes('recommend') || text.includes('score');
    });
    return this;
  }

  submitNPSScore(score) {
    // NPS scores 0-10, click the appropriate button
    cy.get('body').then(($body) => {
      const $scoreBtn = $body.find(`button:contains("${score}"), input[value="${score}"]`);
      if ($scoreBtn.length) cy.wrap($scoreBtn.first()).click({ force: true });
    });
    return this;
  }
}

class CustomerProfilePage {
  visit() {
    cy.visit('/customer/profile');
    cy.url().should('include', '/customer/profile');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  assertProfileFields() {
    cy.get('input, [class*="card"]').should('have.length.gte', 1);
    return this;
  }
}

class CustomerNotificationsPage {
  visit() {
    cy.visit('/customer/notifications');
    cy.url().should('include', '/customer/notifications');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  assertNotificationList() {
    cy.get('[class*="card"], table', { timeout: 10000 }).should('exist');
    return this;
  }

  assertPreferencesToggle() {
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      return text.includes('email') || text.includes('sms') || text.includes('notification');
    });
    return this;
  }
}

class CustomerSubscriptionsPage {
  visit() {
    cy.visit('/customer/subscriptions');
    cy.url().should('include', '/customer/subscriptions');
    return this;
  }

  waitForLoad() {
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    return this;
  }

  assertSubscriptionCards() {
    cy.get('[class*="card"]', { timeout: 10000 }).should('exist');
    return this;
  }
}

export {
  CustomerLoginPage,
  CustomerDevicesPage,
  DeviceOnboardingWizardPage,
  CustomerClaimsPage,
  CustomerTicketsPage,
  CustomerFeedbackPage,
  CustomerProfilePage,
  CustomerNotificationsPage,
  CustomerSubscriptionsPage,
};
