/// <reference types="cypress" />

describe("Projects Page", () => {
  const mockCRMData = {
    projects: [
      {
        id: 1,
        name: "Refonte Site Web Eray",
        clientId: 1,
        clientName: "Alpha Tech",
        status: "En cours",
        priority: "high",
        startDate: "2026-06-01",
        endDate: "2026-09-01",
        budget: 5000000,
        description: "Migration globale vers React & Symfony",
        progress: 65,
        teamMembers: [{ id: 1, name: "Adem Eray" }],
        taskCount: 3,
        createdAt: "2026-06-01T10:00:00Z",
        updatedAt: "2026-08-01T10:00:00Z",
      },
      {
        id: 2,
        name: "Audit Sécurité ERP",
        clientId: 2,
        clientName: "Beta Services",
        status: "Terminé",
        priority: "medium",
        startDate: "2026-05-01",
        endDate: "2026-06-15",
        budget: 2500000,
        description: "Tests d'intrusion et correctifs",
        progress: 100,
        teamMembers: [{ id: 3, name: "Léa Martin" }],
        taskCount: 2,
        createdAt: "2026-05-01T10:00:00Z",
        updatedAt: "2026-06-15T10:00:00Z",
      },
    ],
  };

  beforeEach(() => {
    cy.mockAllApi(mockCRMData);

    cy.intercept("GET", "/api/projects*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: mockCRMData.projects,
          meta: { page: 1, perPage: 20, total: 2, totalPages: 1 },
        },
      },
    }).as("getProjects");

    cy.intercept("GET", "/api/projects/1/tasks", {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 10,
            projectId: 1,
            label: "Rédiger spécifications API",
            status: "Terminé",
            priority: "high",
            dueDate: "2026-06-15",
            assigneeId: 1,
            assigneeName: "Adem Eray",
          },
          {
            id: 11,
            projectId: 1,
            label: "Développer écran Dashboard",
            status: "En cours",
            priority: "medium",
            dueDate: "2026-08-15",
            assigneeId: 1,
            assigneeName: "Adem Eray",
          },
        ],
      },
    }).as("getProjectTasks");

    cy.visitWithSeed("/projects", mockCRMData);
  });

  it("should render projects list and project card details", () => {
    cy.contains("Projets").should("be.visible");
    cy.contains("Refonte Site Web Eray").should("be.visible");
    cy.contains("Audit Sécurité ERP").should("be.visible");
  });

  it("should filter projects using search query", () => {
    cy.get('input[placeholder*="Rechercher un projet"]').type("Refonte");
    cy.contains("Refonte Site Web Eray").should("be.visible");
    cy.contains("Audit Sécurité ERP").should("not.exist");
  });

  it("should select a project and view its tasks", () => {
    cy.contains("button", "Ouvrir").first().click();
    cy.contains("Rédiger spécifications API").should("be.visible");
    cy.contains("Développer écran Dashboard").should("be.visible");
  });

  it("should add a new task to the selected project", () => {
    cy.contains("button", "Ouvrir").first().click();
    cy.get('input[placeholder="Nom de la tâche..."]').type("Tester les performances de charge");
    cy.contains("button", "Ajouter").click();

    cy.contains("Tâche créée").should("exist");
  });

  it("should open new project dialog and submit form", () => {
    cy.contains("button", "Nouveau projet").click();
    cy.contains("Créer un projet").should("be.visible");

    cy.get('input[name="name"]').type("Nouveau CRM Mobile");
    cy.get('select[name="clientId"]').select("1");

    cy.contains("button", "Créer le projet").click();
    cy.contains("Projet créé").should("exist");
  });
});
