// ─── Authentication Helpers ───

/** Login via UI form */
Cypress.Commands.add('loginViaUI', (email, password) => {
  cy.visit('/login');
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
  cy.contains('button', /sign in|log in/i).click();
  cy.url().should('not.include', '/login', { timeout: 15000 });
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
  cy.url().should('include', '/login');
});
