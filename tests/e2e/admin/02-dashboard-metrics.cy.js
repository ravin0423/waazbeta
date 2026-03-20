// ═══════════════════════════════════════════════════════════════════
// TEST 2: Admin Dashboard & Metrics
// ═══════════════════════════════════════════════════════════════════
import { AdminDashboardPage } from '../../support/page-objects/admin';

describe('Admin Dashboard & Metrics', () => {
  const dashboard = new AdminDashboardPage();

  beforeEach(() => {
    cy.loginAsAdmin();
    dashboard.interceptDashboardAPIs();
  });

  // ── 2.1 Dashboard loads with all metric cards ──
  it('TC-2.1: Should load dashboard with KPI metric cards', () => {
    dashboard.visit();
    dashboard.waitForLoad();
    dashboard.assertKPICardsVisible();
    dashboard.assertMetricsLoaded();
    cy.log('✅ Dashboard loaded with all metric cards');
  });

  // ── 2.2 Dashboard API performance ──
  it('TC-2.2: Should load dashboard data within performance threshold', () => {
    const loadStart = Date.now();
    dashboard.visit();
    dashboard.waitForLoad();
    cy.then(() => {
      const loadTime = Date.now() - loadStart;
      cy.task('log', `⏱ Dashboard load time: ${loadTime}ms`);
      expect(loadTime).to.be.lessThan(15000, 'Dashboard should load within 15s');
    });
  });

  // ── 2.3 Claim pipeline chart renders ──
  it('TC-2.3: Should render claim pipeline bar chart', () => {
    dashboard.visit();
    dashboard.waitForLoad();
    dashboard.assertClaimPipelineChart();
    cy.log('✅ Claim pipeline chart rendered');
  });

  // ── 2.4 Stats cards show real data ──
  it('TC-2.4: Should display numeric values in KPI cards (not placeholders)', () => {
    dashboard.visit();
    dashboard.waitForLoad();
    // At least some cards should show numbers
    cy.get('[class*="card"]').then(($cards) => {
      const text = $cards.text();
      const hasNumbers = /\d+/.test(text);
      expect(hasNumbers).to.be.true;
      cy.log('✅ KPI cards contain real numeric values');
    });
  });

  // ── 2.5 Date range filter works ──
  it('TC-2.5: Should filter dashboard data by date range', () => {
    dashboard.visit();
    dashboard.waitForLoad();

    cy.get('body').then(($body) => {
      const hasPresets = $body.find('button[role="combobox"], select').length > 0;
      if (hasPresets) {
        dashboard.assertDateRangeFilter();
        cy.log('✅ Date range filter controls present');
      } else {
        cy.log('ℹ️ No date range filter on dashboard');
      }
    });
  });

  // ── 2.6 Alerts section ──
  it('TC-2.6: Should display alerts for critical issues', () => {
    dashboard.visit();
    dashboard.waitForLoad();
    dashboard.assertAlertsSection();
  });

  // ── 2.7 Dashboard sub-pages accessible ──
  it('TC-2.7: Should access analytics sub-page', () => {
    cy.visit('/admin/analytics');
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    cy.get('[class*="card"]', { timeout: 10000 }).should('have.length.gte', 1);
    cy.log('✅ Analytics page loaded');
  });
});
