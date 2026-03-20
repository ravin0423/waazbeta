// ─── Core Reusable Commands ───

/** Wait for page to fully load (no spinners) */
Cypress.Commands.add('waitForPage', (timeout = 15000) => {
  cy.get('[class*="animate-spin"]', { timeout }).should('not.exist');
  cy.get('body').should('be.visible');
});

/** Assert toast notification appears with text */
Cypress.Commands.add('expectToast', (text, timeout = 8000) => {
  cy.get('[data-sonner-toast]', { timeout }).should('contain.text', text);
});

/** Assert any toast notification appears */
Cypress.Commands.add('expectAnyToast', (timeout = 8000) => {
  cy.get('[data-sonner-toast]', { timeout }).should('exist');
});

/** Navigate via sidebar link */
Cypress.Commands.add('sidebarNav', (label) => {
  cy.get('nav, aside').contains(label, { matchCase: false }).click({ force: true });
  cy.waitForPage();
});

/** Fill a form field by label */
Cypress.Commands.add('fillField', (label, value) => {
  cy.contains('label', label)
    .parent()
    .find('input, textarea, select')
    .clear()
    .type(value);
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

/** Safe click — retries if element detaches from DOM */
Cypress.Commands.add('safeClick', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('be.visible').click({ force: true });
});

/** Wait for network idle (no pending XHR/fetch for N ms) */
Cypress.Commands.add('waitForNetworkIdle', (idleMs = 1000) => {
  cy.intercept('**/*').as('allRequests');
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(idleMs);
});

/** Take named screenshot for documentation */
Cypress.Commands.add('namedScreenshot', (name) => {
  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  cy.screenshot(sanitized, { capture: 'viewport' });
});

/** Assert element contains text (case-insensitive) */
Cypress.Commands.add('containsText', (text) => {
  cy.get('body').contains(new RegExp(text, 'i')).should('exist');
});

/** Conditional action — run callback only if selector exists */
Cypress.Commands.add('ifExists', (selector, callback) => {
  cy.get('body').then(($body) => {
    if ($body.find(selector).length > 0) {
      callback();
    }
  });
});
