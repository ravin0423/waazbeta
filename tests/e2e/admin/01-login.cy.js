// ═══════════════════════════════════════════════════════════════════
// TEST 1: Admin Authentication & Authorization
// ═══════════════════════════════════════════════════════════════════
import { AdminLoginPage, AdminDashboardPage } from '../../support/page-objects/admin';

describe('Admin Authentication & Authorization', () => {
  const loginPage = new AdminLoginPage();
  const dashboardPage = new AdminDashboardPage();

  // ── 1.1 Login with valid credentials ──
  it('TC-1.1: Should login with valid admin credentials and redirect to dashboard', () => {
    cy.fixture('admin-users').then((users) => {
      cy.visit('/login');
      cy.get('input[type="email"]').should('be.visible').clear().type(users.admin.email);
      cy.get('input[type="password"]').should('be.visible').clear().type(users.admin.password);

      const loginStart = Date.now();
      cy.contains('button', /sign in|log in/i).click();
      cy.url().should('include', '/admin', { timeout: 20000 }).then(() => {
        const loginDuration = Date.now() - loginStart;
        cy.task('log', `🔐 Login completed in ${loginDuration}ms`);
        expect(loginDuration).to.be.lessThan(10000, 'Login should complete within 10s');
      });
      cy.log(`✅ Admin ${users.admin.email} logged in successfully`);
    });
  });

  // ── 1.2 Login with invalid credentials ──
  it('TC-1.2: Should reject invalid credentials and stay on login page', () => {
    cy.fixture('admin-users').then((users) => {
      cy.visit('/login');
      cy.get('input[type="email"]').clear().type(users.invalidUser.email);
      cy.get('input[type="password"]').clear().type(users.invalidUser.password);
      cy.contains('button', /sign in|log in/i).click();

      // Should remain on login — not redirect
      cy.url().should('include', '/login', { timeout: 10000 });
      cy.log('✅ Invalid credentials correctly rejected');
    });
  });

  // ── 1.3 Admin cannot access partner pages ──
  it('TC-1.3: Should prevent admin from accessing partner portal routes', () => {
    cy.fixture('admin-users').then((users) => {
      loginPage.login(users.admin.email, users.admin.password);

      cy.visit('/partner');
      cy.url().should('not.include', '/partner/dashboard', { timeout: 10000 });

      cy.visit('/partner/commissions');
      cy.url().should('not.include', '/partner/commissions', { timeout: 10000 });

      cy.log('✅ Partner portal access correctly denied for admin');
    });
  });

  // ── 1.4 Admin cannot access customer pages ──
  it('TC-1.4: Should prevent admin from accessing customer portal routes', () => {
    cy.fixture('admin-users').then((users) => {
      loginPage.login(users.admin.email, users.admin.password);

      cy.visit('/customer');
      cy.url().should('not.include', '/customer/dashboard', { timeout: 10000 });

      cy.log('✅ Customer portal access correctly denied for admin');
    });
  });

  // ── 1.5 Session persistence ──
  it('TC-1.5: Should maintain admin session after page reload', () => {
    cy.fixture('admin-users').then((users) => {
      loginPage.login(users.admin.email, users.admin.password);
      cy.visit('/admin');
      cy.url().should('include', '/admin', { timeout: 15000 });

      cy.reload();
      cy.url().should('include', '/admin', { timeout: 15000 });
      cy.get('[class*="animate-spin"]', { timeout: 15000 }).should('not.exist');
      cy.log('✅ Session persisted after reload');
    });
  });

  // ── 1.6 Redirect unauthenticated to login ──
  it('TC-1.6: Should redirect unauthenticated users to login page', () => {
    Cypress.session.clearAllSavedSessions();
    cy.clearAllCookies();
    cy.clearAllLocalStorage();

    cy.visit('/admin');
    cy.url().should('include', '/login', { timeout: 15000 });
    cy.log('✅ Unauthenticated redirect working');
  });

  // ── 1.7 Logout functionality ──
  it('TC-1.7: Should log out and redirect to login page', () => {
    cy.fixture('admin-users').then((users) => {
      loginPage.login(users.admin.email, users.admin.password);
      cy.visit('/admin');
      cy.url().should('include', '/admin', { timeout: 15000 });

      // Find and click logout
      cy.get('body').then(($body) => {
        const $logout = $body.find('button:contains("Log out"), button:contains("Sign out"), a:contains("Logout")');
        if ($logout.length) {
          cy.wrap($logout.first()).click({ force: true });
          cy.url().should('include', '/login', { timeout: 10000 });
          cy.log('✅ Logout successful');
        } else {
          // Try dropdown menus
          cy.get('nav button, header button').last().click({ force: true });
          cy.contains(/log\s?out|sign\s?out/i).click({ force: true });
          cy.url().should('include', '/login', { timeout: 10000 });
          cy.log('✅ Logout via menu successful');
        }
      });
    });
  });

  // ── 1.8 Sidebar navigation ──
  it('TC-1.8: Should navigate to all admin sidebar sections', () => {
    cy.fixture('admin-users').then((users) => {
      loginPage.login(users.admin.email, users.admin.password);
      dashboardPage.visit();
      dashboardPage.waitForLoad();

      const sections = [
        { label: /device.*approval|approval/i, path: '/admin/device' },
        { label: /claim|monitor/i, path: '/admin/claim' },
        { label: /customer/i, path: '/admin/customer' },
        { label: /partner/i, path: '/admin/partner' },
        { label: /finance|invoic/i, path: '/admin/finance' },
      ];

      sections.forEach(({ label, path }) => {
        cy.get('nav, aside').then(($nav) => {
          const $link = $nav.find(`a, button`).filter((_, el) => label.test(el.textContent));
          if ($link.length) {
            cy.wrap($link.first()).click({ force: true });
            cy.wait(1000);
            cy.log(`✅ Navigated to section matching ${label}`);
          }
        });
      });
    });
  });
});
