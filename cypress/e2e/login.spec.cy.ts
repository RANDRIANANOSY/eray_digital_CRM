/// <reference types="cypress" />

describe("Login Page with Mocked API & Fallbacks", () => {
  beforeEach(() => {
    cy.mockAllApi();

    // Override login intercept with conditional responses per email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy.intercept("POST", "/api/auth/login", (req: any) => {
      const body = req.body as { email: string };
      if (body.email === "admin@eray.com") {
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            data: {
              token: "mock-token-admin",
              role: "admin",
              user: {
                id: 1,
                email: "admin@eray.com",
                firstName: "Adem",
                lastName: "Eray",
                fullName: "Adem Eray",
                role: "admin",
                phone: null,
                team: "Direction",
                status: "active",
                isVerified: true,
              },
            },
            message: null,
            errors: [],
          },
        });
      } else if (body.email === "network-error@test.com") {
        req.destroy(); // Network failure to trigger local fallback
      } else {
        req.reply({
          statusCode: 401,
          body: { message: "Identifiants incorrects." },
        });
      }
    }).as("mockLogin");

    cy.visit("/login");
  });

  it("should authenticate successfully with a mocked login response", () => {
    cy.get('input[id="email"]').type("admin@eray.com");
    cy.get('input[id="password"]').type("password123");

    // Test password visibility toggle
    cy.get('button[type="button"]').first().click(); // click show password
    cy.get('input[id="password"]').should("have.attr", "type", "text");
    cy.get('button[type="button"]').first().click(); // click hide password
    cy.get('input[id="password"]').should("have.attr", "type", "password");

    // Test remember me
    cy.get('input[id="remember"]').check();

    cy.get('button[type="submit"]').click();

    cy.wait("@mockLogin");
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
    cy.contains("Bonjour").should("be.visible");

    // Clean up local storage
    cy.window().then((win: Window) => {
      expect(win.localStorage.getItem("token")).to.equal("mock-token-admin");
    });
  });

  it("should display an error when mocked login is rejected", () => {
    cy.get('input[id="email"]').type("unknown@test.com");
    cy.get('input[id="password"]').type("badpass");
    cy.get('button[type="submit"]').click();

    cy.wait("@mockLogin");
    cy.contains("Identifiants incorrects.").should("be.visible");
    cy.get('button[type="submit"]').should("not.be.disabled");
  });

  it("should display error when credentials are invalid (no local fallback)", () => {
    cy.get('input[id="email"]').type("yanis@eray.com");
    cy.get('input[id="password"]').type("wrongpassword");
    cy.get('button[type="submit"]').click();

    cy.wait("@mockLogin");
    cy.contains("Identifiants incorrects.").should("be.visible");
  });

  it("should display error for unregistered email via mock", () => {
    cy.get('input[id="email"]').type("marc@eray.com");
    cy.get('input[id="password"]').type("password123");
    cy.get('button[type="submit"]').click();

    cy.wait("@mockLogin");
    cy.contains("Identifiants incorrects.").should("be.visible");
  });

  it("should support forgot password dialog trigger", () => {
    cy.contains("Mot de passe oublié ?").click();
    cy.get('[role="dialog"]').should("be.visible");
    cy.contains("Mot de passe oublié").should("be.visible");
  });

  it("should support quick login demo credentials fill", () => {
    cy.contains("yanis@eray.com").click();
    cy.get('input[id="email"]').should("have.value", "yanis@eray.com");
    cy.get('input[id="password"]').should("have.value", "Demo1234!");
  });
});
