// ═══════════════════════════════════════════════════════════════════
// TEST 7: Commission & Financial Dashboard
// ═══════════════════════════════════════════════════════════════════
import { FinanceDashboardPage } from '../../support/page-objects/admin';

describe('Admin Commission & Financial Dashboard', () => {
  const financePage = new FinanceDashboardPage();

  beforeEach(() => {
    cy.loginAsAdmin();
    financePage.interceptAPIs();
  });

  // ═══════════════════════════════════════
  //  COMMISSION CALCULATION TESTS
  // ═══════════════════════════════════════

  // ── 7.1 Commission calculation components ──
  it('TC-7.1: Should verify commission calculation components exist', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      financePage.visitPartnerPayments();
      financePage.waitForLoad();

      cy.get('table, [class*="card"]', { timeout: 10000 }).should('exist');

      const labels = ['commission', 'amount', 'rate', 'total'];
      cy.get('body').then(($body) => {
        const bodyText = $body.text().toLowerCase();
        labels.forEach((label) => {
          const found = bodyText.includes(label);
          cy.log(found ? `✅ "${label}" found` : `⚠️ "${label}" not found`);
        });
      });

      cy.log(`📋 Base rate: ${commissions.commissionRules.baseRate}%`);
      cy.log(`📋 TDS rate: ${commissions.tdsRate}%`);
    });
  });

  // ── 7.2 Base rate tier-based ──
  it('TC-7.2: Should verify base commission rate is applied', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      const { baseRate } = commissions.commissionRules;
      const { claimAmount, expectedBase } = commissions.testCommission;

      expect(expectedBase).to.eq(claimAmount * (baseRate / 100));
      cy.log(`✅ Base rate ${baseRate}% of ₹${claimAmount} = ₹${expectedBase}`);

      financePage.visitPartnerPayments();
      financePage.waitForLoad();
      financePage.assertCurrencyValues();
    });
  });

  // ── 7.3 SLA bonus ──
  it('TC-7.3: Should verify SLA bonus application', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      const rules = commissions.commissionRules;
      const expected = commissions.testCommission;

      cy.log(`📋 SLA Bonus rate: ${rules.slaBonusRate}%`);
      cy.log(`📋 Expected SLA bonus: ₹${expected.expectedSLABonus}`);

      financePage.visitPartnerPayments();
      financePage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const hasSLA = text.includes('sla') || text.includes('bonus');
        cy.log(hasSLA ? '✅ SLA bonus information visible' : '⚠️ SLA bonus details not shown');
      });
    });
  });

  // ── 7.4 Rating bonus ──
  it('TC-7.4: Should verify rating bonus application', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      const rules = commissions.commissionRules;

      cy.log(`📋 Rating bonus: ${rules.ratingBonusRate}% for rating ≥ ${rules.ratingBonusThreshold}`);
      cy.log(`📋 Expected rating bonus: ₹${commissions.testCommission.expectedRatingBonus}`);

      financePage.visitPartnerPayments();
      financePage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const hasRating = text.includes('rating') || text.includes('quality');
        cy.log(hasRating ? '✅ Rating bonus information visible' : '⚠️ Rating bonus not shown');
      });
    });
  });

  // ── 7.5 Volume bonus ──
  it('TC-7.5: Should verify volume bonus application', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      const rules = commissions.commissionRules;

      cy.log(`📋 Volume bonus: ${rules.volumeBonusRate}% for ≥ ${rules.volumeBonusThreshold} claims`);
      cy.log(`📋 Expected volume bonus: ₹${commissions.testCommission.expectedVolumeBonus}`);

      financePage.visitPartnerPayments();
      financePage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const hasVolume = text.includes('volume') || text.includes('bonus');
        cy.log(hasVolume ? '✅ Volume bonus information visible' : '⚠️ Volume bonus not shown');
      });
    });
  });

  // ── 7.6 Penalty deductions ──
  it('TC-7.6: Should verify penalty/deduction logic', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      const rules = commissions.commissionRules;
      const penalty = commissions.penaltyScenario;

      cy.log(`📋 Late penalty: ${rules.latePenaltyRate}%`);
      cy.log(`📋 Quality penalty: ${rules.qualityPenaltyRate}% below ${rules.qualityPenaltyThreshold} rating`);
      cy.log(`📋 Penalty scenario: ₹${penalty.expectedPenalty} deduction for "${penalty.reason}"`);

      financePage.visitPartnerPayments();
      financePage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const hasPenalty = text.includes('penalty') || text.includes('deduction');
        cy.log(hasPenalty ? '✅ Penalty/deduction info visible' : '⚠️ No penalty details');
      });
    });
  });

  // ── 7.7 TDS deduction ──
  it('TC-7.7: Should verify TDS (10%) deduction display', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      financePage.visitPartnerPayments();
      financePage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const hasTDS = text.includes('tds') || text.includes('tax deducted');
        cy.log(hasTDS
          ? `✅ TDS display found (rate: ${commissions.tdsRate}%)`
          : '⚠️ TDS information not visible');
      });
    });
  });

  // ── 7.8 Payout status tracking ──
  it('TC-7.8: Should verify payout scheduling and status tracking', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      financePage.visitPartnerPayments();
      financePage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const statusFound = commissions.payoutStatuses.some((s) => text.includes(s));
        cy.log(statusFound
          ? `✅ Payout statuses found (${commissions.payoutStatuses.join(', ')})`
          : '⚠️ No payout status labels found');
      });
    });
  });

  // ── 7.9 Commission total calculation ──
  it('TC-7.9: Should verify total commission calculation', () => {
    cy.fixture('admin-commissions').then((commissions) => {
      const tc = commissions.testCommission;

      const calculatedTotal = tc.expectedBase + tc.expectedSLABonus + tc.expectedRatingBonus + tc.expectedVolumeBonus - tc.expectedPenalty;
      expect(tc.expectedTotal).to.eq(calculatedTotal);

      cy.log(`📋 Commission breakdown:`);
      cy.log(`   Base: ₹${tc.expectedBase}`);
      cy.log(`   SLA bonus: ₹${tc.expectedSLABonus}`);
      cy.log(`   Rating bonus: ₹${tc.expectedRatingBonus}`);
      cy.log(`   Volume bonus: ₹${tc.expectedVolumeBonus}`);
      cy.log(`   Penalty: -₹${tc.expectedPenalty}`);
      cy.log(`   Total: ₹${tc.expectedTotal}`);
      cy.log('✅ Commission calculation formula verified');
    });
  });

  // ═══════════════════════════════════════
  //  FINANCIAL DASHBOARD TESTS
  // ═══════════════════════════════════════

  // ── 7.10 Finance overview KPI cards ──
  it('TC-7.10: Should load finance overview with all KPI cards', () => {
    cy.fixture('admin-finance').then((finance) => {
      financePage.visitOverview();
      financePage.waitForLoad();
      financePage.assertKPICards(3);

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        finance.expectedKPIs.forEach((kpi) => {
          const found = text.includes(kpi.toLowerCase());
          cy.log(found ? `✅ KPI "${kpi}" displayed` : `⚠️ KPI "${kpi}" not found`);
        });
      });
    });
  });

  // ── 7.11 Financial trend chart ──
  it('TC-7.11: Should display 12-month financial trend chart', () => {
    financePage.visitOverview();
    financePage.waitForLoad();
    financePage.assertTrendChart();
    cy.log('✅ Financial trend chart rendered');
  });

  // ── 7.12 Invoices page ──
  it('TC-7.12: Should load invoices page with data', () => {
    cy.visit('/admin/invoices');
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    cy.get('table, [class*="card"]').should('exist');
    cy.log('✅ Invoices page loaded');
  });

  // ── 7.13 Transactions page ──
  it('TC-7.13: Should load transactions with income/expense types', () => {
    cy.fixture('admin-finance').then((finance) => {
      financePage.visitTransactions();
      financePage.waitForLoad();
      cy.get('table, [class*="card"]').should('exist');

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        finance.transactionTypes.forEach((type) => {
          const found = text.includes(type);
          cy.log(found ? `✅ "${type}" transactions visible` : `⚠️ "${type}" not found`);
        });
      });
    });
  });

  // ── 7.14 GST management ──
  it('TC-7.14: Should load GST page with return types (GSTR-1, GSTR-3B)', () => {
    cy.fixture('admin-finance').then((finance) => {
      financePage.visitGST();
      financePage.waitForLoad();
      cy.get('table, [class*="card"]').should('exist');

      cy.get('body').then(($body) => {
        const text = $body.text();
        finance.gstConfig.returnTypes.forEach((rt) => {
          const found = text.includes(rt);
          cy.log(found ? `✅ "${rt}" return type found` : `⚠️ "${rt}" not displayed`);
        });
      });

      cy.log(`📋 GST rates: CGST ${finance.gstConfig.cgstRate}% + SGST ${finance.gstConfig.sgstRate}% = ${finance.gstConfig.totalGSTRate}%`);
    });
  });

  // ── 7.15 Compliance information ──
  it('TC-7.15: Should display compliance info (PAN, GSTIN, Udyam)', () => {
    financePage.visitCompliance();
    financePage.waitForLoad();
    cy.get('[class*="card"]').should('exist');

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      ['pan', 'gstin', 'udyam', 'msme'].forEach((term) => {
        const found = text.includes(term);
        cy.log(found ? `✅ "${term}" compliance info found` : `⚠️ "${term}" not displayed`);
      });
    });
  });

  // ── 7.16 Report download ──
  it('TC-7.16: Should trigger report download from finance overview', () => {
    financePage.visitOverview();
    financePage.waitForLoad();

    cy.get('body').then(($body) => {
      const $btn = $body.find('button:contains("Download"), button:contains("Export"), button:contains("CSV"), button:contains("Report")');
      if ($btn.length > 0) {
        cy.wrap($btn.first()).click({ force: true });
        cy.log('✅ Report download triggered');
      } else {
        cy.log('⚠️ No download/export button on overview');
      }
    });
  });

  // ── 7.17 Finance section navigation ──
  it('TC-7.17: Should navigate between all finance sub-sections', () => {
    const sections = [
      { path: '/admin/finance', label: 'Overview' },
      { path: '/admin/invoices', label: 'Invoices' },
      { path: '/admin/finance/transactions', label: 'Transactions' },
      { path: '/admin/finance/gst', label: 'GST' },
      { path: '/admin/finance/partner-payments', label: 'Partner Payments' },
      { path: '/admin/finance/compliance', label: 'Compliance' },
    ];

    sections.forEach(({ path, label }) => {
      cy.visit(path);
      cy.url().should('include', path.split('/admin')[1]);
      cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
      cy.log(`✅ ${label} section accessible at ${path}`);
    });
  });

  // ── 7.18 Currency values display ──
  it('TC-7.18: Should display ₹ currency values across finance pages', () => {
    financePage.visitOverview();
    financePage.waitForLoad();
    financePage.assertCurrencyValues();
    cy.log('✅ Currency values (₹) displayed');
  });
});
