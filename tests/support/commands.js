// ─── Reusable Commands ───

/** Wait for page to fully load */
Cypress.Commands.add('waitForPage', () => {
  cy.get('body').should('be.visible');
  cy.get('[data-testid="loading"]').should('not.exist');
});

/** Assert toast notification appears with text */
Cypress.Commands.add('expectToast', (text) => {
  cy.get('[data-sonner-toast]', { timeout: 8000 }).should('contain.text', text);
});

/** Navigate via sidebar link */
Cypress.Commands.add('sidebarNav', (label) => {
  cy.get('nav').contains(label).click();
});

/** Fill a form field by label */
Cypress.Commands.add('fillField', (label, value) => {
  cy.contains('label', label).parent().find('input, textarea, select').clear().type(value);
});

/** Select option from a Radix select dropdown */
Cypress.Commands.add('selectOption', (triggerLabel, optionLabel) => {
  cy.contains('label', triggerLabel).parent().find('button[role="combobox"]').click();
  cy.get('[role="option"]').contains(optionLabel).click();
});

/** Assert table row count */
Cypress.Commands.add('tableRowCount', (minCount) => {
  cy.get('table tbody tr').should('have.length.gte', minCount);
});

/** Assert badge with text exists */
Cypress.Commands.add('expectBadge', (text) => {
  cy.get('[class*="badge"]').contains(text).should('be.visible');
});

/** Click a button by text */
Cypress.Commands.add('clickButton', (text) => {
  cy.contains('button', text).click();
});

/** Assert current URL path */
Cypress.Commands.add('assertPath', (path) => {
  cy.url().should('include', path);
});
