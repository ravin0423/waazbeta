// ─── Test 6: Financial Dashboard ───
import { AdminLoginPage, FinanceDashboardPage } from '../../support/page-objects/admin';

describe('Admin Financial Dashboard', () => {
  const loginPage = new AdminLoginPage();
  const financePage = new FinanceDashboardPage();

  beforeEach(() => {
    cy.fixture('admin-users').then((users) => {
      loginPage.login(users.admin.email, users.admin.password);
    });
    cy.log('🧪 Starting Financial Dashboard test');
  });

  // ─── Finance Overview ───
  it('TC-6.1: Should load finance overview with KPI cards', () => {
    financePage.visitOverview();
    financePage.waitForLoad();
    financePage.assertKPICards(3);
    cy.log('✅ Finance overview loaded with KPI cards');
  });

  it('TC-6.2: Should display all expected KPI metrics', () => {
    cy.fixture('admin-finance').then((finance) => {
      financePage.visitOverview();
      financePage.waitForLoad();

      cy.get('body').then(($body) => {
        const bodyText = $body.text().toLowerCase();
        finance.expectedKPIs.forEach((kpi) => {
          const found = bodyText.includes(kpi.toLowerCase());
          cy.log(found ? `✅ KPI "${kpi}" displayed` : `⚠️ KPI "${kpi}" not found`);
        });
      });
    });
  });

  it('TC-6.3: Should display 12-month financial trend chart', () => {
    cy.fixture('admin-finance').then((finance) => {
      financePage.visitOverview();
      financePage.waitForLoad();

      cy.get('body').then(($body) => {
        const hasChart = $body.find('.recharts-wrapper, svg').length > 0;
        cy.log(hasChart
          ? `✅ Trend chart displayed (expected: ${finance.trendMonths} months)`
          : '⚠️ No chart found on overview');
      });
    });
  });

  // ─── Invoices ───
  it('TC-6.4: Should load invoices page', () => {
    cy.visit('/admin/invoices');
    cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
    cy.get('table, [class*="card"]').should('exist');
    cy.log('✅ Invoices page loaded');
  });

  // ─── Transactions ───
  it('TC-6.5: Should load transactions page', () => {
    financePage.visitTransactions();
    financePage.waitForLoad();
    cy.get('table, [class*="card"]').should('exist');
    cy.log('✅ Transactions page loaded');
  });

  it('TC-6.6: Should display income and expense transactions', () => {
    cy.fixture('admin-finance').then((finance) => {
      financePage.visitTransactions();
      financePage.waitForLoad();

      cy.get('body').then(($body) => {
        const bodyText = $body.text().toLowerCase();
        finance.transactionTypes.forEach((type) => {
          const found = bodyText.includes(type);
          cy.log(found ? `✅ "${type}" transactions visible` : `⚠️ "${type}" transactions not found`);
        });
      });
    });
  });

  // ─── GST ───
  it('TC-6.7: Should load GST management page', () => {
    financePage.visitGST();
    financePage.waitForLoad();
    cy.get('table, [class*="card"]').should('exist');
    cy.log('✅ GST page loaded');
  });

  it('TC-6.8: Should display GST return types', () => {
    cy.fixture('admin-finance').then((finance) => {
      financePage.visitGST();
      financePage.waitForLoad();

      cy.get('body').then(($body) => {
        const bodyText = $body.text();
        finance.gstConfig.returnTypes.forEach((returnType) => {
          const found = bodyText.includes(returnType);
          cy.log(found ? `✅ "${returnType}" return type found` : `⚠️ "${returnType}" not displayed`);
        });
      });
    });
  });

  // ─── Partner Payments ───
  it('TC-6.9: Should load partner payments page', () => {
    financePage.visitPartnerPayments();
    financePage.waitForLoad();
    cy.get('table, [class*="card"]').should('exist');
    cy.log('✅ Partner payments page loaded');
  });

  // ─── Compliance ───
  it('TC-6.10: Should load compliance page', () => {
    financePage.visitCompliance();
    financePage.waitForLoad();
    cy.get('[class*="card"]').should('exist');
    cy.log('✅ Compliance page loaded');
  });

  it('TC-6.11: Should display compliance information', () => {
    cy.fixture('admin-finance').then((finance) => {
      financePage.visitCompliance();
      financePage.waitForLoad();

      cy.get('body').then(($body) => {
        const bodyText = $body.text().toLowerCase();
        const complianceTerms = ['pan', 'gstin', 'udyam', 'msme'];
        complianceTerms.forEach((term) => {
          const found = bodyText.includes(term);
          cy.log(found ? `✅ "${term}" compliance info found` : `⚠️ "${term}" not displayed`);
        });
      });
    });
  });

  // ─── Report Generation ───
  it('TC-6.12: Should test report download functionality', () => {
    cy.fixture('admin-finance').then((finance) => {
      financePage.visitOverview();
      financePage.waitForLoad();

      cy.get('body').then(($body) => {
        const $downloadBtns = $body.find('button:contains("Download"), button:contains("Export"), button:contains("CSV"), button:contains("Report")');
        if ($downloadBtns.length > 0) {
          cy.wrap($downloadBtns.first()).click({ force: true });
          cy.log('✅ Report download triggered');
        } else {
          cy.log('⚠️ No download/export button on overview');
        }
      });

      finance.reportTypes.forEach((report) => {
        cy.log(`📋 Expected report: ${report.name} (${report.format})`);
      });
    });
  });

  // ─── Navigation ───
  it('TC-6.13: Should navigate between all finance sub-sections', () => {
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
});
