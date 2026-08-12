# Avenews Platform — Customer Portal

A standalone Angular prototype for Avenews customer and partner portal experiences. Authentication, roles, data, and mutations are mocked so Product, Design, and Engineering can review complete UI flows before real APIs are connected.

## Customer portal baseline

The signed-in Angular experience is being held to the current `apps/customer-portal` implementation as a baseline before further improvement work begins.

Read [`docs/CUSTOMER_PORTAL_BASELINE.md`](docs/CUSTOMER_PORTAL_BASELINE.md) before changing navigation, screen hierarchy, responsive behaviour, cards, tables, menus, or modal types. It defines the exact navigation icon mapping, 768 px shell breakpoint, route coverage, responsive review widths, and change-control rules.

## Design workspace

After signing in, open `/design-lab` directly. It contains the live Avenews token palette, typography, actions, statuses, form controls, cards, read-only details, and the desktop-table/mobile-card pattern used by the portal.

The design lab is internal and is not part of the customer navigation baseline.

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

The baseline-only static guard can also be run independently:

```bash
npm run check:baseline
```

Pull requests also run a Chromium responsive audit at 1440 × 900, 768 × 1024, 390 × 844, and 320 × 720 and upload screenshots for review.

## Work intake, branch and deployment workflow

The deployment and work-intake source of truth is [`docs/DEPLOYMENT_WORKFLOW.md`](docs/DEPLOYMENT_WORKFLOW.md).

In summary:

- Every new piece of work starts with a GitHub Issue before implementation begins.
- Use one issue for a small, self-contained change.
- Break larger work into multiple logical, independently reviewable issues before creating implementation branches.
- Check existing open issues and pull requests before starting to avoid duplicate work.
- Create feature branches from `staging` and reference the relevant issue in the branch/PR workflow.
- Open pull requests into `staging`; Netlify creates a Deploy Preview for each PR.
- Review the current Netlify Deploy Preview before merge and include its URL in the delivery response.
- Merge approved work into `staging` for the stable staging deployment.
- Promote with a pull request from `staging` into `main`.
- `main` is the Netlify production branch and is not used merely to generate previews.
- Do not merge into `staging` or `main` without explicit approval.

Repository agents must also follow [`AGENTS.md`](AGENTS.md), which makes issue-first intake, baseline preservation, deployment, and preview verification mandatory.

## Current routes

- `/` — Home
- `/available-financing` — available financing list
- `/available-financing/:id` — financing-line detail and prototype actions
- `/financing-activity` — financing periods, filters, search, and responsive cards
- `/invoices` — invoices and documents
- `/manage-users` — admin-only user and invitation management
- `/support` — support request and quick help
- `/profile` — personal, business, and access information
- `/design-lab` — internal component and pattern workspace

See [`docs/DESIGN_WORKFLOW.md`](docs/DESIGN_WORKFLOW.md) for design and implementation ownership rules.
