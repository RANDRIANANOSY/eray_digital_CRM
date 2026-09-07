/// <reference types="cypress" />

describe("Reset Password Page", () => {
  it("should render reset password form with token and validate passwords", () => {
    cy.mockAllApi();
    cy.visit("/reset-password?token=valid-test-token");

    cy.contains("Nouveau mot de passe").should("be.visible");

    // Form inputs
    cy.get('input[id="password"]').type("NewPassword123!");
    cy.get('input[id="confirmPassword"]').type("DifferentPassword");

    cy.contains("button", "Mettre à jour le mot de passe").click();
    cy.contains("Les mots de passe ne correspondent pas.").should("be.visible");

    // Fix password
    cy.get('input[id="confirmPassword"]').clear().type("NewPassword123!");
    cy.contains("button", "Mettre à jour le mot de passe").click();

    cy.contains("Mot de passe mis à jour !").should("exist");
  });
});
