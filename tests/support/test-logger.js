// ─── Structured Test Logger ───
// Usage: import { logger } from '../support/test-logger';

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

function getLevel() {
  return LOG_LEVELS[Cypress.env('LOG_LEVEL') || 'info'] || 1;
}

export const logger = {
  debug(msg, data) {
    if (getLevel() <= 0) {
      Cypress.log({ name: '🔍 DEBUG', message: msg, consoleProps: () => data || {} });
    }
  },
  info(msg) {
    if (getLevel() <= 1) {
      Cypress.log({ name: 'ℹ️ INFO', message: msg });
    }
  },
  warn(msg) {
    if (getLevel() <= 2) {
      Cypress.log({ name: '⚠️ WARN', message: msg });
    }
  },
  error(msg, err) {
    Cypress.log({ name: '❌ ERROR', message: msg, consoleProps: () => ({ error: err }) });
  },
  step(stepNum, description) {
    Cypress.log({ name: `Step ${stepNum}`, message: description });
  },
};
