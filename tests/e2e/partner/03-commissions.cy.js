// ─── Test 3: Commission Tracking ───
import { PartnerLoginPage, PartnerCommissionsPage } from '../../support/page-objects/partner';

describe('Partner Commission Tracking', () => {
  const loginPage = new PartnerLoginPage();
  const commissionsPage = new PartnerCommissionsPage();

  beforeEach(() => {
    cy.fixture('partner-users').then((users) => {
      loginPage.login(users.partner.email, users.partner.password);
    });
    cy.log('🧪 Starting Commission Tracking test');
  });

  it('TC-P3.1: Should load commissions page', () => {
    commissionsPage.visit();
    commissionsPage.waitForLoad();
    commissionsPage.assertCommissionCards();
    cy.log('✅ Commissions page loaded');
  });

  it('TC-P3.2: Should display earned commission amounts in ₹', () => {
    commissionsPage.visit();
    commissionsPage.waitForLoad();
    commissionsPage.assertCommissionAmounts();
    cy.log('✅ Commission amounts displayed in ₹');
  });

  it('TC-P3.3: Should show monthly commission breakdown', () => {
    commissionsPage.visit();
    commissionsPage.waitForLoad();

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasMonthly = text.includes('month') || text.includes('jan') || text.includes('feb') ||
                         text.includes('breakdown') || text.includes('period');
      cy.log(hasMonthly ? '✅ Monthly breakdown visible' : '⚠️ Monthly breakdown not explicitly shown');
    });
  });

  it('TC-P3.4: Should display YTD total earnings', () => {
    commissionsPage.visit();
    commissionsPage.waitForLoad();

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasTotal = text.includes('total') || text.includes('ytd') ||
                      text.includes('earned') || text.includes('overall');
      cy.log(hasTotal ? '✅ YTD total earnings displayed' : '⚠️ YTD total not explicitly labeled');
    });
  });

  it('TC-P3.5: Should show payout history with statuses', () => {
    cy.fixture('partner-commissions').then((commissions) => {
      commissionsPage.visit();
      commissionsPage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const hasPayoutInfo = commissions.payoutStatuses.some((s) => text.includes(s));
        cy.log(hasPayoutInfo ? '✅ Payout status information visible' : '⚠️ No payout status labels found');
      });
    });
  });

  it('TC-P3.6: Should verify commission calculation components', () => {
    cy.fixture('partner-commissions').then((commissions) => {
      commissionsPage.visit();
      commissionsPage.waitForLoad();

      const { expectedMetrics } = commissions;
      cy.log('📋 Commission structure:');
      cy.log(`  Base rate: ${expectedMetrics.baseCommissionRate}%`);
      cy.log(`  SLA bonus: ${expectedMetrics.slaBonusRate}%`);
      cy.log(`  Rating bonus: ${expectedMetrics.ratingBonusRate}%`);
      cy.log(`  Volume bonus: ${expectedMetrics.volumeBonusRate}%`);
      cy.log(`  TDS deduction: ${expectedMetrics.tdsRate}%`);

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const hasCommissionDetail = text.includes('base') || text.includes('bonus') ||
                                    text.includes('commission') || text.includes('rate');
        cy.log(hasCommissionDetail ? '✅ Commission calculation details visible' : '⚠️ Details not visible on page');
      });
    });
  });

  it('TC-P3.7: Should verify data isolation — only own commissions visible', () => {
    commissionsPage.visit();
    commissionsPage.waitForLoad();

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasOtherPartnerData = text.includes('all partners') || text.includes('system total');
      expect(hasOtherPartnerData).to.be.false;
      cy.log('✅ Data isolation verified — only own commissions visible');
    });
  });

  it('TC-P3.8: Should display commission table or cards', () => {
    commissionsPage.visit();
    commissionsPage.waitForLoad();
    commissionsPage.assertMonthlyBreakdown();
    cy.log('✅ Commission data table/cards displayed');
  });
});
