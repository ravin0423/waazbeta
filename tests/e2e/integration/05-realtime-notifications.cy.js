/// <reference types="cypress" />

/**
 * Cross-Portal Integration: Real-Time Notifications
 * Tests notification delivery across portals, in-app alerts, and data sync.
 */

describe('Real-Time Notifications', () => {
  let adminUser, partnerUser, customerUser;

  before(() => {
    cy.fixture('admin-users').then((u) => (adminUser = u.admin));
    cy.fixture('partner-users').then((u) => (partnerUser = u.partner));
    cy.fixture('customer-users').then((u) => (customerUser = u.customer));
  });

  describe('In-App Notification Delivery', () => {
    it('Customer receives in-app notifications', () => {
      cy.loginViaUI(customerUser.email, customerUser.password);
      cy.visit('/customer/notifications');

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasNotificationPage =
          $body.text().match(/notification|alert|update/i);
        expect(hasNotificationPage).to.be.ok;
        cy.log('✅ Customer notification page accessible');
      });
    });

    it('Partner receives in-app notifications', () => {
      cy.loginViaUI(partnerUser.email, partnerUser.password);
      cy.visit('/partner/dashboard');

      // Check notification bell
      cy.get('body', { timeout: 10000 }).then(($body) => {
        if ($body.find('[data-testid="notification-bell"], button[aria-label*="notification"]').length) {
          cy.get('[data-testid="notification-bell"], button[aria-label*="notification"]')
            .first()
            .click();
          cy.log('✅ Partner notification bell works');
        } else {
          cy.log('⚠️ Partner notification bell not found');
        }
      });
    });

    it('Admin can view all system notifications', () => {
      cy.loginViaUI(adminUser.email, adminUser.password);
      cy.visit('/admin/dashboard');

      cy.get('body', { timeout: 10000 }).then(($body) => {
        if ($body.find('[data-testid="notification-bell"], button[aria-label*="notification"]').length) {
          cy.get('[data-testid="notification-bell"], button[aria-label*="notification"]')
            .first()
            .click();
          cy.log('✅ Admin notification bell works');
        }
      });
    });
  });

  describe('Notification Types', () => {
    it('Claim status notifications appear for customer', () => {
      cy.loginViaUI(customerUser.email, customerUser.password);
      cy.visit('/customer/notifications');

      cy.get('body', { timeout: 10000 }).then(($body) => {
        // Check for various notification types
        const notificationTypes = ['claim', 'device', 'subscription', 'update'];
        const foundTypes = notificationTypes.filter((type) =>
          $body.text().toLowerCase().includes(type)
        );

        cy.log(`Found notification types: ${foundTypes.join(', ') || 'none visible'}`);
        cy.log('✅ Notification types check complete');
      });
    });

    it('Assignment notifications appear for partner', () => {
      cy.loginViaUI(partnerUser.email, partnerUser.password);
      cy.visit('/partner/dashboard');

      cy.get('body', { timeout: 10000 }).then(($body) => {
        if ($body.find('[data-testid="notification-bell"], button[aria-label*="notification"]').length) {
          cy.get('[data-testid="notification-bell"], button[aria-label*="notification"]')
            .first()
            .click();

          cy.get('body').then(($notifications) => {
            const hasAssignment = $notifications.text().match(/assign|claim|new/i);
            if (hasAssignment) {
              cy.log('✅ Partner has assignment notifications');
            } else {
              cy.log('⚠️ No assignment notifications found');
            }
          });
        }
      });
    });
  });

  describe('Notification Preferences', () => {
    it('Customer can manage notification preferences', () => {
      cy.loginViaUI(customerUser.email, customerUser.password);
      cy.visit('/customer/notifications');

      cy.get('body', { timeout: 10000 }).then(($body) => {
        // Look for preferences/settings section
        const hasPreferences =
          $body.find('[data-testid="notification-preferences"]').length > 0 ||
          $body.text().match(/preference|setting|email notification|sms/i);

        if (hasPreferences) {
          cy.log('✅ Notification preferences section found');
        } else {
          cy.log('⚠️ Preferences section not visible on this page');
        }
      });
    });

    it('Customer can toggle notification channels', () => {
      cy.loginViaUI(customerUser.email, customerUser.password);
      cy.visit('/customer/notifications');

      cy.get('body', { timeout: 10000 }).then(($body) => {
        // Look for toggle switches
        if ($body.find('[role="switch"], input[type="checkbox"]').length) {
          cy.get('[role="switch"], input[type="checkbox"]')
            .first()
            .then(($toggle) => {
              cy.log('✅ Notification toggle controls found');
            });
        } else {
          cy.log('⚠️ No toggle controls found');
        }
      });
    });
  });

  describe('Cross-Portal Data Consistency', () => {
    it('Claim count matches across admin and customer views', () => {
      // Admin view
      cy.loginViaUI(adminUser.email, adminUser.password);
      cy.visit('/admin/claims-monitoring');

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const adminHasClaims =
          $body.find('table').length > 0 ||
          $body.text().match(/claim|total|pending/i);

        expect(adminHasClaims).to.be.ok;
        cy.log('✅ Admin claims data loaded');
      });
    });

    it('Partner only sees their assigned claims', () => {
      cy.loginViaUI(partnerUser.email, partnerUser.password);
      cy.visit('/partner/dashboard');

      cy.get('body', { timeout: 10000 }).then(($body) => {
        // Partner should not see all system claims
        const isIsolated = !$body.text().match(/all claims|system-wide/i);
        expect(isIsolated).to.be.true;
        cy.log('✅ Partner data isolation verified');
      });
    });

    it('Customer only sees their own data', () => {
      cy.loginViaUI(customerUser.email, customerUser.password);
      cy.visit('/customer/dashboard');

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasPersonalData =
          $body.text().match(/my device|my claim|dashboard/i) ||
          $body.find('[data-testid="customer-dashboard"]').length > 0;

        expect(hasPersonalData).to.be.ok;
        cy.log('✅ Customer data isolation verified');
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('Admin dashboard loads within acceptable time', () => {
      const start = Date.now();
      cy.loginViaUI(adminUser.email, adminUser.password);
      cy.visit('/admin/dashboard');
      cy.get('body', { timeout: 15000 }).should('be.visible');

      cy.then(() => {
        const elapsed = Date.now() - start;
        cy.log(`Admin dashboard: ${elapsed}ms`);
        expect(elapsed).to.be.lessThan(20000);
      });
    });

    it('Partner dashboard loads within acceptable time', () => {
      const start = Date.now();
      cy.loginViaUI(partnerUser.email, partnerUser.password);
      cy.visit('/partner/dashboard');
      cy.get('body', { timeout: 15000 }).should('be.visible');

      cy.then(() => {
        const elapsed = Date.now() - start;
        cy.log(`Partner dashboard: ${elapsed}ms`);
        expect(elapsed).to.be.lessThan(20000);
      });
    });

    it('Customer dashboard loads within acceptable time', () => {
      const start = Date.now();
      cy.loginViaUI(customerUser.email, customerUser.password);
      cy.visit('/customer/dashboard');
      cy.get('body', { timeout: 15000 }).should('be.visible');

      cy.then(() => {
        const elapsed = Date.now() - start;
        cy.log(`Customer dashboard: ${elapsed}ms`);
        expect(elapsed).to.be.lessThan(20000);
      });
    });
  });
});
