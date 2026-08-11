# Avenews Platform — Customer Portal

A standalone Angular prototype for Avenews customer and partner portal experiences. Authentication, roles, data, and mutations are mocked so Product, Design, and Engineering can review complete UI flows before real APIs are connected.

## Design workspace

After signing in, open `/design-lab` from the profile menu. It contains the live Avenews token palette, typography, actions, statuses, form controls, cards, read-only details, and the desktop-table/mobile-card pattern used by the portal.

The current Home screen is a design-ready dashboard populated with fictional financing data. Feature routes remain scaffolded for page-by-page reconstruction.

## Design-system package

The app consumes the organization-owned `@avenews/design-system` package at version `1.9.0`.

For local installation, export a GitHub token that can read the private package:

```bash
export NODE_AUTH_TOKEN=<github-token-with-read-packages>
npm install --legacy-peer-deps
```

Do not commit the token. Netlify must receive the same value as a secret `NODE_AUTH_TOKEN` build environment variable.

## Local development

```bash
npm start
```

Open `http://localhost:4200`.

## Validation

```bash
npm run check
```

## Branch and deployment workflow

- Create feature branches from `staging`.
- Open pull requests into `staging`; Netlify creates a Deploy Preview for each PR.
- Merge approved work into `staging` for the stable staging deployment.
- Promote with a pull request from `staging` into `main`.
- `main` is the Netlify production branch.

## Current routes

- `/` — design-ready Home dashboard
- `/available-financing` — scaffold
- `/financing-activity` — scaffold
- `/invoices` — scaffold
- `/manage-users` — scaffold, admin only
- `/support` — scaffold
- `/profile` — scaffold
- `/design-lab` — internal component and pattern workspace

See [`docs/DESIGN_WORKFLOW.md`](docs/DESIGN_WORKFLOW.md) for source hierarchy, ownership boundaries, responsive checks, and terminology notes.
