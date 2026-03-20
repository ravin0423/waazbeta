// ─── Test 1: Admin Login ───
import { AdminLoginPage, AdminDashboardPage } from '../../support/page-objects/admin';

describe('Admin Login & Dashboard Access', () => {
  const loginPage = new AdminLoginPage();
  const dashboardPage = new AdminDashboardPage();

  beforeEach(() => {
    cy.log('🧪 Starting Admin Login test');
  });

  it('TC-1.1: Should navigate to admin login page', () => {
    loginPage.visit();
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.contains('button', /sign in|log in/i).should('be.visible');
    cy.log('✅ Login page loaded with all form fields');
  });

  it('TC-1.2: Should login with valid admin credentials', () => {
    cy.fixture('admin-users').then((users) => {
      loginPage.login(users.admin.email, users.admin.password);
      loginPage.assertOnDashboard();
      cy.log(`✅ Admin ${users.admin.email} logged in successfully`);
    });
  });

  it('TC-1.3: Should reject invalid credentials', () => {
    cy.fixture('admin-users').then((users) => {
      loginPage.visit();
      loginPage.fillEmail(users.invalidUser.email);
      loginPage.fillPassword(users.invalidUser.password);
      loginPage.submit();
      loginPage.assertErrorDisplayed();
      cy.log('✅ Invalid credentials correctly rejected');
    });
  });

  it('TC-1.4: Should display dashboard with KPI metrics after login', () => {
    cy.fixture('admin-users').then((users) => {
      loginPage.login(users.admin.email, users.admin.password);
      dashboardPage.assertKPICardsVisible();
      dashboardPage.assertMetricsLoaded();
      cy.log('✅ Dashboard loaded with all KPI metrics');
    });
  });

  it('TC-1.5: Should redirect unauthenticated users to login', () => {
    cy.visit('/admin');
    cy.url().should('include', '/login', { timeout: 10000 });
    cy.log('✅ Unauthenticated redirect working');
  });

  it('TC-1.6: Should maintain session after page reload', () => {
    cy.fixture('admin-users').then((users) => {
      loginPage.login(users.admin.email, users.admin.password);
      loginPage.assertOnDashboard();
      cy.reload();
      cy.url().should('include', '/admin', { timeout: 15000 });
      cy.log('✅ Session persisted after reload');
    });
  });
});
