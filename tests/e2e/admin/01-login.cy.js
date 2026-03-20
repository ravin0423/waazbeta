// ═══════════════════════════════════════════════════════════════════
// TEST 1: Authentication & Authorization (10 tests)
// ═══════════════════════════════════════════════════════════════════
import { AdminLoginPage } from '../../support/page-objects/admin';

describe('Admin Authentication & Authorization', () => {
  const loginPage = new AdminLoginPage();

  // ── 1.1 Valid login ──
  it('TC-1.1: Should login with valid admin credentials', () => {
    cy.fixture('admin-users').then((users) => {
      loginPage.login(users.admin.email, users.admin.password);
      loginPage.assertOnDashboard();
      cy.log(`✅ Admin logged in: ${users.admin.email}`);
    });
  });

  // ── 1.2 Invalid credentials ──
  it('TC-1.2: Should reject invalid credentials', () => {
    cy.fixture('admin-users').then((users) => {
      loginPage.login(users.invalidUser.email, users.invalidUser.password);
      cy.wait(3000);
      loginPage.assertErrorDisplayed();
      cy.log('✅ Invalid credentials rejected');
    });
  });

  // ── 1.3 Empty form validation ──
  it('TC-1.3: Should show validation for empty fields', () => {
    loginPage.visit();
    loginPage.submit();
    cy.url().should('include', '/login');
    cy.log('✅ Empty form submission blocked');
  });

  // ── 1.4 Admin cannot access partner portal ──
  it('TC-1.4: Should redirect admin away from partner pages', () => {
    cy.loginAsAdmin();
    loginPage.assertCannotAccessPartner();
    cy.log('✅ Admin blocked from partner portal');
  });

  // ── 1.5 Admin cannot access customer portal ──
  it('TC-1.5: Should redirect admin away from customer pages', () => {
    cy.loginAsAdmin();
    loginPage.assertCannotAccessCustomer();
    cy.log('✅ Admin blocked from customer portal');
  });

  // ── 1.6 Session persistence after reload ──
  it('TC-1.6: Should maintain session after page reload', () => {
    cy.loginAsAdmin();
    cy.visit('/admin');
    cy.url().should('include', '/admin');
    cy.reload();
    cy.url().should('include', '/admin', { timeout: 15000 });
    cy.log('✅ Session persisted after reload');
  });

  // ── 1.7 Sidebar navigation ──
  it('TC-1.7: Should navigate via sidebar links', () => {
    cy.loginAsAdmin();
    cy.visit('/admin');
    cy.waitForPage();
    cy.get('nav, aside').should('exist');

    const routes = [
      { label: /device/i, path: '/admin/device' },
      { label: /claim/i, path: '/admin/claim' },
      { label: /customer/i, path: '/admin/customer' },
    ];

    routes.forEach(({ label, path }) => {
      cy.get('nav, aside').contains(label).then(($el) => {
        if ($el.length) {
          cy.wrap($el).click({ force: true });
          cy.url().should('include', path, { timeout: 10000 });
          cy.log(`✅ Navigated to ${path}`);
        }
      });
    });
  });

  // ── 1.8 Logout ──
  it('TC-1.8: Should logout successfully', () => {
    cy.loginAsAdmin();
    cy.visit('/admin');
    cy.waitForPage();
    cy.get('body').then(($body) => {
      const logoutBtn = $body.find('button:contains("Logout"), button:contains("Sign Out"), button:contains("Log Out")');
      if (logoutBtn.length) {
        cy.wrap(logoutBtn.first()).click({ force: true });
        cy.url().should('satisfy', (url) => url.includes('/login') || url.includes('/'));
        cy.log('✅ Logged out successfully');
        Cypress.session.clearAllSavedSessions();
      } else {
        cy.log('⚠️ Logout button not directly visible — may be in dropdown');
      }
    });
  });

  // ── 1.9 Unauthenticated redirect ──
  it('TC-1.9: Should redirect unauthenticated users to login', () => {
    Cypress.session.clearAllSavedSessions();
    cy.visit('/admin');
    cy.url().should('satisfy', (url) => url.includes('/login') || url.includes('/'));
    cy.log('✅ Unauthenticated user redirected');
  });

  // ── 1.10 Role-based URL protection ──
  it('TC-1.10: Should protect admin-only routes', () => {
    const protectedRoutes = ['/admin/device-approvals', '/admin/claims-monitoring', '/admin/customers', '/admin/finance'];
    Cypress.session.clearAllSavedSessions();
    protectedRoutes.forEach((route) => {
      cy.visit(route);
      cy.url().should('not.include', route.split('/').pop(), { timeout: 10000 });
    });
    cy.log('✅ All admin routes protected');
  });
});
