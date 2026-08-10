// cypress/support/e2e.ts

// Import custom commands
import "./commands";

// Prevent Cypress from failing tests when uncaught exceptions occur in the application under test
Cypress.on("uncaught:exception", (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  return false;
});
