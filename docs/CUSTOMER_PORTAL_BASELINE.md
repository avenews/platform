# Customer Portal Baseline Contract

This document locks the signed-in customer portal baseline while `avenews/platform` is being rebuilt in Angular. The purpose of this phase is faithful reproduction, not redesign.

## Source hierarchy

Use these sources in order:

1. `avenews/avenews-crm-portals-temp/apps/customer-portal` is the primary source for customer-facing structure, navigation, labels, responsive behaviour, interactions, cards, tables, menus, modal types, empty states, and mock data.
2. `apps/affiliate-portal` and `apps/asfo-buyer-portal` are implementation references only where their Angular shell patterns help reproduce the customer portal accurately.
3. The Avenews Handbook controls approved visible product terminology.
4. `@avenews/design-system` supplies the Angular components, tokens, and general icon catalogue, except where this contract explicitly locks source-portal artwork.

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

Navigation icons are not approximate. The React source uses `lucide-react` 1.14.0 at 16 px with a 2 px stroke. The Angular shell therefore renders the **exact Lucide artwork** for these six customer-navigation glyphs rather than substituting a similarly named design-system glyph. The semantic key remains stable so the navigation contract is easy to audit.

| Destination | Customer source | Angular semantic key | Desktop sidebar | Mobile bottom nav |
|---|---|---|---:|---:|
| Home | `Home` | `home` | Yes | Yes |
| Available Financing | `Wallet` | `wallet` | Yes | Yes |
| Financing Activity | `BarChart3` | `bar-chart` | Yes | Yes |
| Invoices & Documents | `Receipt` | `receipt` | Yes | Yes |
| Support | `HelpCircle` | `help-circle` | Yes | No; available from profile menu |
| Manage Users | `User` | `person` | Admin only, visually separated | No; admin only in profile menu |

The profile-footer chevron uses the design-system `chevron-up` icon because it is not part of the locked customer navigation set.

Changing an icon, label, order, destination, geometry, stroke width, or icon size requires a dedicated issue and explicit approval. Never silently substitute a related glyph or newer artwork for the source customer-portal icon.

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
- `/available-financing` — Available Financing
- `/available-financing/:id` — Available Financing detail
- `/financing-activity` — Financing Activity
- `/invoices` — Invoices & Documents
- `/support` — Support
- `/manage-users` — Manage Users (admin)
- `/profile` — Profile

## Required responsive audit viewports

At minimum, validate the signed-in shell and each route at:

- `1440 × 900` — desktop
- `768 × 1024` — tablet / breakpoint boundary
- `390 × 844` — typical mobile
- `320 × 720` — minimum supported mobile width

The automated responsive audit is a regression guard, not a replacement for visual comparison with the current customer portal.
