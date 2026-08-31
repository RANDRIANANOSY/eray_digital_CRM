/// <reference types="cypress" />

describe("Signup Page", () => {
  beforeEach(() => {
    cy.mockAllApi();
  });

  it("should create a new account, showing password strength, and redirect to login", () => {
    const email = `cypress.user+${Date.now()}@eray.com`;

    cy.visit("/signup");

    // Password strength meter appears once user types a password

    cy.get("#firstName").type("Cypress");
    cy.get("#lastName").type("Test");
    cy.get("#company").type("Cypress Co");
    cy.get("#email").type(email);

    // Type weak password (too short -> strength score 0 -> shows minimum requirement)
    cy.get("#password").type("pass");
    cy.contains("8 caractères minimum").should("be.visible");

    // Type strong password
    cy.get("#password").clear().type("Password123!");
    cy.contains("Excellent").should("be.visible");

    cy.get("#confirmPassword").type("Password123!");

    // Test show/hide password buttons
    cy.get('button[type="button"]').eq(0).click(); // show password
    cy.get("#password").should("have.attr", "type", "text");
    cy.get('button[type="button"]').eq(0).click(); // hide password
    cy.get("#password").should("have.attr", "type", "password");

    // Try submit without terms accepted
    cy.get("button[type=submit]").click();
    cy.contains("Vous devez accepter les conditions d'utilisation").should("be.visible");

    // Accept terms and submit
    cy.get("#terms").check();
    cy.get("button[type=submit]").click();

    cy.contains("Compte créé avec succès", { timeout: 6000 }).should("be.visible");
    cy.wait(2200); // Wait for redirect
    cy.url().should("include", "/login");
  });

  it("should show an error when passwords do not match", () => {
    cy.visit("/signup");
    cy.get("#firstName").type("Cypress");
    cy.get("#lastName").type("Test");
    cy.get("#company").type("Cypress Co");
    cy.get("#email").type(`cypress.error+${Date.now()}@eray.com`);
    cy.get("#password").type("Password123!");
    cy.get("#confirmPassword").type("Password321!");
    cy.get("#terms").check();
    cy.get("button[type=submit]").click();

    cy.contains("Les mots de passe ne correspondent pas").should("be.visible");
  });

  it("should validate minimum password length requirement", () => {
    cy.visit("/signup");
    cy.get("#firstName").type("Cypress");
    cy.get("#lastName").type("Test");
    cy.get("#company").type("Cypress Co");
    cy.get("#email").type(`cypress.len+${Date.now()}@eray.com`);
    cy.get("#password").type("abc"); // too short
    cy.get("#confirmPassword").type("abc");
    cy.get("#terms").check();
    cy.get("button[type=submit]").click();

    cy.contains("Le mot de passe doit contenir au moins 8 caractères.").should("be.visible");
  });

  it("should validate email format requirement", () => {
    cy.visit("/signup");
    cy.get("#firstName").type("Cypress");
    cy.get("#lastName").type("Test");
    cy.get("#company").type("Cypress Co");
    cy.get("#email").type("invalid-email-format");
    cy.get("#password").type("Password123!");
    cy.get("#confirmPassword").type("Password123!");
    cy.get("#terms").check();
    // Browser native email validation prevents the form submit event for invalid email
    // — temporarily switch the input type to text so the app's JS validation runs.
    cy.get("#email").invoke("attr", "type", "text");
    cy.get("button[type=submit]").click();

    cy.contains("Veuillez saisir une adresse email valide.", { timeout: 6000 }).should(
      "be.visible",
    );
  });

  it("should show error if email is already registered", () => {
    // Override register to return 409 for admin@eray.com
    cy.intercept("POST", "/api/auth/register", (req) => {
      if (req.body.email === "admin@eray.com") {
        req.reply({
          statusCode: 409,
          body: {
            success: false,
            data: null,
            message: "Cette ressource existe déjà.",
            errors: [],
          },
        });
      } else {
        req.reply({
          statusCode: 201,
          body: {
            success: true,
            data: { id: 99, ...req.body, role: "commercial", status: "invited", isVerified: false },
            message: null,
            errors: [],
          },
        });
      }
    }).as("apiRegisterOverride");

    cy.visit("/signup");
    cy.get("#firstName").type("Cypress");
    cy.get("#lastName").type("Test");
    cy.get("#company").type("Cypress Co");

    // Adem Eray's email is admin@eray.com (already seeded by default in mock-data/store)
    cy.get("#email").type("admin@eray.com");
    cy.get("#password").type("Password123!");
    cy.get("#confirmPassword").type("Password123!");
    cy.get("#terms").check();
    cy.get("button[type=submit]").click();

    cy.contains("Cette ressource existe déjà.").should("be.visible");
  });
});
