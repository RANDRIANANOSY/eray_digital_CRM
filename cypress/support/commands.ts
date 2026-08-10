// cypress/support/commands.ts

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to visit a page while seeding localStorage with CRM mock data
       * @example cy.visitWithSeed('/activities', mockData)
       */
      visitWithSeed(url: string, seedData: any): Chainable<AUTWindow>;
    }
  }
}

Cypress.Commands.add("visitWithSeed", (url: string, seedData: any) => {
  return cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.setItem("eray_crm_data", JSON.stringify(seedData));
    },
  });
});
