/// <reference types="cypress" />

describe("Notifications Page", () => {
  beforeEach(() => {
    cy.mockAllApi();

    cy.intercept("GET", "/api/notifications*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            {
              id: 1,
              userId: 1,
              type: "activity_assigned",
              title: "Nouvelle activité assignée",
              message: "Vous avez été assigné à l'appel de qualification pour Alpha Tech.",
              read: false,
              link: "/activities",
              createdAt: "2026-08-10T10:00:00Z",
            },
            {
              id: 2,
              userId: 1,
              type: "opportunity_won",
              title: "Opportunité gagnée !",
              message: "Le contrat Beta Services de 8 000 000 Ar a été validé.",
              read: true,
              link: "/pipeline",
              createdAt: "2026-08-09T14:00:00Z",
            },
          ],
          meta: { page: 1, perPage: 20, total: 2, totalPages: 1 },
        },
      },
    }).as("getNotifications");

    cy.visitWithSeed("/notifications", {});
  });

  it("should render notifications list and allow marking all as read", () => {
    cy.contains("Notifications").should("be.visible");
    cy.contains("Nouvelle activité assignée").should("be.visible");
    cy.contains("Opportunité gagnée !").should("be.visible");

    cy.contains("button", "Tout marquer lu").click();
    cy.contains("Toutes les notifications ont été marquées comme lues").should("exist");
  });
});
