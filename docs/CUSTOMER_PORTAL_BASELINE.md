# Customer Portal Baseline Contract

This document locks the signed-in customer portal baseline while `avenews/platform` is being rebuilt in Angular. The purpose of this phase is faithful reproduction, not redesign.

## Source hierarchy

Use these sources in order:

1. `avenews/avenews-crm-portals-temp/apps/customer-portal` is the primary source for customer-facing structure, navigation, labels, responsive behaviour, interactions, cards, tables, menus, modal types, empty states, and mock data.
2. `apps/affiliate-portal` and `apps/asfo-buyer-portal` are implementation references only where their Angular shell patterns help reproduce the customer portal accurately.
3. The Avenews Handbook controls approved visible product terminology.
4. `@avenews/design-system` supplies the Angular components, tokens, and supported icon catalogue.

Do not replace a supported customer-portal pattern merely because a different pattern looks cleaner or is easier to implement.

## Pull-request lock

The baseline PR must remain a **Draft** until all of the following are true:

- the listed signed-in routes are implemented rather than scaffolded;
- navigation and responsive checks pass;
- standard Angular checks pass;
- the current Netlify Deploy Preview is tied to the exact PR head;
- desktop, tablet, and mobile review findings are recorded;
- the requester explicitly approves making the PR ready for review or merging it.

Do not merge the baseline PR into `staging` or `main` without explicit approval.

## Navigation contract

Navigation icons are not approximate. The React source uses Lucide icons; the Angular app must use the equivalent supported Avenews icon name shown below.

| Destination | Customer source | Angular/Avenews icon | Desktop sidebar | Mobile bottom nav |
|---|---|---|---:|---:|
| Home | `Home` | `home` | Yes | Yes |
| Available Financing | `Wallet` | `wallet` | Yes | Yes |
| Financing Activity | `BarChart3` | `bar-chart` | Yes | Yes |
| Invoices & Documents | `Receipt` | `receipt` | Yes | Yes |
| Support | `HelpCircle` | `help-circle` | Yes | No; available from profile menu |
| Manage Users | `User` | `person` | Admin only, visually separated | No; admin only in profile menu |

The profile-footer chevron uses `chevron-up`.

Changing an icon, label, order, or destination requires a dedicated issue and explicit approval. Never silently substitute `cash` for `bar-chart`, `users` for `person`, or another merely related glyph.

## Responsive shell contract

### Mobile: below 768 px

- Show the 56 px mobile toolbar with the Avenews wordmark at 24 px high and the profile avatar at the trailing edge.
- Hide the desktop sidebar.
- Keep page content centered to a maximum width of 840 px.
- Show exactly four bottom-navigation destinations: Home, Available Financing, Financing Activity, and Invoices & Documents.
- Bottom-navigation items use 16 px icons, may wrap labels to two lines, and use a primary-subtle background plus primary icon/text colour when active.
- Account, Support, Manage Users, and Log out remain in the avatar/profile menu as allowed by role.
- Controls and pagination targets are at least 44 px high.
- Data tables change to the corresponding mobile-card layouts below 768 px.
- The page must not create horizontal document overflow at supported mobile widths.

### Desktop and tablet: 768 px and wider

- Hide the mobile toolbar and bottom navigation.
- Show the fixed 240 px sidebar.
- Keep the content area to a maximum width of 1200 px and center it within the post-sidebar space on wide screens.
- Sidebar navigation rows are 48 px high with 16 px icons.
- The active item uses a 3 px primary left border, primary-subtle fill, and primary text/icon colour.
- Manage Users is admin-only and separated from the main navigation group.
- The profile identity is anchored at the bottom of the sidebar, and its menu opens above the trigger.
- Tables remain visible and horizontally scroll only within their table wrapper when necessary; the page itself must not overflow horizontally.

## Cross-route responsive contract

| Pattern | Desktop/tablet | Mobile |
|---|---|---|
| Home summary metrics | Three columns down to 481 px | One column at 480 px and below |
| List pages | Data table | Record cards |
| Filter toolbars | Inline/wrapping controls; search may align right | One full-width control per row |
| Support | Two cards from 768 px | One-column card stack |
| Profile | Two-column card grid from 768 px | One-column card stack |
| Manage Users invite form | First/last name side-by-side | Still side-by-side until 400 px; then stack |
| Invite/confirm dialogs | Centered dialog | Centered, viewport-contained dialog |
| Credit-line action flow | Dialog/sheet as designed | Bottom sheet only for the action flow |
| Data-list label/value rows | Compact paired rows | Paired rows where space allows; stack only on very narrow screens |

## Routes covered by the baseline

The parity audit covers:

- `/` — Home
- `/available-financing`
- `/available-financing/:id`
- `/financing-activity`
- `/invoices`
- `/support`
- `/manage-users` for admin sessions
- `/profile`

Login and verification remain part of the wider customer-portal flow, but this contract focuses on the signed-in baseline and shared shell.

## Required review widths

At minimum, review each signed-in route at:

- 1440 × 900 — desktop
- 768 × 1024 — tablet/breakpoint boundary
- 390 × 844 — common mobile
- 320 × 720 — minimum supported width smoke check

For each route, verify visible hierarchy, navigation state, table/card switching, control wrapping, modal/menu placement, tap targets, and horizontal overflow.

## Automated safeguards

`npm run check:baseline` statically validates the locked navigation mapping, responsive breakpoints, Home summary hand-off query parameters, baseline documentation, and the absence of known approximate icon substitutions.

The GitHub responsive-audit workflow launches the Angular application in Chromium and checks the shared shell and all signed-in routes at representative desktop, tablet, and mobile viewports. It also uploads screenshots and a Playwright report for review.

Automated checks do not replace visual review of the current Netlify Deploy Preview.

## Change-control rule

Once this baseline is accepted, improvements should be made through new issues and focused PRs. A later improvement may intentionally depart from this contract, but the PR must:

1. identify the baseline behaviour being changed;
2. explain why the deviation is intentional;
3. include desktop and mobile evidence;
4. receive explicit review approval.
