// ─── Test 1: Partner Login & Dashboard ───
import { PartnerLoginPage, PartnerDashboardPage } from '../../support/page-objects/partner';

describe('Partner Login & Dashboard', () => {
  const loginPage = new PartnerLoginPage();
  const dashboardPage = new PartnerDashboardPage();

  beforeEach(() => {
    cy.log('🧪 Starting Partner Login & Dashboard test');
  });

  it('TC-P1.1: Should login with valid partner credentials', () => {
    cy.fixture('partner-users').then((users) => {
      loginPage.login(users.partner.email, users.partner.password);
      loginPage.assertOnPartnerDashboard();
      cy.log(`✅ Partner ${users.partner.name} logged in successfully`);
    });
  });

  it('TC-P1.2: Should reject invalid credentials', () => {
    cy.fixture('partner-users').then((users) => {
      loginPage.visit();
      cy.get('input[type="email"]').clear().type(users.invalidUser.email);
      cy.get('input[type="password"]').clear().type(users.invalidUser.password);
      cy.contains('button', /sign in|log in/i).click();
      cy.url().should('include', '/login');
      cy.log('✅ Invalid credentials rejected');
    });
  });

  it('TC-P1.3: Should display dashboard with KPI metrics', () => {
    cy.fixture('partner-users').then((users) => {
      loginPage.login(users.partner.email, users.partner.password);
      dashboardPage.waitForLoad();
      dashboardPage.assertKPICards();
      dashboardPage.assertMetricsLoaded();
      cy.log('✅ Dashboard KPI metrics loaded');
    });
  });

  it('TC-P1.4: Should display claims queue on dashboard', () => {
    cy.fixture('partner-users').then((users) => {
      loginPage.login(users.partner.email, users.partner.password);
      dashboardPage.waitForLoad();
      dashboardPage.assertClaimsQueueVisible();
      cy.log('✅ Claims queue visible on dashboard');
    });
  });

  it('TC-P1.5: Should NOT be able to access admin portal', () => {
    cy.fixture('partner-users').then((users) => {
      loginPage.login(users.partner.email, users.partner.password);
      loginPage.assertCannotAccessAdmin();
      cy.log('✅ Admin portal access correctly denied');
    });
  });

  it('TC-P1.6: Should NOT be able to access customer portal', () => {
    cy.fixture('partner-users').then((users) => {
      loginPage.login(users.partner.email, users.partner.password);
      loginPage.assertCannotAccessCustomer();
      cy.log('✅ Customer portal access correctly denied');
    });
  });

  it('TC-P1.7: Should maintain session after page reload', () => {
    cy.fixture('partner-users').then((users) => {
      loginPage.login(users.partner.email, users.partner.password);
      loginPage.assertOnPartnerDashboard();
      cy.reload();
      cy.url().should('include', '/partner', { timeout: 15000 });
      cy.log('✅ Partner session persisted after reload');
    });
  });

  it('TC-P1.8: Should navigate to all sidebar sections', () => {
    cy.fixture('partner-users').then((users) => {
      loginPage.login(users.partner.email, users.partner.password);
      dashboardPage.waitForLoad();

      const sections = [
        { label: /customer|claim/i, path: '/partner/' },
        { label: /commission/i, path: '/partner/commissions' },
        { label: /performance/i, path: '/partner/performance' },
        { label: /ticket|support/i, path: '/partner/tickets' },
      ];

      sections.forEach(({ label, path }) => {
        cy.get('nav, aside').contains(label).then(($el) => {
          if ($el.length) {
            cy.wrap($el).click({ force: true });
            cy.wait(500);
            cy.log(`✅ Navigated to ${path}`);
          }
        });
      });
    });
  });
});
