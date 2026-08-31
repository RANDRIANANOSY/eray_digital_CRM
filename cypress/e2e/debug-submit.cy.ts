/// <reference types="cypress" />

describe("Debug modify", () => {
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
    ],
    deals: [],
    projects: [],
    clientEvents: [],
    members: [],
  };

  it("debug modify flow step by step", () => {
    cy.mockAllApi(mockCRMData);
    cy.visitWithSeed("/activities", mockCRMData);

    // Verify page loaded
    cy.contains("Appel de Qualification").should("be.visible");

    // Find the correct activity row and its dropdown trigger
    cy.contains("Appel de Qualification")
      .parents(".group")
      .then(($group) => {
        cy.log(`Found .group: ${$group.length}`);
        // Check all buttons inside this group
        $group.find("button").each((i, el) => {
          cy.log(`Group Button ${i}: classes="${el.className}" text="${el.textContent?.trim()}"`);
        });
      });

    // Click the dropdown trigger (MoreHorizontal button)
    cy.contains("Appel de Qualification")
      .parents(".group")
      .find("button")
      .filter(":has(svg)")
      .last()
      .click({ force: true });

    cy.wait(500);

    // Check if dropdown menu appeared
    cy.get('[role="menu"]').then(($menus) => {
      cy.log(`Menu elements: ${$menus.length}`);
    });
    cy.get("[data-radix-popper-content-wrapper]").then(($wrappers) => {
      cy.log(`Radix popper wrappers: ${$wrappers.length}`);
    });

    // List all visible elements with "Modifier" text
    cy.contains("*", "Modifier").each(($el) => {
      cy.log(
        `Element with "Modifier": tag=${$el[0].tagName} visible=${$el.is(":visible")} text="${$el.text().substring(0, 50)}" role="${$el.attr("role")}"`,
      );
    });

    // Try clicking the menu item
    cy.get('[role="menuitem"]').then(($items) => {
      cy.log(`Menu items found: ${$items.length}`);
      $items.each((i, el) => {
        cy.log(`Menu item ${i}: text="${el.textContent}" visible=${Cypress.$(el).is(":visible")}`);
      });
    });

    cy.get('[role="menuitem"]').contains("Modifier").click();

    // Check if dialog appeared
    cy.wait(1000);
    cy.get("body").then(($body) => {
      cy.log(`Body has [role="dialog"]: ${$body.find('[role="dialog"]').length}`);
      // Check all role=dialog elements
      $body.find('[role="dialog"]').each((i, el) => {
        cy.log(
          `Dialog ${i}: visible=${Cypress.$(el).is(":visible")} html="${(el as HTMLElement).outerHTML.substring(0, 200)}"`,
        );
      });
    });
  });

  it("debug modify flow - direct approach", () => {
    cy.mockAllApi(mockCRMData);
    cy.visitWithSeed("/activities", mockCRMData);

    cy.contains("Appel de Qualification").should("be.visible");

    // Try the same approach as the working "Voir les détails" part
    // First, let's make Voir les détails work
    cy.contains("Appel de Qualification")
      .parents(".group")
      .find("button.h-6.w-6")
      .click({ force: true });

    cy.contains("Voir les détails").click();
    cy.contains("Détails de l'activité").should("be.visible");
    cy.log("Voir les détails works!");

    // Close dialog
    cy.get('[role="dialog"]').parent().click({ force: true });
    cy.get('[role="dialog"]').should("not.exist");
    cy.wait(300);

    // Now open dropdown again for Modifier
    cy.contains("Appel de Qualification")
      .parents(".group")
      .find("button.h-6.w-6")
      .click({ force: true });

    cy.wait(300);

    // Check if Modifier is visible
    cy.contains("Modifier").then(($el) => {
      const el = ($el as unknown as JQuery<HTMLElement>)[0];
      cy.log(
        `Modifier found: tag=${el.tagName} visible=${($el as unknown as JQuery<HTMLElement>).is(":visible")} inViewport=${el.getBoundingClientRect().top >= 0}`,
      );
    });

    cy.contains("Modifier").click();

    cy.wait(1000);

    cy.get("body").then(($body) => {
      cy.log(`After Modifier click - dialog count: ${$body.find('[role="dialog"]').length}`);
      $body.find('[role="dialog"]').each((i, el) => {
        cy.log(
          `Dialog ${i}: visible=${Cypress.$(el).is(":visible")} title="${Cypress.$(el).find('[class*="DialogTitle"]').text()}"`,
        );
      });
    });
  });
});
