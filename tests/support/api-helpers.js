// ─── API Testing Helpers ───

const SUPABASE_URL = Cypress.env('SUPABASE_URL');
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRramJqbWZleWptcmd4anZhbmdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjU5MjQsImV4cCI6MjA4ODkwMTkyNH0.Ja7FmLbaLoO47Gh0zgkNA7aGqaDq1LTQ_MKfWekyeKg';

/** Make authenticated API request to Supabase REST */
Cypress.Commands.add('apiRequest', (method, table, options = {}) => {
  const { body, query, token } = options;
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ''}`;

  return cy.request({
    method,
    url,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token || ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : undefined,
    },
    body,
    failOnStatusCode: false,
  });
});

/** Intercept and alias Supabase API calls for assertions */
Cypress.Commands.add('interceptSupabase', (table, alias) => {
  cy.intercept('GET', `**/rest/v1/${table}*`).as(alias || `get${table}`);
  cy.intercept('POST', `**/rest/v1/${table}*`).as(alias ? `${alias}Post` : `post${table}`);
  cy.intercept('PATCH', `**/rest/v1/${table}*`).as(alias ? `${alias}Patch` : `patch${table}`);
});

/** Assert API response time within threshold */
Cypress.Commands.add('assertResponseTime', (alias, maxMs) => {
  cy.wait(`@${alias}`).then((interception) => {
    const duration = interception.response?.duration || 0;
    expect(duration).to.be.lessThan(maxMs, `API response should be under ${maxMs}ms`);
  });
});

/** Intercept all Supabase REST calls for performance monitoring */
Cypress.Commands.add('monitorAPICalls', () => {
  cy.intercept('**/rest/v1/**').as('supabaseAPI');
});
