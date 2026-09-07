/// <reference types="cypress" />

describe("DEBUG Client Detail 3", () => {
  it("renders single client with ONLY mockAllApi (real seed)", () => {
    const seed = {
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

    cy.mockAllApi(seed);
    cy.visitWithSeed("/clients/1", seed);

    cy.contains("Mock Prospect One").should("be.visible", { timeout: 15000 });
  });

  it("renders single client with ONLY mockAllApi (no seed)", () => {
    cy.mockAllApi();
    cy.visitWithSeed("/clients/1", {});

    cy.contains("Mock Prospect One").should("be.visible", { timeout: 15000 });
  });
});