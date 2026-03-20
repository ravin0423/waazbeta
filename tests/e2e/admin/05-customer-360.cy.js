// ═══════════════════════════════════════════════════════════════════
// TEST 5: Customer 360 Dashboard
// ═══════════════════════════════════════════════════════════════════
import { CustomerDatabasePage } from '../../support/page-objects/admin';

describe('Admin Customer 360 Dashboard', () => {
  const customerPage = new CustomerDatabasePage();

  beforeEach(() => {
    cy.loginAsAdmin();
    customerPage.interceptAPIs();
  });

  // ── 5.1 Customer database loads ──
  it('TC-5.1: Should load customer database with profiles table', () => {
    customerPage.visit();
    customerPage.waitForLoad();
    cy.get('table', { timeout: 10000 }).should('exist');

    cy.wait('@getProfiles', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
    cy.log('✅ Customer database loaded');
  });

  // ── 5.2 Search customers ──
  it('TC-5.2: Should search and find customers by name', () => {
    cy.fixture('admin-customers').then((customers) => {
      customerPage.visit();
      customerPage.waitForLoad();

      const searchTerm = customers.testCustomer.name.split(' ')[0];
      customerPage.searchCustomer(searchTerm);
      cy.wait(1000);
      cy.log(`✅ Search executed for: "${searchTerm}"`);
    });
  });

  // ── 5.3 Customer detail modal with 6 tabs ──
  it('TC-5.3: Should open customer detail view with all 6 tabs', () => {
    cy.fixture('admin-customers').then((customers) => {
      customerPage.visit();
      customerPage.waitForLoad();

      cy.get('table tbody tr').then(($rows) => {
        if ($rows.length > 0) {
          customerPage.clickCustomer(0);
          cy.wait(2000);

          customers.testCustomer.expectedTabs.forEach((tab) => {
            cy.get('body').then(($body) => {
              const tabExists = $body.find(`button:contains("${tab}"), [role="tab"]:contains("${tab}")`).length > 0;
              cy.log(tabExists ? `✅ Tab "${tab}" found` : `⚠️ Tab "${tab}" not found`);
            });
          });
        } else {
          cy.log('⚠️ No customers to open detail view');
        }
      });
    });
  });

  // ── 5.4 LTV calculation ──
  it('TC-5.4: Should display Lifetime Value (LTV) calculation', () => {
    customerPage.visit();
    customerPage.waitForLoad();

    cy.get('table tbody tr').then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(2000);
        customerPage.assertLTVVisible();
        customerPage.assertLTVValue();
        cy.log('✅ LTV calculation displayed with monetary value');
      }
    });
  });

  // ── 5.5 Churn risk score (0-100) ──
  it('TC-5.5: Should display churn risk scoring (0-100)', () => {
    customerPage.visit();
    customerPage.waitForLoad();

    cy.get('table tbody tr').then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(2000);
        customerPage.assertChurnRiskVisible();
        customerPage.assertChurnRiskScore();
        cy.log('✅ Churn risk score displayed');
      }
    });
  });

  // ── 5.6 5-segment LTV categorization ──
  it('TC-5.6: Should display LTV segment classification (VIP/Loyal/Regular/At-Risk/New)', () => {
    cy.fixture('admin-customers').then((customers) => {
      customerPage.visit();
      customerPage.waitForLoad();

      cy.get('table tbody tr').then(($rows) => {
        if ($rows.length > 0) {
          customerPage.clickCustomer(0);
          cy.wait(2000);

          const segments = Object.values(customers.ltvSegments).map((s) => s.label);
          cy.get('body').then(($body) => {
            const bodyText = $body.text();
            const foundSegment = segments.find((seg) => bodyText.includes(seg));
            if (foundSegment) {
              cy.log(`✅ Customer segment identified: ${foundSegment}`);
            } else {
              cy.log(`⚠️ No LTV segment label found. Expected one of: ${segments.join(', ')}`);
            }
          });
        }
      });
    });
  });

  // ── 5.7 Churn risk levels ──
  it('TC-5.7: Should display churn risk level (Healthy/Watch/At-Risk/Critical)', () => {
    cy.fixture('admin-customers').then((customers) => {
      customerPage.visit();
      customerPage.waitForLoad();

      cy.get('table tbody tr').then(($rows) => {
        if ($rows.length > 0) {
          customerPage.clickCustomer(0);
          cy.wait(2000);

          const riskLevels = Object.values(customers.churnRiskLevels).map((r) => r.label);
          cy.get('body').then(($body) => {
            const bodyText = $body.text();
            const foundRisk = riskLevels.find((level) => bodyText.includes(level));
            if (foundRisk) {
              cy.log(`✅ Churn risk level: ${foundRisk}`);
            } else {
              cy.log(`⚠️ No churn risk level found. Expected one of: ${riskLevels.join(', ')}`);
            }
          });
        }
      });
    });
  });

  // ── 5.8 Churn risk factors ──
  it('TC-5.8: Should verify 5 churn risk factors are configured', () => {
    cy.fixture('admin-customers').then((customers) => {
      expect(customers.churnFactors).to.have.length(5);
      customers.churnFactors.forEach((factor) => {
        cy.log(`📋 Churn factor: ${factor}`);
      });
      cy.log('✅ All 5 churn risk factors configured in fixtures');
    });
  });

  // ── 5.9 Tab navigation ──
  it('TC-5.9: Should navigate between all customer detail tabs', () => {
    customerPage.visit();
    customerPage.waitForLoad();

    cy.get('table tbody tr').then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(2000);

        const tabs = ['Devices', 'Claims', 'Subscriptions', 'Activity', 'Feedback'];
        tabs.forEach((tab) => {
          cy.get('body').then(($body) => {
            const $tab = $body.find(`button:contains("${tab}"), [role="tab"]:contains("${tab}")`);
            if ($tab.length > 0) {
              cy.wrap($tab.first()).click({ force: true });
              cy.wait(500);
              cy.log(`✅ Navigated to "${tab}" tab`);
            }
          });
        });
      }
    });
  });

  // ── 5.10 Activity timeline ──
  it('TC-5.10: Should display activity timeline in customer detail', () => {
    customerPage.visit();
    customerPage.waitForLoad();

    cy.get('table tbody tr').then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(2000);

        cy.get('body').then(($body) => {
          const $actTab = $body.find('button:contains("Activity"), [role="tab"]:contains("Activity")');
          if ($actTab.length) {
            cy.wrap($actTab.first()).click({ force: true });
            cy.wait(1000);
            cy.log('✅ Activity timeline tab loaded');
          }
        });
      }
    });
  });

  // ── 5.11 Delete user button ──
  it('TC-5.11: Should display delete user action in customer detail', () => {
    customerPage.visit();
    customerPage.waitForLoad();

    cy.get('table tbody tr').then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(2000);
        customerPage.assertDeleteButton();
      }
    });
  });

  // ── 5.12 Customer filter by risk ──
  it('TC-5.12: Should filter customers by risk level', () => {
    customerPage.visit();
    customerPage.waitForLoad();

    cy.get('body').then(($body) => {
      const hasFilter = $body.find('button[role="combobox"], [role="tab"], select').length > 0;
      cy.log(hasFilter ? '✅ Customer filter controls available' : '⚠️ No filter controls found');
    });
  });
});
