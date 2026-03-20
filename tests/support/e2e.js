// ─── Global Setup ───
import './commands';
import './auth-helpers';
import './api-helpers';

// Suppress uncaught exceptions from the app (SPA navigation errors, etc.)
Cypress.on('uncaught:exception', (err) => {
  // Still fail on explicit test assertions
  if (err.message.includes('AssertionError')) return true;
  // Log but don't fail on app-level errors
  Cypress.log({ name: '⚠️ App Error', message: err.message });
  return false;
});

// ── Structured logging per test ──
beforeEach(function () {
  const testTitle = Cypress.currentTest?.title || 'unknown';
  const suite = Cypress.currentTest?.titlePath?.[0] || '';
  cy.task('log', `▶ ${suite} → ${testTitle}`);
});

afterEach(function () {
  const state = this.currentTest?.state;
  const title = Cypress.currentTest?.title || '';
  if (state === 'failed') {
    cy.task('log', `❌ FAILED: ${title}`);
  }
});

// ── Performance timing (attach to each test) ──
let testStart;
beforeEach(() => {
  testStart = Date.now();
});
afterEach(function () {
  const duration = Date.now() - testStart;
  if (duration > 10000) {
    cy.task('log', `⏱ Slow test (${duration}ms): ${Cypress.currentTest?.title}`);
  }
});
