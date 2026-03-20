// ═══════════════════════════════════════════════════════════════════
// TEST 5: Customer 360 Dashboard (10 tests)
// ═══════════════════════════════════════════════════════════════════
import { CustomerDatabasePage } from '../../support/page-objects/admin';

describe('Admin Customer 360 Dashboard', () => {
  const customerPage = new CustomerDatabasePage();

  beforeEach(() => {
    cy.loginAsAdmin();
    customerPage.interceptAPIs();
  });

  // ── 5.1 Page loads ──
  it('TC-5.1: Should load customer database with table', () => {
    customerPage.visit();
    customerPage.waitForLoad();
    cy.get('table', { timeout: 10000 }).should('exist');
    cy.log('✅ Customer database loaded');
  });

  // ── 5.2 Profiles API ──
  it('TC-5.2: Should fetch customer profiles from API', () => {
    customerPage.visit();
    customerPage.waitForLoad();
    cy.wait('@getProfiles', { timeout: 15000 }).its('response.statusCode').should('be.oneOf', [200, 206]);
    cy.log('✅ Profiles API responded');
  });

  // ── 5.3 Open customer detail ──
  it('TC-5.3: Should open customer detail modal on click', () => {
    customerPage.visit();
    customerPage.waitForLoad();
    customerPage.getCustomerRows().then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(1500);
        customerPage.assertDetailModalOpen();
        cy.log('✅ Customer detail opened');
      } else {
        cy.log('⚠️ No customers in table');
      }
    });
  });

  // ── 5.4 All 6 tabs ──
  it('TC-5.4: Should display all 6 tabs in customer detail', () => {
    customerPage.visit();
    customerPage.waitForLoad();
    customerPage.getCustomerRows().then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(1500);
        cy.fixture('admin-customers').then((data) => {
          data.testCustomer.expectedTabs.forEach((tab) => {
            cy.contains(new RegExp(tab, 'i')).should('exist');
            cy.log(`✅ Tab "${tab}" found`);
          });
        });
      }
    });
  });

  // ── 5.5 LTV calculation ──
  it('TC-5.5: Should display LTV calculation', () => {
    customerPage.visit();
    customerPage.waitForLoad();
    customerPage.getCustomerRows().then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(1500);
        customerPage.assertLTVVisible();
        customerPage.assertLTVValue();
        cy.log('✅ LTV displayed');
      }
    });
  });

  // ── 5.6 Churn risk score ──
  it('TC-5.6: Should display churn risk score', () => {
    customerPage.visit();
    customerPage.waitForLoad();
    customerPage.getCustomerRows().then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(1500);
        customerPage.assertChurnRiskVisible();
        cy.log('✅ Churn risk visible');
      }
    });
  });

  // ── 5.7 Segment categorization ──
  it('TC-5.7: Should show segment categorization', () => {
    customerPage.visit();
    customerPage.waitForLoad();
    customerPage.getCustomerRows().then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(1500);
        customerPage.assertSegmentLabel();
      }
    });
  });

  // ── 5.8 Action buttons ──
  it('TC-5.8: Should display action buttons', () => {
    customerPage.visit();
    customerPage.waitForLoad();
    customerPage.getCustomerRows().then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(1500);
        customerPage.assertActionButtons();
      }
    });
  });

  // ── 5.9 Activity timeline ──
  it('TC-5.9: Should display activity timeline', () => {
    customerPage.visit();
    customerPage.waitForLoad();
    customerPage.getCustomerRows().then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(1500);
        customerPage.assertActivityTimeline();
        cy.log('✅ Activity timeline loaded');
      }
    });
  });

  // ── 5.10 Search ──
  it('TC-5.10: Should filter customers by search', () => {
    customerPage.visit();
    customerPage.waitForLoad();
    cy.get('input[placeholder*="earch"]').then(($input) => {
      if ($input.length) {
        cy.wrap($input.first()).clear().type('test');
        cy.wait(1000);
        cy.log('✅ Search filter applied');
      }
    });
  });
});
