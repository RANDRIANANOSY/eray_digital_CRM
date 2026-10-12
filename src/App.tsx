import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import RootLayout from "./routes/root.tsx";
import AppLayout from "./routes/_app.tsx";
import { PageLoader } from "./components/page-loader.tsx";

const Login = lazy(() => import("./routes/login.tsx"));
const Signup = lazy(() => import("./routes/signup.tsx"));
const ResetPassword = lazy(() => import("./routes/reset-password.tsx"));
const Dashboard = lazy(() => import("./routes/_app.index.tsx"));
const Clients = lazy(() => import("./routes/_app.clients.tsx"));
const ClientDetail = lazy(() => import("./routes/_app.clients.$id.tsx"));
const Activities = lazy(() => import("./routes/_app.activities.tsx"));
const Calendar = lazy(() => import("./routes/_app.calendar.tsx"));
const Pipeline = lazy(() => import("./routes/_app.pipeline.tsx"));
const Projects = lazy(() => import("./routes/_app.projects.tsx"));
const Invoices = lazy(() => import("./routes/_app.invoices.tsx"));
const InvoiceDetail = lazy(() => import("./routes/_app.invoices.$id.tsx"));
const Users = lazy(() => import("./routes/_app.users.tsx"));
const Settings = lazy(() => import("./routes/_app.settings.tsx"));
const Notifications = lazy(() => import("./routes/_app.notifications.tsx"));
const Reminders = lazy(() => import("./routes/_app.reminders.tsx"));

const routes = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "signup",
        element: <Signup />,
      },
      {
        path: "reset-password",
        element: <ResetPassword />,
      },
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: "clients",
            element: <Clients />,
          },
          {
            path: "clients/:id",
            element: <ClientDetail />,
          },
          {
            path: "activities",
            element: <Activities />,
          },
          {
            path: "calendar",
            element: <Calendar />,
          },
          {
            path: "pipeline",
            element: <Pipeline />,
          },
          {
            path: "projects",
            element: <Projects />,
          },
          {
            path: "invoices",
            element: <Invoices />,
          },
          {
            path: "invoices/:id",
            element: <InvoiceDetail />,
          },
          {
            path: "users",
            element: <Users />,
          },
          {
            path: "notifications",
            element: <Notifications />,
          },
          {
            path: "reminders",
            element: <Reminders />,
          },
          {
            path: "settings",
            element: <Settings />,
          },
        ],
      },
    ],
  },
];

// In dev Vite serves at root (base: "/"), so no basename is needed.
// In production the build lives under /app/ and is served from the domain root
// by Symfony's HomeController catch-all, so the router matches from / too.
const router = createBrowserRouter(routes);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
