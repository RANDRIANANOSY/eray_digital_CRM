/// <reference types="cypress" />

describe("Settings Page", () => {
  beforeEach(() => {
    cy.mockAllApi();
    cy.visitWithSeed("/settings", {});
  });

  it("should render settings page and navigate through all sections", () => {
    cy.contains("h1", "Paramètres").should("be.visible");

    // Profile tab active by default
    cy.contains("Profil utilisateur").should("be.visible");

    // Switch to Équipes tab
    cy.contains("button", "Équipes").click();
    cy.contains("Organisez vos commerciaux par équipe.").should("be.visible");

    // Switch to Notifications tab
    cy.contains("button", "Notifications").click();
    cy.contains("Choisissez quand et comment être alerté.").should("be.visible");

    // Switch to Affichage tab
    cy.contains("button", "Affichage").click();
    cy.contains("Préférences d'affichage").should("be.visible");

    // Switch to Général tab
    cy.contains("button", "Général").click();
    cy.contains("Paramètres généraux").should("be.visible");

    // Switch to Sécurité tab
    cy.contains("button", "Sécurité").click();
    cy.contains("Recevoir un lien de réinitialisation").should("be.visible");

    // Switch to Facturation tab
    cy.contains("button", "Facturation").click();
    cy.contains("Aucun module de facturation").should("be.visible");
  });

  it("should edit profile fields and save profile", () => {
    cy.contains("button", "Profil").click();

    cy.get('input[value="Adem"]').clear().type("Adem-Updated");
    cy.get('input[value="Eray"]').clear().type("Eray-Updated");

    cy.contains("button", "Enregistrer").click();
    cy.contains("Profil mis à jour").should("exist");
  });
});
