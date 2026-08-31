// cypress/support/e2e.ts
import "@cypress/code-coverage/support";

console.log("=== Cypress e2e.ts loaded ===");

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to visit a page while seeding localStorage with CRM mock data
       * and a default authenticated session token.
       * @example cy.visitWithSeed('/activities', mockData)
       */
      visitWithSeed(
        url: string,
        seedData: Record<string, unknown>,
        auth?: { token: string; role: string; name: string },
      ): Chainable<AUTWindow>;

      /**
       * Intercept all API endpoints with mock data.
       * No real backend needed — every /api/* call returns a fixture or mock response.
       * Call this in beforeEach BEFORE cy.visit().
       */
      mockAllApi(seedData?: Record<string, unknown>): Chainable<void>;
    }
  }
}

// Prevent Cypress from failing tests when uncaught exceptions occur in the application under test
Cypress.on("uncaught:exception", (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  return false;
});

// ── Helper: wrap data in the backend Envelope format ─────────────────────────
function envelope<T>(data: T) {
  return { success: true, data, message: null, errors: [] };
}

function emptyPaginated<T>() {
  return envelope({ items: [] as T[], meta: { page: 1, perPage: 20, total: 0, totalPages: 0 } });
}

// ── mockAllApi: intercept every /api/* route ─────────────────────────────────
Cypress.Commands.add("mockAllApi", (seedData?: Record<string, unknown>) => {
  cy.intercept("GET", "/api/**", { statusCode: 200, body: envelope(null) }).as("apiGetFallback");
  cy.intercept("POST", "/api/**", { statusCode: 200, body: envelope(null) }).as("apiPostFallback");
  cy.intercept("PUT", "/api/**", { statusCode: 200, body: envelope(null) }).as("apiPutFallback");
  cy.intercept("PATCH", "/api/**", { statusCode: 200, body: envelope(null) }).as(
    "apiPatchFallback",
  );
  cy.intercept("DELETE", "/api/**", { statusCode: 200, body: envelope(null) }).as(
    "apiDeleteFallback",
  );

  // ── Auth ──────────────────────────────────────────────────────────────────
  cy.intercept("POST", "/api/auth/login", {
    statusCode: 200,
    body: envelope({
      token: "mock-token-cypress",
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
    }),
  }).as("apiLogin");

  cy.intercept("POST", "/api/auth/register", {
    statusCode: 201,
    body: envelope({
      id: 99,
      email: "new@eray.com",
      firstName: "New",
      lastName: "User",
      fullName: "New User",
      role: "commercial",
      phone: null,
      team: null,
      status: "invited",
      isVerified: false,
    }),
  }).as("apiRegister");

  cy.intercept("POST", "/api/auth/logout", {
    statusCode: 200,
    body: envelope(null),
  }).as("apiLogout");

  cy.intercept("POST", "/api/auth/password-reset", {
    statusCode: 200,
    body: envelope(null),
  }).as("apiPasswordReset");

  cy.intercept("POST", "/api/auth/password-reset/confirm", {
    statusCode: 200,
    body: envelope(null),
  }).as("apiPasswordResetConfirm");

  // ── Me ────────────────────────────────────────────────────────────────────
  cy.intercept("GET", "/api/me", {
    statusCode: 200,
    body: envelope({
      id: 1,
      email: "admin@eray.com",
      firstName: "Adem",
      lastName: "Eray",
      fullName: "Adem Eray",
      role: "admin",
      phone: "+33 6 12 45 78 90",
      team: "Direction",
      status: "active",
      isVerified: true,
    }),
  }).as("apiMe");

  cy.intercept("PATCH", "/api/me", {
    statusCode: 200,
    body: envelope({
      id: 1,
      email: "admin@eray.com",
      firstName: "Adem",
      lastName: "Eray",
      fullName: "Adem Eray",
      role: "admin",
      phone: "+33 6 12 45 78 90",
      team: "Direction",
      status: "active",
      isVerified: true,
    }),
  }).as("apiMeUpdate");

  // ── Clients ───────────────────────────────────────────────────────────────
  const allClients = [
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
    {
      id: 2,
      name: "Mock Client Two",
      company: "Beta Services",
      role: "CEO",
      email: "beta@test.com",
      phone: "+261340000002",
      city: "Antsirabe",
      sector: "Finance",
      ownerId: 3,
      ownerName: "Léa Martin",
      status: "actif",
      priority: "medium",
      tags: ["VIP"],
      value: 450000,
      lastContactAt: "2026-08-09",
      initials: "MC",
      createdAt: "2026-02-10T10:00:00Z",
      updatedAt: "2026-08-09T10:00:00Z",
    },
  ];

  cy.intercept("GET", "/api/clients*", (req) => {
    const url = new URL(req.url);

    // Check if it's fetching a single client by ID
    const match = url.pathname.match(/^\/api\/clients\/(\d+)$/);
    if (match) {
      const id = Number(match[1]);
      const client = allClients.find((c) => c.id === id);
      if (client) {
        req.reply({ statusCode: 200, body: envelope(client) });
      } else {
        req.reply({ statusCode: 404, body: envelope(null) });
      }
      return;
    }

    let filtered = [...allClients];

    const q = url.searchParams.get("q");
    if (q) {
      const lower = q.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.company.toLowerCase().includes(lower) ||
          c.role.toLowerCase().includes(lower) ||
          c.email.toLowerCase().includes(lower) ||
          c.city.toLowerCase().includes(lower) ||
          c.sector.toLowerCase().includes(lower) ||
          (c.tags || []).some((t) => t.toLowerCase().includes(lower)),
      );
    }

    const statuses = url.searchParams.getAll("status[]");
    if (statuses.length > 0) {
      filtered = filtered.filter((c) => statuses.includes(c.status));
    }

    const priorities = url.searchParams.getAll("priority[]");
    if (priorities.length > 0) {
      filtered = filtered.filter((c) => priorities.includes(c.priority));
    }

    const owner = url.searchParams.get("owner");
    if (owner) {
      filtered = filtered.filter((c) => String(c.ownerId) === owner);
    }

    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const perPage = parseInt(url.searchParams.get("perPage") || "20", 10);

    const total = filtered.length;
    const totalPages = Math.ceil(total / perPage) || 1;
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);

    req.reply({
      statusCode: 200,
      body: envelope({
        items,
        meta: { page, perPage, total, totalPages },
      }),
    });
  }).as("apiClients");

  cy.intercept("POST", "/api/clients", (req) => {
    const newClient = {
      id: Date.now(),
      ...req.body,
      ownerId: 1,
      ownerName: "Adem Eray",
      initials: (req.body.name || "XX")
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    allClients.push(newClient);
    req.reply({
      statusCode: 201,
      body: envelope(newClient),
    });
  }).as("apiClientCreate");

  cy.intercept("PUT", "/api/clients/*", (req) => {
    const urlParts = req.url.split("/");
    const id = Number(urlParts[urlParts.length - 1]);
    const idx = allClients.findIndex((c) => c.id === id);
    if (idx !== -1) {
      allClients[idx] = { ...allClients[idx], ...req.body, updatedAt: new Date().toISOString() };
    }
    req.reply({
      statusCode: 200,
      body: envelope({
        id,
        ...req.body,
        ownerId: allClients[idx]?.ownerId ?? 1,
        ownerName: allClients[idx]?.ownerName ?? "Adem Eray",
        updatedAt: new Date().toISOString(),
      }),
    });
  }).as("apiClientUpdate");

  cy.intercept("DELETE", "/api/clients/*", (req) => {
    const urlParts = req.url.split("/");
    const id = Number(urlParts[urlParts.length - 1]);
    const idx = allClients.findIndex((c) => c.id === id);
    if (idx !== -1) {
      allClients.splice(idx, 1);
    }
    req.reply({
      statusCode: 200,
      body: envelope(null),
    });
  }).as("apiClientDelete");

  // ── Activities ────────────────────────────────────────────────────────────
  let mockedActivities = Array.isArray(seedData?.activities)
    ? seedData.activities.map((activity, index) => {
        const item = activity as Record<string, unknown>;
        let dateStr = "2026-07-06";
        if (item.date === "Aujourd'hui") dateStr = "2026-07-06";
        else if (item.date === "Demain") dateStr = "2026-07-07";
        else if (item.date === "Hier") dateStr = "2026-07-05";
        else if (typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date))
          dateStr = item.date;
        const scheduledAt = String(item.scheduledAt ?? `${dateStr}T${item.time ?? "09:00"}:00Z`);
        return {
          id: Number(item.id ?? index + 1) || index + 1,
          type: item.type ?? "note",
          title: item.title ?? "Activité mockée",
          clientId: Number(item.clientId ?? 1),
          clientName: item.clientName ?? item.client ?? "Mock Prospect One",
          ownerId: Number(item.ownerId ?? 1),
          ownerName: item.ownerName ?? item.owner ?? "Antoine Roy",
          scheduledAt,
          durationMinutes: item.durationMinutes ?? null,
          status: item.status ?? "à faire",
          priority: item.priority ?? "medium",
          summary: item.summary ?? null,
          result: item.result ?? null,
          reminderAt: item.reminderAt ?? null,
          createdAt: item.createdAt ?? scheduledAt,
          updatedAt: item.updatedAt ?? scheduledAt,
        };
      })
    : null;

  const defaultActivities = [
    {
      id: 1,
      type: "call",
      title: "Appel de Qualification",
      clientId: 1,
      clientName: "Mock Prospect One",
      ownerId: 1,
      ownerName: "Antoine Roy",
      scheduledAt: "2026-07-06T10:30:00Z",
      durationMinutes: 60,
      status: "à faire",
      priority: "medium",
      summary: "Discussion about software integration",
      result: null,
      reminderAt: null,
      createdAt: "2026-07-06T08:00:00Z",
      updatedAt: "2026-07-06T08:00:00Z",
    },
    {
      id: 2,
      type: "email",
      title: "Envoi Devis Alpha",
      clientId: 1,
      clientName: "Mock Prospect One",
      ownerId: 1,
      ownerName: "Antoine Roy",
      scheduledAt: "2026-07-05T14:00:00Z",
      durationMinutes: null,
      status: "terminé",
      priority: "high",
      summary: "Sent proposal via mail",
      result: null,
      reminderAt: null,
      createdAt: "2026-07-05T09:00:00Z",
      updatedAt: "2026-07-05T14:00:00Z",
    },
    {
      id: 3,
      type: "call",
      title: "Test Quick Call",
      clientId: 1,
      clientName: "Mock Prospect One",
      ownerId: 1,
      ownerName: "Antoine Roy",
      scheduledAt: "2026-07-06T10:30:00Z",
      durationMinutes: 30,
      status: "à faire",
      priority: "medium",
      summary: "Discussion about software integration",
      result: null,
      reminderAt: null,
      createdAt: "2026-07-06T07:00:00Z",
      updatedAt: "2026-07-06T07:00:00Z",
    },
    {
      id: 4,
      type: "meeting",
      title: "Test Design Sync",
      clientId: 2,
      clientName: "Mock Client Two",
      ownerId: 3,
      ownerName: "Léa Martin",
      scheduledAt: "2026-07-07T14:00:00Z",
      durationMinutes: 120,
      status: "planifié",
      priority: "high",
      summary: "Verify contract details",
      result: null,
      reminderAt: null,
      createdAt: "2026-07-06T07:00:00Z",
      updatedAt: "2026-07-06T07:00:00Z",
    },
    {
      id: 5,
      type: "meeting",
      title: "Réunion d'équipe",
      clientId: 1,
      clientName: "Mock Client One",
      ownerId: 3,
      ownerName: "Léa Martin",
      scheduledAt: "2026-07-07T14:00:00Z",
      durationMinutes: 120,
      status: "planifié",
      priority: "high",
      summary: "Point sur les opportunités",
      result: null,
      reminderAt: null,
      createdAt: "2026-07-06T06:00:00Z",
      updatedAt: "2026-07-06T06:00:00Z",
    },
    {
      id: 6,
      type: "follow-up",
      title: "Relance Contrat",
      clientId: 1,
      clientName: "Mock Client One",
      ownerId: 2,
      ownerName: "Yanis Moreau",
      scheduledAt: "2026-07-08T09:00:00Z",
      durationMinutes: 30,
      status: "planifié",
      priority: "low",
      summary: "Follow up call",
      result: null,
      reminderAt: null,
      createdAt: "2026-07-06T06:00:00Z",
      updatedAt: "2026-07-06T06:00:00Z",
    },
  ];

  cy.intercept("GET", "/api/activities*", (req) => {
    const query = new URL(req.url).searchParams;
    const type = query.getAll("type[]")[0];
    const status = query.getAll("status[]")[0];
    const owner = query.get("owner");
    const source = mockedActivities ?? defaultActivities;
    const items = source.filter(
      (activity) =>
        (!type || activity.type === type) &&
        (!status || activity.status === status) &&
        (!owner || String(activity.ownerId) === owner),
    );

    req.reply({
      statusCode: 200,
      body: envelope({
        items,
        meta: {
          page: Number(query.get("page") ?? 1),
          perPage: Number(query.get("perPage") ?? 15),
          total: items.length,
          totalPages: items.length ? 1 : 0,
        },
      }),
    });
  }).as("apiActivities");

  cy.intercept("POST", "/api/activities", (req) => {
    const createdActivity = {
      id: 99,
      ...req.body,
      clientId: req.body.clientId ?? 1,
      clientName: "Mock Prospect One",
      ownerId: 1,
      ownerName: "Adem Eray",
      scheduledAt: req.body.scheduledAt ?? "2026-08-19T09:00:00Z",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockedActivities?.push(createdActivity);
    req.reply({
      statusCode: 201,
      body: envelope(createdActivity),
    });
  }).as("apiActivityCreate");

  cy.intercept("PUT", "/api/activities/*", (req) => {
    const id = Number(req.url.split("/").pop());
    const updatedActivity = {
      id,
      ...req.body,
      clientId: req.body.clientId ?? 1,
      clientName: "Mock Prospect One",
      ownerId: 1,
      ownerName: "Adem Eray",
      updatedAt: new Date().toISOString(),
    };
    if (mockedActivities) {
      mockedActivities = mockedActivities.map((activity) =>
        activity.id === id ? { ...activity, ...updatedActivity } : activity,
      );
    }
    req.reply({
      statusCode: 200,
      body: envelope(updatedActivity),
    });
  }).as("apiActivityUpdate");

  cy.intercept("DELETE", "/api/activities/*", (req) => {
    const id = Number(req.url.split("/").pop());
    if (mockedActivities)
      mockedActivities = mockedActivities.filter((activity) => activity.id !== id);
    req.reply({ statusCode: 200, body: envelope(null) });
  }).as("apiActivityDelete");

  // ── Opportunities (Pipeline) ──────────────────────────────────────────────
  cy.intercept("GET", "/api/opportunities*", {
    statusCode: 200,
    body: envelope({
      items: [
        {
          id: 1,
          clientId: 2,
          clientName: "Mock Client Two",
          company: "Beta Services",
          ownerId: 1,
          ownerName: "Antoine Roy",
          amount: 8000000,
          probability: 100,
          stage: "Vente gagnée",
          isWon: true,
          isLost: false,
          lastActivityAt: "2026-08-15T10:00:00Z",
          nextAction: null,
          closeDate: "2026-08-15",
          createdAt: "2026-06-01T10:00:00Z",
          updatedAt: "2026-08-15T10:00:00Z",
        },
        {
          id: 2,
          clientId: 1,
          clientName: "Mock Prospect One",
          company: "Alpha Tech",
          ownerId: 2,
          ownerName: "Léa Martin",
          amount: 3500000,
          probability: 40,
          stage: "Qualification",
          isWon: false,
          isLost: false,
          lastActivityAt: "2026-08-18T10:00:00Z",
          nextAction: "Envoyer devis",
          closeDate: "2026-09-01",
          createdAt: "2026-07-10T10:00:00Z",
          updatedAt: "2026-08-18T10:00:00Z",
        },
      ],
      meta: { page: 1, perPage: 20, total: 2, totalPages: 1 },
    }),
  }).as("apiOpportunities");

  cy.intercept("POST", "/api/opportunities", (req) => {
    req.reply({
      statusCode: 201,
      body: envelope({
        id: 99,
        ...req.body,
        clientId: req.body.clientId ?? 1,
        clientName: "Mock Client",
        ownerId: 1,
        ownerName: "Adem Eray",
        isWon: false,
        isLost: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });
  }).as("apiOpportunityCreate");

  cy.intercept("PUT", "/api/opportunities/*", (req) => {
    req.reply({
      statusCode: 200,
      body: envelope({
        id: 1,
        ...req.body,
        clientId: req.body.clientId ?? 1,
        clientName: "Mock Client",
        ownerId: 1,
        ownerName: "Adem Eray",
        updatedAt: new Date().toISOString(),
      }),
    });
  }).as("apiOpportunityUpdate");

  cy.intercept("DELETE", "/api/opportunities/*", {
    statusCode: 200,
    body: envelope(null),
  }).as("apiOpportunityDelete");

  // ── Projects ──────────────────────────────────────────────────────────────
  cy.intercept("GET", "/api/projects*", {
    statusCode: 200,
    body: emptyPaginated(),
  }).as("apiProjects");

  cy.intercept("POST", "/api/projects", (req) => {
    req.reply({
      statusCode: 201,
      body: envelope({
        id: 99,
        ...req.body,
        clientId: req.body.clientId ?? 1,
        clientName: "Mock Client",
        ownerId: 1,
        ownerName: "Adem Eray",
        progress: 0,
        teamMembers: [],
        taskCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });
  }).as("apiProjectCreate");

  cy.intercept("PUT", "/api/projects/*", (req) => {
    req.reply({
      statusCode: 200,
      body: envelope({
        id: 1,
        ...req.body,
        clientId: req.body.clientId ?? 1,
        clientName: "Mock Client",
        ownerId: 1,
        ownerName: "Adem Eray",
        updatedAt: new Date().toISOString(),
      }),
    });
  }).as("apiProjectUpdate");

  cy.intercept("DELETE", "/api/projects/*", {
    statusCode: 200,
    body: envelope(null),
  }).as("apiProjectDelete");

  // ── Project Tasks ─────────────────────────────────────────────────────────
  cy.intercept("GET", "/api/projects/*/tasks", {
    statusCode: 200,
    body: envelope([]),
  }).as("apiProjectTasks");

  cy.intercept("POST", "/api/projects/*/tasks", (req) => {
    req.reply({
      statusCode: 201,
      body: envelope({
        id: 99,
        projectId: 1,
        ...req.body,
        assigneeId: null,
        assigneeName: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });
  }).as("apiProjectTaskCreate");

  cy.intercept("PUT", "/api/projects/*/tasks/*", (req) => {
    req.reply({
      statusCode: 200,
      body: envelope({
        id: 1,
        projectId: 1,
        ...req.body,
        updatedAt: new Date().toISOString(),
      }),
    });
  }).as("apiProjectTaskUpdate");

  cy.intercept("DELETE", "/api/projects/*/tasks/*", {
    statusCode: 200,
    body: envelope(null),
  }).as("apiProjectTaskDelete");

  // ── Users ─────────────────────────────────────────────────────────────────
  const seededMembers = Array.isArray(seedData?.members)
    ? (seedData.members as Record<string, unknown>[]).map((item, index) => ({
        id: Number(item.id ?? index + 1) || index + 1,
        email: String(item.email ?? `${item.firstName ?? "user"}@eray.com`),
        firstName: String(item.firstName ?? (item.name ?? "").split(" ")[0] ?? "User"),
        lastName: String(item.lastName ?? (item.name ?? "").split(" ").slice(1).join(" ") ?? ""),
        fullName: String(
          item.fullName ?? item.name ?? `${item.firstName ?? "User"} ${item.lastName ?? ""}`.trim(),
        ),
        role:
          item.role === "Administrateur"
            ? "admin"
            : item.role === "Manager"
              ? "manager"
              : "commercial",
        phone: item.phone ?? null,
        team: item.team ?? null,
        status:
          item.status === "Actif"
            ? "active"
            : item.status === "Invité"
              ? "invited"
              : item.status === "Désactivé"
                ? "disabled"
                : "active",
        isVerified: item.status !== "Invité",
        initials: item.initials ?? null,
        lastActive: item.lastActive ?? null,
      }))
    : null;

  let mockedUsers = seededMembers ?? [];

  cy.intercept("GET", "/api/users", (req) => {
    req.reply({
      statusCode: 200,
      body: envelope(mockedUsers),
    });
  }).as("apiUsers");

  cy.intercept("POST", "/api/users/invite", (req) => {
    const firstName = req.body.firstName ?? "New";
    const lastName = req.body.lastName ?? "User";
    const newUser = {
      id: Math.max(100, ...mockedUsers.map((u) => Number(u.id))) + 1,
      email: req.body.email,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      role: req.body.role ?? "commercial",
      phone: null,
      team: req.body.team ?? null,
      status: "invited",
      isVerified: false,
      initials: `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase(),
      lastActive: "Jamais",
    };
    mockedUsers = [newUser, ...mockedUsers];
    req.reply({
      statusCode: 201,
      body: envelope(newUser),
    });
  }).as("apiUserInvite");

  cy.intercept("PUT", "/api/users/*", (req) => {
    req.reply({
      statusCode: 200,
      body: envelope({
        id: 1,
        email: "admin@eray.com",
        firstName: "Adem",
        lastName: "Eray",
        fullName: "Adem Eray",
        role: req.body.role ?? "admin",
        phone: "+33 6 12 45 78 90",
        team: req.body.team ?? "Direction",
        status: "active",
        isVerified: true,
      }),
    });
  }).as("apiUserUpdate");

  cy.intercept("PATCH", "/api/users/*/status", (req) => {
    req.reply({
      statusCode: 200,
      body: envelope({
        id: 1,
        email: "admin@eray.com",
        firstName: "Adem",
        lastName: "Eray",
        fullName: "Adem Eray",
        role: "admin",
        phone: "+33 6 12 45 78 90",
        team: "Direction",
        status: req.body.status ?? "active",
        isVerified: true,
      }),
    });
  }).as("apiUserSetStatus");

  // ── Dashboard ─────────────────────────────────────────────────────────────
  cy.intercept("GET", "/api/dashboard/statistics", {
    statusCode: 200,
    body: envelope({
      totalClients: 2,
      prospects: 1,
      activeClients: 1,
      totalOpportunityValue: 11500000,
      wonOpportunities: 1,
      lostOpportunities: 0,
      upcomingActivities: 1,
      overdueTasks: 0,
      revenueByMonth: { "2026-08": 8000000 },
      clientsByStatus: {},
      opportunitiesByStage: {},
    }),
  }).as("apiDashboardStats");
});

// ── visitWithSeed ────────────────────────────────────────────────────────────
Cypress.Commands.add(
  "visitWithSeed",
  (
    url: string,
    seedData: Record<string, unknown>,
    auth: { token: string; role: string; name: string } = {
      token: "mock-token-cypress",
      role: "admin",
      name: "Adem Eray",
    },
  ) => {
    return cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.setItem("eray_crm_data", JSON.stringify(seedData));
        win.localStorage.setItem("token", auth.token);
        win.localStorage.setItem("role", auth.role);
        win.localStorage.setItem("name", auth.name);
      },
    });
  },
);

export {};
