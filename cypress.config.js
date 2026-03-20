const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    specPattern: 'tests/e2e/**/*.cy.{js,ts}',
    supportFile: 'tests/support/e2e.js',
    fixturesFolder: 'tests/fixtures',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'tests/screenshots',
    videosFolder: 'tests/videos',
    retries: {
      runMode: 1,
      openMode: 0,
    },
    env: {
      SUPABASE_URL: 'https://dkjbjmfeyjmrgxjvangj.supabase.co',
    },
    setupNodeEvents(on, config) {
      // Node event listeners here
    },
  },
});
