/// <reference types="cypress" />

describe("Clients Page", () => {
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
        owner: "Antoine Roy",
        status: "prospect",
        priority: "high",
        tags: ["Test", "Lead"],
        value: 150000,
        lastContact: "10/08/2026",
        initials: "MP",
        color: "indigo",
      },
      {
        id: 2,
        name: "Mock Client Two",
        company: "Beta Services",
        role: "CEO",
        email: "beta@test.com",
        phone: "+261340000002",
        city: "Antsirabe",
        sector: "Finance",
        owner: "Léa Martin",
        status: "actif",
        priority: "medium",
        tags: ["VIP"],
        value: 450000,
        lastContact: "09/08/2026",
        initials: "MC",
        color: "emerald",
      },
    ],
    activities: [],
    deals: [],
    projects: [],
    clientEvents: [],
    members: [],
  };

  beforeEach(() => {
    cy.mockAllApi(mockCRMData);
    cy.visitWithSeed("/clients", mockCRMData);
  });

  it("should render the clients page and display clients in table view by default", () => {
    cy.contains("Clients").should("be.visible");
    cy.contains("Mock Prospect One").should("be.visible");
    cy.contains("Mock Client Two").should("be.visible");
  });

  it("should switch between table and grid card views", () => {
    // Default is table. Switch to cards view
    cy.get('button[aria-label="Vue cartes"]').click();
    cy.contains("Alpha Tech").should("be.visible");

    // Switch back to table view
    cy.get('button[aria-label="Vue tableau"]').click();
    cy.contains("Mock Prospect One").should("be.visible");
  });

  it("should filter clients via search input", () => {
    cy.get('input[placeholder*="Rechercher un client"]').type("Alpha Tech");
    cy.contains("Mock Prospect One").should("be.visible");
    cy.contains("Mock Client Two").should("not.exist");

    // Search with no results
    cy.get('input[placeholder*="Rechercher un client"]').clear().type("NonExistentCompany");
    cy.contains("Mock Prospect One").should("not.exist");
    cy.contains("Mock Client Two").should("not.exist");
  });

  it("should filter clients via advanced dropdown filters and reset them", () => {
    // Sélecteur générique pour le contenu d'un dropdown/menu Radix ouvert.
    // On scope volontairement la recherche du texte À L'INTÉRIEUR de ce
    // conteneur : sans scope, cy.contains("actif") peut matcher le badge de
    // statut déjà présent dans le tableau (derrière l'overlay du dropdown,
    // donc avec pointer-events: none hérité du body), plutôt que l'item du
    // menu lui-même (qui a pointer-events: auto forcé par Radix).
    const DROPDOWN_CONTENT = '[role="menu"], [role="listbox"], [data-radix-popper-content-wrapper]';

    // 1. Filter by Statut: Actif
    cy.contains("button", "Statut").click();
    cy.get(DROPDOWN_CONTENT)
      .last()
      .should("be.visible")
      .within(() => {
        cy.contains("actif").click();
      });
    cy.contains("Mock Client Two").should("be.visible");
    cy.contains("Mock Prospect One").should("not.exist");

    // 2. Filter by Responsable: Léa Martin
    cy.get("select").last().select("3");
    cy.contains("Mock Client Two").should("be.visible");

    // 3. Filter by Priorité: Moyenne (medium)
    cy.contains("button", "Priorité").click();
    cy.get(DROPDOWN_CONTENT)
      .last()
      .should("be.visible")
      .within(() => {
        cy.contains(/^medium$/i).click();
      });
    cy.contains("Mock Client Two").should("be.visible");

    // 4. Reset Filters
    cy.contains("button", "Réinitialiser").click();
    cy.contains("Mock Prospect One").should("be.visible");
    cy.contains("Mock Client Two").should("be.visible");
  });

  it("should trigger export CSV function when clicking exporter button", () => {
    cy.contains("Exporter").should("be.visible").click();
  });

  it("should allow creating a new client, validating forms, and cancelling", () => {
    cy.contains("button", "Nouveau client").click();
    cy.contains("Créer un client").should("be.visible");

    // Test cancellation
    cy.contains("button", "Annuler").click();
    cy.contains("Créer un client").should("not.exist");

    // Open again
    cy.contains("button", "Nouveau client").click();

    // Form inputs
    cy.get('input[name="firstName"]').type("Alice");
    cy.get('input[name="lastName"]').type("Vance");
    cy.get('input[name="company"]').type("Vance Tech");
    cy.get('input[name="role"]').type("VP Product");
    cy.get('input[name="email"]').type("alice@vance.com");
    cy.get('input[name="phone"]').type("+33612345678");
    cy.get('select[name="status"]').select("vip");
    cy.get('select[name="priority"]').select("high");
    cy.get('input[name="value"]').clear().type("500000");
    cy.get('input[name="address"]').type("Paris, France");

    // Submit
    cy.contains("button", "Créer le client").click();

    // Toast and UI verify (toast may animate; assert existence within timeout)
    cy.contains("Client créé avec succès", { timeout: 6000 }).should("exist");
    cy.contains("Alice Vance").should("be.visible");
  });

  it("should view details, edit, and delete client using action dropdown", () => {
    const ACTION_MENU_ICON = 'svg[class*="lucide-more-horizontal"], svg[class*="lucide-ellipsis"]';

    // 1. View details via "Ouvrir" link
    cy.contains("Mock Prospect One").parents("tr").contains("a", "Ouvrir").click();

    cy.url().should("include", "/clients/");
    cy.contains("Mock Prospect One").should("be.visible");

    cy.go("back");
    cy.contains("Mock Prospect One").should("be.visible");

    // 2. Edit client details
    cy.contains("Mock Prospect One").parents("tr").find(ACTION_MENU_ICON).parent().click();

    cy.contains("Modifier").click();
    cy.contains("Modifier le client").should("be.visible");
    cy.get('input[value="Mock Prospect One"]').clear().type("Mock Prospect One Modifié");
    cy.contains("button", "Enregistrer").click();

    cy.contains("Mock Prospect One Modifié").should("be.visible");

    // 3. Delete client
    cy.contains("Mock Prospect One Modifié").parents("tr").find(ACTION_MENU_ICON).parent().click();

    cy.contains("Supprimer").click();
    cy.contains("Mock Prospect One Modifié").should("not.exist");
  });
});
