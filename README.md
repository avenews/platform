# Avenews Platform — Customer Portal

A standalone Angular prototype for Avenews customer and partner portal experiences. Authentication, roles, data, and mutations are mocked so Product, Design, and Engineering can review complete UI flows before real APIs are connected.

## Design workspace

After signing in, open `/design-lab` from the profile menu. It contains the live Avenews token palette, typography, actions, statuses, form controls, cards, read-only details, and the desktop-table/mobile-card pattern used by the portal.

The current Home screen is a design-ready dashboard populated with fictional financing data. Feature routes remain scaffolded for page-by-page reconstruction.

## Design-system package

The app consumes the organization-owned `@avenews/design-system` package at version `1.9.0`.

For now, `package.json` installs the exact official npm package artifact from:

```text
vendor/avenews-design-system-1.9.0.tgz
```

The artifact was produced by `npm pack` in `avenews/Avenews-Ionic-Design-System`, not assembled or edited in this repository. Its provenance and SHA-256 digest are documented in [`vendor/README.md`](vendor/README.md).

This bridge keeps local, GitHub Actions, and Netlify builds deterministic without distributing a private package token. Once GitHub Packages access is standardized for consuming repositories, the dependency can return to a registry version without changing application imports.

## Local development

```bash
npm install --legacy-peer-deps
npm start
```

Open `http://localhost:4200`.

## Validation

```bash
npm run check
```

## Branch and deployment workflow

The deployment source of truth is [`docs/DEPLOYMENT_WORKFLOW.md`](docs/DEPLOYMENT_WORKFLOW.md).

In summary:

- Create feature branches from `staging`.
- Open pull requests into `staging`; Netlify creates a Deploy Preview for each PR once GitHub continuous deployment is connected.
- Review the current Netlify Deploy Preview before merge and include its URL in the delivery response.
- Merge approved work into `staging` for the stable staging deployment.
- Promote with a pull request from `staging` into `main`.
- `main` is the Netlify production branch and is not used merely to generate previews.
- Do not merge into `staging` or `main` without explicit approval.

Repository agents must also follow [`AGENTS.md`](AGENTS.md), which makes these deployment and preview-verification rules mandatory for agent-driven changes.

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
