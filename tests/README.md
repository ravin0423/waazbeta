# WaaZ E2E Testing Framework

## Quick Start

```bash
npm install
npm run dev                    # Start the app
npm run test:e2e               # Run all tests headless
npm run test:e2e:open          # Open Cypress GUI
npm run test:e2e:admin         # Run admin portal tests only
npm run test:e2e:partner       # Run partner portal tests only
npm run test:e2e:customer      # Run customer portal tests only
```

## Project Structure

```
tests/
├── e2e/                        # Test specs organized by portal
│   ├── admin/                  # Admin portal tests (6 specs)
│   ├── partner/                # Partner portal tests (5 specs)
│   ├── customer/               # Customer portal tests (5 specs)
│   ├── integration/            # Cross-portal integration tests (5 specs)
│   └── auth/                   # Authentication tests
├── fixtures/                   # Test data (JSON)
├── support/
│   ├── e2e.js                  # Global hooks & imports
│   ├── commands.js             # Reusable Cypress commands
│   ├── auth-helpers.js         # Login/logout with session caching
│   ├── api-helpers.js          # API testing & interception
│   ├── test-logger.js          # Structured logging utility
│   └── page-objects/           # Page Object Models
│       ├── admin.js            # 7 admin page objects
│       ├── customer.js         # 9 customer page objects
│       └── partner.js          # 8 partner page objects
├── results/                    # Generated reports, screenshots, videos
└── reporter-config.json        # Mochawesome reporter config
```

## Key Features

| Feature | Details |
|---------|---------|
| **Session caching** | `cy.session()` caches auth across specs — no re-login per test |
| **Retries** | 2 retries in CI, 0 in interactive mode |
| **Video on failure** | Videos auto-deleted for passing specs |
| **Screenshots** | Auto-captured on failure |
| **API helpers** | `cy.apiRequest()`, `cy.interceptSupabase()`, `cy.assertResponseTime()` |
| **Page Objects** | 24 page object classes across all 3 portals |
| **Parallel execution** | GitHub Actions matrix splits by portal |
| **Reports** | Mochawesome HTML + JSON reports |

## Environment Configuration

Copy `cypress.env.example.json` to `cypress.env.json` and fill in real credentials:

```bash
cp cypress.env.example.json cypress.env.json
```

## Writing New Tests

```js
import { AdminDashboardPage } from '../../support/page-objects/admin';

describe('My Feature', () => {
  const dashboard = new AdminDashboardPage();

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('should do something', () => {
    dashboard.visit();
    dashboard.assertKPICardsVisible();
  });
});
```

## CI/CD

Tests run automatically on push to `main`/`develop` via GitHub Actions with parallel execution per portal. Reports are uploaded as build artifacts.

## Custom Commands Reference

| Command | Description |
|---------|-------------|
| `cy.loginAsAdmin()` | Login with admin session caching |
| `cy.loginAsPartner()` | Login with partner session caching |
| `cy.loginAsCustomer()` | Login with customer session caching |
| `cy.waitForPage()` | Wait for all spinners to disappear |
| `cy.expectToast(text)` | Assert toast notification |
| `cy.apiRequest(method, table, opts)` | Make Supabase REST call |
| `cy.interceptSupabase(table)` | Intercept & alias API calls |
| `cy.assertResponseTime(alias, ms)` | Assert API response time |
| `cy.safeClick()` | Click with DOM detach retry |
| `cy.namedScreenshot(name)` | Take labeled screenshot |
| `cy.ifExists(selector, fn)` | Conditional action |
