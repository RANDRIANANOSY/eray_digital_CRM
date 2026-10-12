# Routes

L'application utilise **React Router v7** avec une configuration déclarative.

Le routage est défini dans `src/App.tsx` (`createBrowserRouter`).
Les composants de pages vivent dans ce dossier `src/routes/`,
et les layouts sont `src/routes/root.tsx` (racine) et `src/routes/_app.tsx`
(layout authentifié : sidebar + topbar).

## Conventions

| Fichier                 | URL                    |
| ----------------------- | ---------------------- |
| `_app.index.tsx`        | `/`                    |
| `_app.clients.tsx`      | `/clients`             |
| `_app.clients.$id.tsx`  | `/clients/:id`         |
| `_app.reminders.tsx`    | `/reminders`           |
| `_layout.tsx`           | layout route           |

Ajouter une route = créer un fichier dans `src/routes/` **et** le déclarer
dans `src/App.tsx` ainsi que dans la navigation `src/components/app-sidebar.tsx`.