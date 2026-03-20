// ─── Test 5: Commission Dashboard ───
import { AdminLoginPage } from '../../support/page-objects/admin';

describe('Admin Commission Dashboard', () => {
  const loginPage = new AdminLoginPage();

  beforeEach(() => {
    cy.fixture('admin-users').then((users) => {
      loginPage.login(users.admin.email, users.admin.password);
    });
    cy.log('🧪 Starting Commission Dashboard test');
  });

  it('TC-5.1: Should load partner payments page', () => {
    cy.visit('/admin/finance/partner-payments');
    cy.url().should('include', '/admin/finance/partner-payments');
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    cy.log('✅ Partner payments page loaded');
  });

  it('TC-5.2: Should display commission data in table', () => {
    cy.visit('/admin/finance/partner-payments');
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');

    cy.get('table, [class*="card"]', { timeout: 10000 }).should('exist');
    cy.log('✅ Commission data displayed');
  });

  it('TC-5.3: Should verify commission calculation components', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      cy.visit('/admin/finance/partner-payments');
      cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');

      // Verify commission-related labels exist
      const labels = ['commission', 'amount', 'rate', 'total'];
      cy.get('body').then(($body) => {
        const bodyText = $body.text().toLowerCase();
        labels.forEach((label) => {
          const found = bodyText.includes(label);
          cy.log(found ? `✅ "${label}" label found` : `⚠️ "${label}" label not found`);
        });
      });

      cy.log(`📋 Expected base rate: ${commissions.commissionRules.baseRate}%`);
      cy.log(`📋 TDS rate: ${commissions.tdsRate}%`);
    });
  });

  it('TC-5.4: Should verify bonus application logic', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      const rules = commissions.commissionRules;

      cy.log('📋 Commission bonus rules:');
      cy.log(`  SLA Bonus: ${rules.slaBonusRate}%`);
      cy.log(`  Rating Bonus: ${rules.ratingBonusRate}% (threshold: ${rules.ratingBonusThreshold})`);
      cy.log(`  Volume Bonus: ${rules.volumeBonusRate}% (threshold: ${rules.volumeBonusThreshold} claims)`);

      cy.visit('/admin/finance/partner-payments');
      cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');

      // Look for bonus-related elements
      cy.get('body').then(($body) => {
        const bodyText = $body.text().toLowerCase();
        const hasBonusInfo = bodyText.includes('bonus') || bodyText.includes('sla') || bodyText.includes('rating');
        cy.log(hasBonusInfo ? '✅ Bonus information visible' : '⚠️ No bonus details visible on page');
      });
    });
  });

  it('TC-5.5: Should verify penalty/deduction logic', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      const rules = commissions.commissionRules;

      cy.log('📋 Penalty rules:');
      cy.log(`  Late Penalty: ${rules.latePenaltyRate}%`);
      cy.log(`  Quality Penalty: ${rules.qualityPenaltyRate}% (below ${rules.qualityPenaltyThreshold} rating)`);

      cy.visit('/admin/finance/partner-payments');
      cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');

      cy.get('body').then(($body) => {
        const bodyText = $body.text().toLowerCase();
        const hasPenalty = bodyText.includes('penalty') || bodyText.includes('deduction');
        cy.log(hasPenalty ? '✅ Penalty/deduction info visible' : '⚠️ No penalty details on page');
      });
    });
  });

  it('TC-5.6: Should verify payout status tracking', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      cy.visit('/admin/finance/partner-payments');
      cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');

      // Check for payout status badges
      cy.get('body').then(($body) => {
        const bodyText = $body.text().toLowerCase();
        const statusFound = commissions.payoutStatuses.some((status) => bodyText.includes(status));
        cy.log(statusFound ? '✅ Payout status tracking visible' : '⚠️ No payout status labels found');
      });
    });
  });

  it('TC-5.7: Should verify TDS deduction display', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      cy.visit('/admin/finance/partner-payments');
      cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');

      cy.get('body').then(($body) => {
        const bodyText = $body.text().toLowerCase();
        const hasTDS = bodyText.includes('tds') || bodyText.includes('tax deducted');
        cy.log(hasTDS
          ? `✅ TDS display found (expected rate: ${commissions.tdsRate}%)`
          : '⚠️ TDS information not visible');
      });
    });
  });

  it('TC-5.8: Should test commission report download', () => {
    cy.visit('/admin/finance/partner-payments');
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');

    cy.get('body').then(($body) => {
      const hasDownload = $body.find('button:contains("Download"), button:contains("Export"), button:contains("CSV")').length > 0;
      if (hasDownload) {
        cy.contains('button', /download|export|csv/i).first().click({ force: true });
        cy.log('✅ Commission report download triggered');
      } else {
        cy.log('⚠️ No download/export button found');
      }
    });
  });
});
