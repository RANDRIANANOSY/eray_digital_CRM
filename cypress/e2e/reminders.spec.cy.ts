/// <reference types="cypress" />

describe("Reminders Page", () => {
  beforeEach(() => {
    cy.mockAllApi();
    cy.visitWithSeed("/reminders", {});
  });

  it("should render reminders page with pending activities and deal follow-ups", () => {
    cy.contains("h1", "Centre de rappels").should("be.visible");
    cy.contains("Tâches & Appels").should("be.visible");
    cy.contains("Actions Opportunités").should("be.visible");
  });

  it("should mark an activity as completed from reminders list", () => {
    cy.contains("Appel de Qualification").should("be.visible");
    cy.contains("Appel de Qualification")
      .closest(".card-elegant")
      .find("button")
      .click();
    cy.contains("Tâche terminée !").should("exist");
  });
});
