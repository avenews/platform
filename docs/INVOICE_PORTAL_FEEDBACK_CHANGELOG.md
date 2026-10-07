# Invoice Portal Product Feedback Changelog

## Scope

This changelog belongs only to Draft PR #87 and branch `stefan-invoice-portal-product-feedback`.

Baseline for comparison and rollback:
- PR #86
- Deploy preview 86
- Baseline commit: `1569db76b0b13efffd624db9c64d420380a47212`

PR #86 and deploy preview 86 must remain unchanged.

## Working rules

1. Implement only the agreed Invoice Financing and Partner Buyer Portal feedback.
2. Work in the five confined passes below.
3. Add a completed summary, files changed, behaviour changed, validation performed, and known limitations after each pass.
4. Do not begin the next pass until the previous pass is recorded here.
5. Funds Requests remain external in the real product. In this prototype, Request funds only shows a toast explaining that the request continues in the CRM-provided Zoho Form. No external link integration is added.
6. Keep this PR Draft and do not merge without explicit Product approval.

## Pass 1: Data foundation and status model

Status: Completed; validated in Pass 5

Issue: #88

Summary:
- Replaced the undefined customer-facing payment status `Payment processing` with the supported `Due` state.
- Payment statuses are now `Upcoming`, `Due`, `Overdue`, and `Paid`.
- Split supplier financing-period filters into separate `Financing period status` and `Payment status` filters.
- Increased Partner Buyer Suppliers pagination from 5 to 10 rows per page.
- Increased Partner Buyer Payments pagination from 6 to 10 rows per page.
- Kept existing invoice, financing activity, available financing, customer invoice, and supplier period tables at their existing 10-row minimum.
- Added explicit shared type boundaries for invoice review, financing availability, and upload processing statuses so later passes do not reuse one generic status model.

Files changed:
- `src/app/core/experience/partner-workspace.data.ts`
- `src/app/features/partner-workspace/partner-workspace.component.ts`
- `src/app/features/partner-workspace/partner-workspace.component.html`
- `src/app/core/experience/invoice-portal.data.ts`

Validation:
- Source transformations were re-read from the branch after commit.
- PR #87 remains Draft.
- GitHub workflow `Invoice Financing refinements` was triggered for the Pass 1 head but completed as `skipped`; it is not being reported as passed.
- Local clone/build could not run because the execution container could not resolve github.com.
- Netlify Deploy Preview validation remains required before final review.

Known limitations:
- Page size is fixed at 10 in this pass. A selectable 10 / 25 / 50 control is optional and not required for the agreed minimum.
- The remaining payment, invoice, financing availability, and support behaviour is intentionally deferred to later passes.

## Pass 2: Invoice upload and lifecycle

Status: Completed; validated in Pass 5

Issue: #89

Summary:
- Added separate manual and automatic invoice processing modes.
- Counterparty Buyer uploads use the manual path. The current Partner Buyer portal uses automatic processing.
- Manual sections keep one buyer and shared due date, with invoice number, full invoice amount and one attachment per invoice.
- Removed any need for invoice issue date or partially paid invoice fields.
- Blocked overdue invoice due dates while allowing future dates beyond 60 days.
- Added duplicate invoice number and duplicate invoice file checks.
- Manual submissions create locked invoice records with `Awaiting review` status.
- Automatic Partner Buyer uploads accept up to 20 invoice or bulk files, can represent multiple suppliers and due dates, and do not ask the user to confirm extracted values.
- Automatic submissions enter `Processing`; successful extraction and validation is described as direct invoice approval and period creation/update, without implying Funds Request submission or disbursement.
- Fixed buyer selection safety so typed search text clears a stale committed selection until a valid buyer is explicitly selected again, while preserving entered invoice data and files.
- Post-submission correction, replacement and withdrawal actions are intentionally omitted. The receipt tells users to contact support when submitted data is wrong.

Files changed:
- `src/app/core/experience/invoice-portal.data.ts`
- `src/app/shared/invoice-upload.component.ts`
- `src/app/shared/invoice-upload.component.html`
- `src/app/shared/invoice-upload.component.css`
- `src/app/shared/invoice-party-select.component.ts`

Validation:
- Netlify Deploy Preview 87 is building against the exact Pass 2 head.
- Existing repository CI remains branch-gated to the previous PR86 branch and is not being reported as passed.
- Full browser-test updates are deferred until the final QA pass so intermediate pass changes stay confined.

Known limitations:
- The browser-only prototype does not run real OCR. Automatic uploads therefore demonstrate the processing state and expected outcomes without inventing extracted invoice values.
- Contextual support routing for failed processing is implemented in Pass 4.

## Pass 3: Financing eligibility and Funds Request behaviour

Status: Completed; validated in Pass 5

Issue: #90

Summary:
- Funds Request actions for Invoice Financing no longer present an in-portal request form.
- Request actions show a toast explaining that the real Funds Request continues in the CRM-provided Zoho Form and show the amount currently available to request.
- No Zoho URL integration was added.
- New Funds Requests are blocked only when the same supplier and buyer relationship has an overdue unsettled financing period.
- Other buyer relationships remain independent, and invoice upload remains available while a relationship is blocked.
- Relationship and financing-period UI now explains `Blocked by overdue payment` instead of showing an unexplained unavailable state.
- Added date-window metadata for newly submitted invoices: invoices more than 60 days ahead are valid but `Not yet available`; the financing window opens 60 days before due date; the cutoff state applies inside the final 6 days.
- Overdue invoice uploads remain blocked.
- Added supplier-only `Request cancellation` for active, unfunded Invoice Financing periods. It routes to Support rather than deleting invoices, periods or other Funds Requests.
- Financed periods do not expose the normal cancellation action.

Files changed:
- `src/app/core/experience/invoice-portal.data.ts`
- `src/app/core/experience/financing-documents.data.ts`
- `src/app/features/contextual-financing/contextual-financing.component.ts`
- `src/app/features/contextual-financing/contextual-financing.component.html`
- `src/app/features/funds-request-hub/funds-request-hub.component.ts`
- `src/app/features/invoice-period/invoice-period.component.ts`
- `src/app/features/invoice-period/invoice-period.component.html`
- `src/app/shared/customer-financing-period-modal.component.ts`

Validation:
- Source logic is confined to Invoice Financing request and eligibility paths.
- Netlify exact-head validation remains required before final review.
- Full browser and regression validation is deferred to Pass 5.

Known limitations:
- The support screen consumes and displays cancellation context in Pass 4.
- Financing eligibility for existing historical demo fixtures remains fixture-driven; current-date calculations are applied to newly submitted invoice due dates so the prototype does not silently rewrite the baseline history.

## Pass 4: Partner Buyer payments, visibility, support and rebates

Status: Completed; validated in Pass 5

Issue: #91

Summary:
- Removed supplier Max Financing, Financing Used, advance rate, daily markup, financing tenor and Funds Request cutoff from Partner Buyer supplier details.
- Retained Financing Available because it helps the buyer understand whether the supplier can still access financing for that relationship.
- Partner Buyer payment details now separate Amount due, Amount received and Remaining amount.
- Added a partial-payment demo state so remaining balances are visible without introducing a payment workflow.
- Paid periods now show the amount received and paid date, show zero remaining, and no longer display active clearing-account instructions.
- Unpaid payment details identify the destination as the named supplier Clearing Account managed by Avenews.
- No Pay, Mark as paid, proof-of-payment or dispute workflow was added.
- Upload processing problems and payment questions now route to the existing Support experience.
- Support accepts contextual record data through query parameters, displays a visible `About` reference, and carries invoice, financing-period, payment, upload, supplier, buyer and relationship context as hidden form fields.
- Added `Request cancellation` and `Invoice processing issue` support topics alongside the existing payment and invoice topics.
- Preserved the existing shared rebate ledger and its principal-collected basis. Rebate figures remain separate from supplier financing calculations.

Files changed:
- `src/app/core/experience/partner-workspace.data.ts`
- `src/app/core/experience/invoice-portal.data.ts`
- `src/app/features/partner-workspace/partner-workspace.component.ts`
- `src/app/features/partner-workspace/partner-workspace.component.html`
- `src/app/features/partner-workspace/partner-workspace.component.css`
- `src/app/shared/clearing-account-details.component.ts`
- `src/app/features/support/support.component.ts`
- `src/app/features/support/support.component.html`
- `src/app/features/support/support.component.css`

Validation:
- Payment totals now use remaining unpaid balances rather than full original amounts after partial receipt.
- Paid payment records are prevented from showing active clearing-account details in the Partner Buyer modal.
- Netlify exact-head validation and browser regression remain required in Pass 5.

Known limitations:
- Support submission remains the existing browser-only simulated support action. The contextual fields are ready for a real support integration but are not transmitted to a backend in this prototype.
- Payment receipt values are demo fixture data, not live bank matching.

## Pass 5: Cross-portal reconciliation and QA

Status: Completed and validated

Issue: #92

Summary:
- Reconciled Partner Buyer headline metrics, invoice counts and payment balances against the shared invoice, period and receipt fixtures.
- Replaced the old hard-coded Partner Home invoice metric with the reconcilable `Invoices in financing periods` metric and made agreed attention states actionable.
- Kept invoice review status separate from financing availability so an uploaded invoice can be `Awaiting review` without implying a financing period or Funds Request exists.
- Applied relationship-level overdue blocks consistently to supplier and Partner Buyer views without blocking unrelated buyer relationships or invoice upload.
- Standardized the visible payment destination around the named supplier Clearing Account managed by Avenews.
- Added contextual Support entry points from invoice rows and Invoice Financing periods. These carry the relevant record reference without adding disputes, editing or in-portal correction workflows.
- Kept rebate reporting on the shared principal-collected ledger and raised the default rebate page to the agreed 10-row minimum.
- Fixed minimum-mobile overflow for the long `Blocked by overdue payment` status and kept three financing-period actions aligned on desktop while stacking correctly on mobile.
- Updated repository browser coverage to the manual Counterparty Buyer flow and automatic Partner Buyer processing flow, including buyer-selection safety, POD preservation, payments, rebates, contextual support and 320px layout.
- Kept PR #86 and Deploy Preview 86 as the untouched regression baseline.

Files changed:
- `src/app/core/experience/invoice-portal.data.ts`
- `src/app/core/experience/partner-workspace.data.ts`
- `src/app/features/contextual-home/contextual-home.component.ts`
- `src/app/features/contextual-financing/contextual-financing.component.css`
- `src/app/features/customer-invoices/customer-invoices.component.ts`
- `src/app/features/partner-workspace/partner-workspace.component.ts`
- `src/app/features/partner-workspace/partner-workspace.component.html`
- `src/app/features/support/support.component.ts`
- `src/app/shared/customer-financing-period-modal.component.ts`
- `src/app/core/experience/partner-rebates.data.ts`
- `scripts/test-invoice-correction.mjs`
- `tests/invoice-correction/correction.spec.ts`
- `tests/invoice-refinements/refinements.spec.ts`
- `tests/invoice-refinements/double-check.spec.ts`
- `tests/invoice-refinements/rebates.spec.ts`
- `tests/invoice-refinements/polish.spec.ts`
- `.github/workflows/invoice-review.yml`

Validation:
- Final validated application head before this changelog-only commit: `7d59b3edc03e5899ab7bddc9654ab8557712de8b`.
- Baseline preservation, TypeScript checks and the production build passed.
- 20 invoice correction domain checks passed.
- Local browser regression against preserved Preview 86: 40 / 40 passed across desktop, tablet, mobile and 320px minimum mobile.
- Local refinement suite: 164 / 164 passed across the same four viewport classes.
- Netlify resolved Deploy Preview 87 to the exact validated application head.
- Deployed baseline regression on Preview 87: 40 / 40 passed.
- Deployed refinement suite on Preview 87: 164 / 164 passed.
- The first deployed refinement attempt had two mobile navigation/font-load timeouts while 162 / 164 tests passed. Re-running the same unchanged head completed all checks successfully, confirming those two failures were transient deployment/network timing rather than application assertions.
- Source audit found no new em dash characters, no customer-facing `Payment processing` state and no Invoice Financing Funds Request URL integration.
- PR #86 remains open, Draft, unmerged and unchanged at `1569db76b0b13efffd624db9c64d420380a47212`.
- PR #87 remains open, Draft and unmerged.

Known limitations:
- This remains a browser-only prototype. Automatic Partner Buyer processing demonstrates processing and expected outcomes without live OCR or backend extraction.
- Support submission remains simulated and payment receipt values remain demo fixture data.
- Invoice Financing Funds Requests still only explain the CRM-provided Zoho Form handoff; no production URL or external integration is invented here.
- No buyer Pay, Mark as paid, proof-of-payment or dispute workflow has been added.
- No supplier post-submission invoice editing, replacement or withdrawal workflow has been added. Incorrect submitted data is routed to Support.



## Follow-up review: in-modal support and payment detail cleanup

Status: Completed and validated

Issue: #93

Summary:
- Kept financing-period support requests inside the active modal instead of navigating to the Support page.
- Changed supplier cancellation requests to open the same in-modal support form with the cancellation topic preselected.
- Removed Contact support from invoice rows and cards. Invoice actions now only open the invoice file when a file exists.
- Removed the standalone Invoice question topic from the general Support page.
- Allowed long status pills to wrap instead of forcing table width.
- Removed duplicate buyer payment destination wording and removed the phrase "(managed by Avenews)" from the Clearing Account heading.
- Kept supplier identifiers such as `SUP-0133` as normal secondary metadata. Financing period references such as `PER-2026-08-15-COAST` remain the financing record references.
- Added the logged-in supplier Clearing Account details to the Invoice Financing buyer-payment view so the supplier can easily share bank details with the buyer.
- Added separate in-app Developer Changelog entries for PR87 Passes 1 through 5 and this follow-up.

Files changed:
- `src/app/shared/contextual-support-form.component.ts`
- `src/app/shared/customer-financing-period-modal.component.ts`
- `src/app/shared/clearing-account-details.component.ts`
- `src/app/core/experience/invoice-portal.data.ts`
- `src/app/features/partner-workspace/partner-workspace.component.ts`
- `src/app/features/partner-workspace/partner-workspace.component.html`
- `src/app/features/partner-workspace/partner-workspace.component.css`
- `src/app/features/customer-invoices/customer-invoices.component.ts`
- `src/app/shared/customer-portal-baseline.css`
- `src/app/features/support/support.component.ts`
- `src/app/features/support/support.component.html`
- `src/app/shared/staging-changelog.data.ts`

Validation:
- Validated application head: `038a44f8f6481ce7cf810de22aa63a300e485001`.
- Baseline preservation, TypeScript and production build passed.
- 20 domain checks passed.
- Local browser checks: 44 baseline checks and 168 refinement checks passed.
- Deployed Preview 87 checks: the same 44 baseline checks and 168 refinement checks passed.
- Desktop, tablet, mobile and 320px minimum-mobile viewports are covered.
- PR #86 remains untouched as the rollback baseline.


## Follow-up review: clearing account copy cleanup

Status: Completed and validated

Issue: #94

Summary:
- Changed the supplier Invoice Financing buyer-payment view heading from the supplier business name to `Your clearing account details`.
- Removed the standalone `Copy payment reference` button from Partner Buyer payment details.
- Kept one payment reference and one copy control inside the Clearing Account details component.
- Added this follow-up to the in-app Developer Changelog before validation.

Files changed:
- `src/app/shared/clearing-account-details.component.ts`
- `src/app/shared/customer-financing-period-modal.component.ts`
- `src/app/features/partner-workspace/partner-workspace.component.html`
- `src/app/features/partner-workspace/partner-workspace.component.ts`
- `src/app/shared/staging-changelog.data.ts`

Validation:
- Validated application head: `a1ab552f2ae82114aff35a055bc34f04f72b3c08`.
- Baseline preservation, TypeScript and production build passed.
- 20 domain checks passed.
- Local browser checks: 44 baseline checks and 168 refinement checks passed.
- Deployed Preview 87 checks: the same 44 baseline checks and 168 refinement checks passed.
- Desktop, tablet, mobile and 320px minimum-mobile viewports are covered.
- PR #86 remains untouched as the rollback baseline.
