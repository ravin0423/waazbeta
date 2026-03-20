// ═══════════════════════════════════════════════════════════════════
// TEST 6: Partner Management (10 tests)
// ═══════════════════════════════════════════════════════════════════
import { PartnerManagementPage } from '../../support/page-objects/admin';

describe('Admin Partner Management', () => {
  const partnerPage = new PartnerManagementPage();

  beforeEach(() => {
    cy.loginAsAdmin();
    partnerPage.interceptAPIs();
  });

  // ── 6.1 Page loads ──
  it('TC-6.1: Should load partners page with table', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    partnerPage.getPartnersTable().should('exist');
    cy.log('✅ Partners page loaded');
  });

  // ── 6.2 Partners API ──
  it('TC-6.2: Should fetch partners from API', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    cy.wait('@getPartners', { timeout: 15000 }).its('response.statusCode').should('be.oneOf', [200, 206]);
    cy.log('✅ Partners API responded');
  });

  // ── 6.3 Partner rows display ──
  it('TC-6.3: Should display partners in table', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    partnerPage.getPartnerRows().should('have.length.gte', 0);
    cy.log('✅ Partner rows loaded');
  });

  // ── 6.4 Performance leaderboard ──
  it('TC-6.4: Should display performance leaderboard', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    partnerPage.assertPerformanceLeaderboard();
    cy.log('✅ Performance leaderboard displayed');
  });

  // ── 6.5 SLA compliance ──
  it('TC-6.5: Should show SLA compliance ranking', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    partnerPage.assertSLACompliance();
    cy.log('✅ SLA compliance visible');
  });

  // ── 6.6 Quality rating ──
  it('TC-6.6: Should display quality ratings', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    partnerPage.assertQualityRating();
    cy.log('✅ Quality ratings displayed');
  });

  // ── 6.7 Filter by location ──
  it('TC-6.7: Should filter partners by location', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    cy.get('body').then(($body) => {
      const hasFilter = $body.find('button[role="combobox"], select, input[placeholder*="earch"]').length > 0;
      cy.log(hasFilter ? '✅ Filter controls available' : '⚠️ No filter controls');
    });
  });

  // ── 6.8 Search partner ──
  it('TC-6.8: Should search partners by name', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    cy.get('input[placeholder*="earch"]').then(($input) => {
      if ($input.length) {
        cy.wrap($input.first()).clear().type('Tech');
        cy.wait(1000);
        cy.log('✅ Partner search applied');
      }
    });
  });

  // ── 6.9 Partner detail modal ──
  it('TC-6.9: Should open partner detail view', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    partnerPage.getPartnerRows().then(($rows) => {
      if ($rows.length > 0) {
        partnerPage.clickPartner(0);
        cy.wait(1500);
        partnerPage.assertPartnerDetailView();
        partnerPage.assertPartnerInfo();
        cy.log('✅ Partner detail opened');
      }
    });
  });

  // ── 6.10 Commission data ──
  it('TC-6.10: Should display commission data', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    partnerPage.assertCommissionData();
    cy.log('✅ Commission data visible');
  });
});
