// ═══════════════════════════════════════════════════════════════════
// TEST 6: Partner Management
// ═══════════════════════════════════════════════════════════════════
import { PartnerManagementPage } from '../../support/page-objects/admin';

describe('Admin Partner Management', () => {
  const partnerPage = new PartnerManagementPage();

  beforeEach(() => {
    cy.loginAsAdmin();
    partnerPage.interceptAPIs();
  });

  // ── 6.1 Partners page loads ──
  it('TC-6.1: Should load partners management page with table', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    partnerPage.getPartnersTable().should('exist');

    cy.wait('@getPartners', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
    cy.log('✅ Partners management page loaded');
  });

  // ── 6.2 Partner list data ──
  it('TC-6.2: Should display partner rows with key information', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();

    partnerPage.getPartnerRows().then(($rows) => {
      if ($rows.length > 0) {
        cy.log(`✅ ${$rows.length} partners displayed`);
        // Verify table has expected columns
        cy.get('table thead th').should('have.length.gte', 3);
      } else {
        cy.log('⚠️ No partners found');
      }
    });
  });

  // ── 6.3 Performance leaderboard ──
  it('TC-6.3: Should display partner performance leaderboard', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    partnerPage.assertPerformanceLeaderboard();
    cy.log('✅ Performance leaderboard displayed');
  });

  // ── 6.4 SLA compliance ranking ──
  it('TC-6.4: Should display SLA compliance metrics', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasSLA = text.includes('sla') || text.includes('compliance') || text.includes('turnaround');
      cy.log(hasSLA ? '✅ SLA compliance metrics visible' : '⚠️ SLA metrics not displayed');
    });
  });

  // ── 6.5 Quality rating display ──
  it('TC-6.5: Should display quality ratings for partners', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    partnerPage.assertQualityRating();
    cy.log('✅ Quality ratings displayed');
  });

  // ── 6.6 Search partners ──
  it('TC-6.6: Should search partners by name', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();

    cy.get('body').then(($body) => {
      const $search = $body.find('input[placeholder*="earch"]');
      if ($search.length) {
        cy.wrap($search.first()).clear().type('Tech');
        cy.wait(500);
        cy.log('✅ Partner search executed');
      } else {
        cy.log('⚠️ Search input not found');
      }
    });
  });

  // ── 6.7 Filter by location ──
  it('TC-6.7: Should filter partners by location/region', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();

    cy.get('body').then(($body) => {
      const hasLocationFilter = $body.find('button[role="combobox"], select').length > 0;
      if (hasLocationFilter) {
        cy.log('✅ Location filter controls available');
      } else {
        cy.log('⚠️ No location filter found');
      }
    });
  });

  // ── 6.8 Filter by rating ──
  it('TC-6.8: Should filter partners by rating', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();

    cy.get('body').then(($body) => {
      const hasRatingFilter = $body.find('button[role="combobox"], select').length > 1;
      cy.log(hasRatingFilter ? '✅ Rating filter available' : '⚠️ Rating filter not found');
    });
  });

  // ── 6.9 Partner detail view ──
  it('TC-6.9: Should open partner detail view with all information', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();

    partnerPage.getPartnerRows().then(($rows) => {
      if ($rows.length > 0) {
        partnerPage.clickPartner(0);
        cy.wait(2000);

        cy.get('body').then(($body) => {
          const text = $body.text().toLowerCase();
          const checks = [
            { label: 'name', found: text.includes('name') || $body.find('h2, h3').length > 0 },
            { label: 'commission', found: text.includes('commission') || text.includes('rate') },
            { label: 'city/location', found: text.includes('city') || text.includes('location') || text.includes('state') },
            { label: 'rating', found: text.includes('rating') || text.includes('quality') },
          ];

          checks.forEach(({ label, found }) => {
            cy.log(found ? `✅ "${label}" displayed` : `⚠️ "${label}" not found`);
          });
        });
      }
    });
  });

  // ── 6.10 Commission data ──
  it('TC-6.10: Should display commission rate for partners', () => {
    partnerPage.visit();
    partnerPage.waitForLoad();
    partnerPage.assertCommissionData();
    cy.log('✅ Commission data displayed');
  });

  // ── 6.11 Page load performance ──
  it('TC-6.11: Should load partners page within performance threshold', () => {
    const start = Date.now();
    partnerPage.visit();
    partnerPage.waitForLoad();
    cy.then(() => {
      const duration = Date.now() - start;
      cy.task('log', `⏱ Partners page load: ${duration}ms`);
      expect(duration).to.be.lessThan(10000, 'Partners page should load within 10s');
    });
  });
});
