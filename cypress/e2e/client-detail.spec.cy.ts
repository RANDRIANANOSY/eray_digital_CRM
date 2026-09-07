/// <reference types="cypress" />

describe("Client Detail Page", () => {
  const mockCRMData = {
    clients: [
      {
        id: 1,
        name: "Mock Prospect One",
        company: "Alpha Tech",
        role: "CTO",
        email: "alpha@test.com",
        phone: "+261340000001",
        city: "Antananarivo",
        sector: "Tech",
        ownerId: 1,
        ownerName: "Antoine Roy",
        status: "prospect",
        priority: "high",
        tags: ["Test", "Lead"],
        value: 150000,
        lastContactAt: "2026-08-10",
        initials: "MP",
        createdAt: "2026-01-15T10:00:00Z",
        updatedAt: "2026-08-10T10:00:00Z",
      },
    ],
  };

  beforeEach(() => {
    cy.mockAllApi(mockCRMData);
    cy.visitWithSeed("/clients/1", mockCRMData);
  });

  it("should render client details overview", () => {
    cy.contains("Mock Prospect One").should("be.visible");
    cy.contains("Alpha Tech").should("be.visible");
    cy.contains("CTO").should("be.visible");
    cy.contains("alpha@test.com").should("be.visible");
  });

  it("should switch between detail tabs (Activités, Pipelines, Projets)", () => {
    // Switch to Activités tab
    cy.contains("button", "Activités").click();
    cy.contains("Appel de Qualification").should("be.visible");

    // Switch to Pipeline tab
    cy.contains("button", "Pipeline").click();

    // Switch to Projets tab
    cy.contains("button", "Projets").click();

    // Switch back to Timeline tab
    cy.contains("button", "Timeline").click();
    cy.contains("Prochaines actions").should("be.visible");
  });

  it("should allow navigating back to clients list", () => {
    cy.contains("a", "Clients").click();
    cy.url().should("include", "/clients");
  });
});
