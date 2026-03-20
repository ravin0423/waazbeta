// Global before/after hooks and custom command imports
import './commands';
import './auth-helpers';

// Suppress uncaught exceptions from the app
Cypress.on('uncaught:exception', () => false);

beforeEach(() => {
  cy.log(`Running: ${Cypress.currentTest.title}`);
});
