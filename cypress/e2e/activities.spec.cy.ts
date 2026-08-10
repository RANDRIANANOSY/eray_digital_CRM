// cypress/e2e/activities.spec.cy.ts

describe("Activities Page with Mocked Data", () => {
  const mockCRMData = {
    clients: [
      {
        id: "mock-client-1",
        name: "Mock Prospect One",
        company: "Alpha Tech",
        role: "CTO",
        email: "alpha@test.com",
        phone: "+261340000001",
        city: "Antananarivo",
        sector: "Tech",
        owner: "Antoine Roy",
        status: "prospect",
        priority: "high",
        tags: ["Test", "Lead"],
        value: 150000,
        lastContact: "10/08/2026",
        initials: "MP",
        color: "indigo",
      },
    ],
    activities: [
      {
        id: "mock-act-1",
        type: "call",
        title: "Appel de Qualification",
        client: "Mock Prospect One",
        owner: "Antoine Roy",
        date: "Aujourd'hui",
        time: "10:30",
        status: "à faire",
        priority: "medium",
        summary: "Discussion about software integration",
      },
      {
        id: "mock-act-2",
        type: "email",
        title: "Envoi Devis Alpha",
        client: "Mock Prospect One",
        owner: "Antoine Roy",
        date: "Hier",
        time: "14:00",
        status: "terminé",
        priority: "high",
        summary: "Sent proposal via mail",
      },
    ],
    deals: [],
    projects: [],
    clientEvents: [],
    members: [],
  };

  beforeEach(() => {
    // Visit the activities page with our mock data seeded in localStorage
    cy.visitWithSeed("/activities", mockCRMData);
  });

  it("should display the activities list from mock data", () => {
    cy.get("h1").should("contain.text", "Activités");
    cy.contains("Appel de Qualification").should("be.visible");
    cy.contains("Envoi Devis Alpha").should("be.visible");
  });

  it("should filter activities by clicking type buttons", () => {
    // Click 'Appel' filter button
    cy.contains("button", "Appel").click();
    
    // The "Appel de Qualification" should be visible, but "Envoi Devis Alpha" should NOT be visible
    cy.contains("Appel de Qualification").should("be.visible");
    cy.contains("Envoi Devis Alpha").should("not.exist");

    // Click 'Email' filter button
    cy.contains("button", "Email").click();
    
    // "Envoi Devis Alpha" should be visible, but "Appel de Qualification" should NOT be visible
    cy.contains("Envoi Devis Alpha").should("be.visible");
    cy.contains("Appel de Qualification").should("not.exist");
  });

  it("should filter activities by search text query", () => {
    // Type a keyword that matches only one activity
    cy.get('input[placeholder*="Rechercher live"]').type("Devis");

    // Wait for the 300ms debounce
    cy.wait(400);

    // "Envoi Devis Alpha" should be visible, "Appel de Qualification" should NOT be visible
    cy.contains("Envoi Devis Alpha").should("be.visible");
    cy.contains("Appel de Qualification").should("not.exist");
  });

  it("should allow creating a new activity and verify it is prepended to the timeline", () => {
    // Click the 'Nouvelle activité' button to open the creation dialog
    cy.contains("button", "Nouvelle activité").click();

    // The Dialog should be open
    cy.contains("Créer une activité").should("be.visible");

    // Select activity type: RDV (rendered as meeting type in code)
    cy.contains("button", "RDV").click();

    // Fill in the form fields
    cy.get('input[name="title"]').type("RDV Démo Client");
    cy.get('input[name="client"]').clear().type("Mock Prospect One");
    cy.get('input[name="owner"]').clear().type("Léa Martin");
    cy.get('input[name="time"]').type("16:30");
    cy.get('textarea[name="notes"]').type("Ceci est une démo de test automatisée.");

    // Submit the form
    cy.contains("button", "Créer").click();

    // The dialog should close and the success toast should appear
    cy.contains("Activité et opportunité créées").should("be.visible");

    // Verify the new activity is added to the UI list
    cy.contains("RDV Démo Client").should("be.visible");
    cy.contains("Mock Prospect One • 16:30").should("be.visible");
  });
});
