# Avenews Platform — Customer Portal

A standalone Angular prototype for the Avenews customer portal. The application is intentionally frontend-only for now: authentication, roles, data, and mutations are mocked so product and engineering can review complete UI flows before real APIs are connected.

## Local development

```bash
npm install
npm start
```

Open `http://localhost:4200`.

## Validation

```bash
npm run typecheck
npm run build
```

## Branch and deployment workflow

- Create feature branches from `staging`.
- Open pull requests into `staging`; Netlify creates a Deploy Preview for each PR.
- Merge approved work into `staging` for the stable staging deployment.
- Promote with a pull request from `staging` into `main`.
- `main` is the Netlify production branch.

## Current foundation

The repository contains a root Angular application, mock authentication and role guards, a responsive portal shell, and route foundations for Home, Available Financing, Financing Activity, Invoices & Documents, Manage Users, Support, and Profile.

The next implementation step is to reconstruct the existing customer portal screen by screen, using the Angular affiliate and ASFo portals as implementation references and the existing React customer portal as the visual and behavioral acceptance reference.

## Design system

The organization-owned `avenews/Avenews-Ionic-Design-System` repository remains the canonical design-system source. Its versioned Angular package will be added once the Netlify build has a read-only package credential; no design-system source should be copied into this repository.
