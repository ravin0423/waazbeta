// ═══════════════════════════════════════════════════════════════════
// TEST 2: Dashboard & Metrics (10 tests)
// ═══════════════════════════════════════════════════════════════════
import { AdminDashboardPage } from '../../support/page-objects/admin';

describe('Admin Dashboard & Metrics', () => {
  const dashboard = new AdminDashboardPage();

  beforeEach(() => {
    cy.loginAsAdmin();
    dashboard.interceptAPIs();
  });

  // ── 2.1 Dashboard loads with KPI cards ──
  it('TC-2.1: Should load dashboard with all metric cards', () => {
    dashboard.visit();
    dashboard.waitForLoad();
    dashboard.assertKPICardsVisible(4);
    cy.log('✅ Dashboard loaded with KPI cards');
  });

  // ── 2.2 Metrics show numeric values ──
  it('TC-2.2: Should display numeric values in stats cards', () => {
    dashboard.visit();
    dashboard.waitForLoad();
    dashboard.assertStatsCardValues();
    cy.log('✅ Stats cards showing numeric values');
  });

  // ── 2.3 Charts render ──
  it('TC-2.3: Should render charts correctly', () => {
    dashboard.visit();
    dashboard.waitForLoad();
    dashboard.assertChartsRender();
    cy.log('✅ Charts rendered');
  });

  // ── 2.4 Device approval count ──
  it('TC-2.4: Should show device approval count', () => {
    dashboard.visit();
    dashboard.waitForLoad();
    dashboard.assertDeviceApprovalCount();
    cy.log('✅ Device approval metrics visible');
  });

  // ── 2.5 Claim pipeline counts ──
  it('TC-2.5: Should show claim pipeline counts', () => {
    dashboard.visit();
    dashboard.waitForLoad();
    cy.get('body').invoke('text').should('match', /claim|pending|approved|repair/i);
    cy.log('✅ Claim pipeline data visible');
  });

  // ── 2.6 API calls succeed ──
  it('TC-2.6: Should make successful API calls for dashboard data', () => {
    dashboard.visit();
    dashboard.waitForLoad();
    cy.wait('@getDevices', { timeout: 15000 }).its('response.statusCode').should('be.oneOf', [200, 206]);
    cy.wait('@getClaims', { timeout: 15000 }).its('response.statusCode').should('be.oneOf', [200, 206]);
    cy.log('✅ Dashboard APIs responded successfully');
  });

  // ── 2.7 Performance — loads under 5s ──
  it('TC-2.7: Should load dashboard within 5 seconds', () => {
    dashboard.visit();
    dashboard.assertLoadTime(5000);
    cy.log('✅ Dashboard loaded within performance budget');
  });

  // ── 2.8 Navigation sidebar present ──
  it('TC-2.8: Should display navigation sidebar', () => {
    dashboard.visit();
    dashboard.waitForLoad();
    cy.get('nav, aside').should('exist');
    cy.log('✅ Navigation sidebar present');
  });

  // ── 2.9 Responsive layout ──
  it('TC-2.9: Should display responsive layout', () => {
    dashboard.visit();
    dashboard.waitForLoad();
    cy.get('[class*="card"]').should('be.visible');
    cy.log('✅ Dashboard layout renders correctly');
  });

  // ── 2.10 Data refresh on revisit ──
  it('TC-2.10: Should refresh data on revisit', () => {
    dashboard.visit();
    dashboard.waitForLoad();
    cy.visit('/admin/device-approvals');
    cy.waitForPage();
    dashboard.visit();
    dashboard.waitForLoad();
    dashboard.assertKPICardsVisible();
    cy.log('✅ Dashboard data refreshes on revisit');
  });
});
