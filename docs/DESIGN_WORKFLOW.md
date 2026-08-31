# Customer portal design workflow

This repository is the standalone Angular design and interaction prototype for Avenews customer and partner portal experiences.

## Source hierarchy

1. **Visual and behavioural acceptance reference:** `avenews/avenews-crm-portals-temp`, especially `apps/customer-portal`.
2. **Angular implementation references:** `apps/affiliate-portal` and `apps/asfo-buyer-portal` in the same reference repository.
3. **Component and token source:** `avenews/Avenews-Ionic-Design-System`, consumed as the versioned `@avenews/design-system` package.
4. **Product language and product rules:** the current Avenews Handbook. Product behaviour not supported by the portal reference or Handbook must be called out rather than invented.

## Working loop

1. Branch from `staging` using `feature/<scope>`.
2. Build or adjust one coherent customer journey.
3. Use `/design-lab` to review tokens, controls, cards, statuses, and responsive data patterns.
4. Check the experience at 375 px, 768 px, 1280 px, and 1440 px.
5. Cover populated, empty, loading, error, filtered, admin, and standard-user states where applicable.
6. Open a pull request into `staging` and review the Netlify Deploy Preview.
7. Promote approved work from `staging` to `main`.

## Ownership boundaries

- The design system owns reusable components and the CSS emitted by those components.
- The portal owns page composition, domain language, responsive information hierarchy, and product-specific patterns.
- Portal tables may remain hand-authored while they rely on rich headers, sticky treatment, row emphasis, and responsive card equivalents that the generic data-table component does not yet cover.
- Do not copy design-system component source into this repository. Add or fix reusable components in the design-system repository and consume a new version here.

## Current terminology checkpoint

The Handbook uses both `Invoice Financing (INF)` and `Supplier Financing` for the unified former ASF/ASFO product, and both `INFX` and `SFX` appear in different sections for the express product. The prototype currently uses **Supplier Financing (INF)** and **Supplier Financing Express (SFX)** as working labels. Product should confirm the final customer-facing labels before release.

## Prototype data

All amounts, businesses, people, dates, documents, and statuses in this repository are fictional unless explicitly documented otherwise. No prototype action calls a bank, CRM, production API, or real customer system.
