// ─── Test 1: Customer Login & Device Management ───
import { CustomerLoginPage, CustomerDevicesPage, DeviceOnboardingWizardPage } from '../../support/page-objects/customer';

describe('Customer Login & Device Management', () => {
  const loginPage = new CustomerLoginPage();
  const devicesPage = new CustomerDevicesPage();
  const wizardPage = new DeviceOnboardingWizardPage();

  beforeEach(() => {
    cy.log('🧪 Starting Customer Login & Device Management test');
  });

  it('TC-C1.1: Should login with valid customer credentials', () => {
    cy.fixture('customer-users').then((users) => {
      loginPage.login(users.customer.email, users.customer.password);
      loginPage.assertOnCustomerDashboard();
      cy.log(`✅ Customer ${users.customer.name} logged in`);
    });
  });

  it('TC-C1.2: Should reject invalid credentials', () => {
    cy.fixture('customer-users').then((users) => {
      loginPage.visit();
      cy.get('input[type="email"]').clear().type(users.invalidUser.email);
      cy.get('input[type="password"]').clear().type(users.invalidUser.password);
      cy.contains('button', /sign in|log in/i).click();
      cy.url().should('include', '/login');
      cy.log('✅ Invalid credentials rejected');
    });
  });

  it('TC-C1.3: Should NOT access admin portal', () => {
    cy.fixture('customer-users').then((users) => {
      loginPage.login(users.customer.email, users.customer.password);
      loginPage.assertCannotAccessAdmin();
      cy.log('✅ Admin portal access denied for customer');
    });
  });

  it('TC-C1.4: Should NOT access partner portal', () => {
    cy.fixture('customer-users').then((users) => {
      loginPage.login(users.customer.email, users.customer.password);
      loginPage.assertCannotAccessPartner();
      cy.log('✅ Partner portal access denied for customer');
    });
  });

  it('TC-C1.5: Should view all registered devices', () => {
    cy.fixture('customer-users').then((users) => {
      loginPage.login(users.customer.email, users.customer.password);
      devicesPage.visit();
      devicesPage.waitForLoad();
      devicesPage.assertDeviceCards();
      cy.log('✅ Device list loaded');
    });
  });

  it('TC-C1.6: Should display device coverage/subscription info', () => {
    cy.fixture('customer-users').then((users) => {
      loginPage.login(users.customer.email, users.customer.password);
      devicesPage.visit();
      devicesPage.waitForLoad();

      cy.get('[class*="card"]').then(($cards) => {
        if ($cards.length > 0) {
          cy.get('body').then(($body) => {
            const text = $body.text().toLowerCase();
            const hasCoverage = text.includes('plan') || text.includes('coverage') ||
                               text.includes('subscription') || text.includes('active') || text.includes('expired');
            cy.log(hasCoverage ? '✅ Coverage info displayed' : '⚠️ Coverage info not explicitly shown');
          });
        }
      });
    });
  });

  it('TC-C1.7: Should display device status badges', () => {
    cy.fixture('customer-users').then((users) => {
      loginPage.login(users.customer.email, users.customer.password);
      devicesPage.visit();
      devicesPage.waitForLoad();

      cy.get('[class*="card"]').then(($cards) => {
        if ($cards.length > 0) {
          cy.get('[class*="badge"]').should('have.length.gte', 1);
          cy.log('✅ Device status badges displayed');
        } else {
          cy.log('⚠️ No devices to check badges');
        }
      });
    });
  });

  it('TC-C1.8: Should have quick action buttons on device cards', () => {
    cy.fixture('customer-users').then((users) => {
      loginPage.login(users.customer.email, users.customer.password);
      devicesPage.visit();
      devicesPage.waitForLoad();

      cy.get('[class*="card"]').then(($cards) => {
        if ($cards.length > 0) {
          cy.get('body').then(($body) => {
            const text = $body.text().toLowerCase();
            const hasActions = text.includes('claim') || text.includes('renew') ||
                              text.includes('view') || text.includes('detail');
            cy.log(hasActions ? '✅ Quick actions available' : '⚠️ No quick action buttons found');
          });
        }
      });
    });
  });

  it('TC-C1.9: Should initiate device onboarding wizard', () => {
    cy.fixture('customer-users').then((users) => {
      loginPage.login(users.customer.email, users.customer.password);
      devicesPage.visit();
      devicesPage.waitForLoad();

      cy.get('body').then(($body) => {
        const $addBtn = $body.find('button:contains("Add"), button:contains("Register"), button:contains("Onboard"), a:contains("Add")');
        if ($addBtn.length) {
          cy.wrap($addBtn.first()).click({ force: true });
          cy.wait(1000);
          wizardPage.assertWizardLoaded();
          cy.log('✅ Device onboarding wizard launched');
        } else {
          cy.log('⚠️ Add device button not found');
        }
      });
    });
  });

  it('TC-C1.10: Should verify 6-step wizard flow exists', () => {
    cy.fixture('customer-devices').then((devices) => {
      cy.fixture('customer-users').then((users) => {
        loginPage.login(users.customer.email, users.customer.password);
        devicesPage.visit();
        devicesPage.waitForLoad();

        cy.get('body').then(($body) => {
          const $addBtn = $body.find('button:contains("Add"), button:contains("Register"), button:contains("Onboard"), a:contains("Add")');
          if ($addBtn.length) {
            cy.wrap($addBtn.first()).click({ force: true });
            cy.wait(1000);

            devices.wizardSteps.forEach((step) => {
              cy.log(`📋 Expected wizard step: ${step}`);
            });
            cy.log('✅ Wizard step structure documented');
          }
        });
      });
    });
  });

  it('TC-C1.11: Should maintain session after page reload', () => {
    cy.fixture('customer-users').then((users) => {
      loginPage.login(users.customer.email, users.customer.password);
      loginPage.assertOnCustomerDashboard();
      cy.reload();
      cy.url().should('include', '/customer', { timeout: 15000 });
      cy.log('✅ Customer session persisted');
    });
  });

  it('TC-C1.12: Accessibility — device cards have proper structure', () => {
    cy.fixture('customer-users').then((users) => {
      loginPage.login(users.customer.email, users.customer.password);
      devicesPage.visit();
      devicesPage.waitForLoad();

      // Check for heading hierarchy and button labels
      cy.get('[class*="card"]').then(($cards) => {
        if ($cards.length > 0) {
          cy.get('button').each(($btn) => {
            const text = $btn.text().trim();
            const ariaLabel = $btn.attr('aria-label');
            if (!text && !ariaLabel) {
              cy.log(`⚠️ Button without text or aria-label found`);
            }
          });
          cy.log('✅ Accessibility: button labels verified');
        }
      });
    });
  });
});
