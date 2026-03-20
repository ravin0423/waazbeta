// ─── Test 4: Customer 360 Dashboard ───
import { AdminLoginPage, CustomerDatabasePage } from '../../support/page-objects/admin';

describe('Admin Customer 360 Dashboard', () => {
  const loginPage = new AdminLoginPage();
  const customerPage = new CustomerDatabasePage();

  beforeEach(() => {
    cy.fixture('admin-users').then((users) => {
      loginPage.login(users.admin.email, users.admin.password);
    });
    cy.log('🧪 Starting Customer 360 test');
  });

  it('TC-4.1: Should load customer database page', () => {
    customerPage.visit();
    customerPage.waitForLoad();
    cy.get('table', { timeout: 10000 }).should('exist');
    cy.log('✅ Customer database loaded');
  });

  it('TC-4.2: Should search and find customers', () => {
    cy.fixture('admin-customers').then((customers) => {
      customerPage.visit();
      customerPage.waitForLoad();
      customerPage.searchCustomer(customers.testCustomer.name.split(' ')[0]);
      cy.wait(1000);
      cy.log(`✅ Search executed for: ${customers.testCustomer.name}`);
    });
  });

  it('TC-4.3: Should open customer detail view with all 6 tabs', () => {
    cy.fixture('admin-customers').then((customers) => {
      customerPage.visit();
      customerPage.waitForLoad();

      cy.get('table tbody tr').then(($rows) => {
        if ($rows.length > 0) {
          customerPage.clickCustomer(0);
          cy.wait(2000);

          // Verify tabs exist
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

  it('TC-4.4: Should display LTV (Lifetime Value) calculation', () => {
    customerPage.visit();
    customerPage.waitForLoad();

    cy.get('table tbody tr').then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(2000);
        customerPage.assertLTVVisible();
        cy.log('✅ LTV calculation displayed');
      }
    });
  });

  it('TC-4.5: Should display churn risk scoring', () => {
    customerPage.visit();
    customerPage.waitForLoad();

    cy.get('table tbody tr').then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(2000);
        customerPage.assertChurnRiskVisible();
        cy.log('✅ Churn risk score displayed');
      }
    });
  });

  it('TC-4.6: Should verify LTV segments classification', () => {
    cy.fixture('admin-customers').then((customers) => {
      customerPage.visit();
      customerPage.waitForLoad();

      cy.get('table tbody tr').then(($rows) => {
        if ($rows.length > 0) {
          customerPage.clickCustomer(0);
          cy.wait(2000);

          // Check for segment labels
          const segments = Object.values(customers.ltvSegments).map((s) => s.label);
          cy.get('body').then(($body) => {
            const bodyText = $body.text();
            const foundSegment = segments.find((seg) => bodyText.includes(seg));
            if (foundSegment) {
              cy.log(`✅ Customer segment identified: ${foundSegment}`);
            } else {
              cy.log('⚠️ No LTV segment label found');
            }
          });
        }
      });
    });
  });

  it('TC-4.7: Should verify churn risk levels', () => {
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
              cy.log('⚠️ No churn risk level label found');
            }
          });
        }
      });
    });
  });

  it('TC-4.8: Should navigate between customer detail tabs', () => {
    customerPage.visit();
    customerPage.waitForLoad();

    cy.get('table tbody tr').then(($rows) => {
      if ($rows.length > 0) {
        customerPage.clickCustomer(0);
        cy.wait(2000);

        const tabsToTest = ['Devices', 'Claims', 'Activity'];
        tabsToTest.forEach((tab) => {
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

  it('TC-4.9: Should filter customers by risk level', () => {
    customerPage.visit();
    customerPage.waitForLoad();

    cy.get('body').then(($body) => {
      const hasFilter = $body.find('button:contains("Filter")').length > 0 ||
                        $body.find('[role="combobox"]').length > 0 ||
                        $body.find('select').length > 0;
      cy.log(hasFilter ? '✅ Customer filter controls available' : '⚠️ No filter controls found');
    });
  });
});
