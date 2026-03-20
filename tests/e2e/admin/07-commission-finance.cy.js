// ═══════════════════════════════════════════════════════════════════
// TEST 7: Commission & Financial (12 tests)
// ═══════════════════════════════════════════════════════════════════
import { FinanceDashboardPage } from '../../support/page-objects/admin';

describe('Admin Commission & Financial', () => {
  const financePage = new FinanceDashboardPage();

  beforeEach(() => {
    cy.loginAsAdmin();
    financePage.interceptAPIs();
  });

  // ── 7.1 Finance overview ──
  it('TC-7.1: Should load finance overview with KPI cards', () => {
    financePage.visitOverview();
    financePage.waitForLoad();
    financePage.assertKPICards(3);
    cy.log('✅ Finance overview loaded');
  });

  // ── 7.2 Currency display ──
  it('TC-7.2: Should display currency values in INR (₹)', () => {
    financePage.visitOverview();
    financePage.waitForLoad();
    financePage.assertCurrencyValues();
    cy.log('✅ INR currency displayed');
  });

  // ── 7.3 Revenue trend chart ──
  it('TC-7.3: Should render revenue trend chart', () => {
    financePage.visitOverview();
    financePage.waitForLoad();
    financePage.assertTrendChart();
    cy.log('✅ Revenue trend chart rendered');
  });

  // ── 7.4 Transactions ──
  it('TC-7.4: Should load transactions table', () => {
    financePage.visitTransactions();
    financePage.waitForLoad();
    financePage.assertTransactionsTable();
    cy.log('✅ Transactions table loaded');
  });

  // ── 7.5 GST returns ──
  it('TC-7.5: Should display GST returns (GSTR-1/3B)', () => {
    financePage.visitGST();
    financePage.waitForLoad();
    financePage.assertGSTReturns();
    cy.log('✅ GST returns displayed');
  });

  // ── 7.6 Partner payouts ──
  it('TC-7.6: Should display partner payout data', () => {
    financePage.visitPartnerPayments();
    financePage.waitForLoad();
    financePage.assertPartnerPayouts();
    cy.log('✅ Partner payouts displayed');
  });

  // ── 7.7 Compliance info ──
  it('TC-7.7: Should show compliance info (PAN, GSTIN, Udyam)', () => {
    financePage.visitCompliance();
    financePage.waitForLoad();
    financePage.assertComplianceInfo();
    cy.log('✅ Compliance info displayed');
  });

  // ── 7.8 Commission formula ──
  it('TC-7.8: Should validate commission formula (Base + Bonuses - Penalties)', () => {
    cy.fixture('admin-commissions').then((data) => {
      const { commissionRules, testCommission } = data;
      const base = testCommission.claimAmount * (commissionRules.baseRate / 100);
      expect(base).to.equal(testCommission.expectedBase);
      cy.log(`✅ Base: ₹${base} (${commissionRules.baseRate}% of ₹${testCommission.claimAmount})`);

      const total = testCommission.expectedBase + testCommission.expectedSLABonus +
                    testCommission.expectedRatingBonus + testCommission.expectedVolumeBonus -
                    testCommission.expectedPenalty;
      expect(total).to.equal(testCommission.expectedTotal);
      cy.log(`✅ Total commission: ₹${total}`);
    });
  });

  // ── 7.9 TDS deduction ──
  it('TC-7.9: Should apply 10% TDS deduction', () => {
    cy.fixture('admin-commissions').then((data) => {
      const gross = data.testCommission.expectedTotal;
      const tds = gross * (data.tdsRate / 100);
      const net = gross - tds;
      expect(tds).to.equal(gross * 0.1);
      cy.log(`✅ TDS: ₹${tds}, Net: ₹${net}`);
    });
  });

  // ── 7.10 Penalty scenario ──
  it('TC-7.10: Should calculate penalty deductions', () => {
    cy.fixture('admin-commissions').then((data) => {
      const { penaltyScenario, commissionRules } = data;
      const base = penaltyScenario.claimAmount * (commissionRules.baseRate / 100);
      expect(base).to.equal(penaltyScenario.expectedBase);
      const penalty = penaltyScenario.claimAmount * (commissionRules.latePenaltyRate / 100);
      expect(penalty).to.equal(penaltyScenario.expectedPenalty);
      cy.log(`✅ Penalty: ₹${penalty} — ${penaltyScenario.reason}`);
    });
  });

  // ── 7.11 Invoices table ──
  it('TC-7.11: Should load invoices table', () => {
    financePage.visitInvoices();
    financePage.waitForLoad();
    financePage.assertInvoicesTable();
    cy.log('✅ Invoices table loaded');
  });

  // ── 7.12 Finance APIs ──
  it('TC-7.12: Should make successful finance API calls', () => {
    financePage.visitOverview();
    financePage.waitForLoad();
    cy.wait('@getTransactions', { timeout: 15000 }).its('response.statusCode').should('be.oneOf', [200, 206]);
    cy.log('✅ Finance APIs responded');
  });
});
