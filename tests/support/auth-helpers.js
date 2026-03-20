// ─── Authentication Helpers ───

/** Login via UI form with retry logic */
Cypress.Commands.add('loginViaUI', (email, password) => {
  cy.session(
    [email],
    () => {
      cy.visit('/login');
      cy.get('input[type="email"]').should('be.visible').clear().type(email);
      cy.get('input[type="password"]').should('be.visible').clear().type(password);
      cy.contains('button', /sign in|log in/i).click();
      cy.url().should('not.include', '/login', { timeout: 20000 });
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        // Session is valid if we're not on the login page
        cy.visit('/');
        cy.url().should('not.include', '/login', { timeout: 10000 });
      },
    }
  );
});

/** Login as Admin */
Cypress.Commands.add('loginAsAdmin', () => {
  cy.fixture('users').then((users) => {
    cy.loginViaUI(users.admin.email, users.admin.password);
  });
});

/** Login as Partner */
Cypress.Commands.add('loginAsPartner', () => {
  cy.fixture('users').then((users) => {
    cy.loginViaUI(users.partner.email, users.partner.password);
  });
});

/** Login as Customer */
Cypress.Commands.add('loginAsCustomer', () => {
  cy.fixture('users').then((users) => {
    cy.loginViaUI(users.customer.email, users.customer.password);
  });
});

/** Logout */
Cypress.Commands.add('logout', () => {
  cy.contains(/log\s?out|sign\s?out/i).click({ force: true });
  cy.url().should('include', '/login', { timeout: 10000 });
  Cypress.session.clearAllSavedSessions();
});

/** Assert currently authenticated role via URL */
Cypress.Commands.add('assertRole', (role) => {
  const pathMap = { admin: '/admin', partner: '/partner', customer: '/customer' };
  cy.url().should('include', pathMap[role]);
});
