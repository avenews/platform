# Invoice portal review: corrections based on preview 77

Work: #83 and #84. Draft PR #85 targets `stefan` from `stefan-invoice-partner-review`.

## Basis and boundaries

The approved visual/behavioural basis is PR #77 at `4d10fb879c1e3e5b6baf0e7d45778949cf30eb8c`. Product rejected the replacement `features/invoice-review` implementation. This version starts with the complete original tree, then makes additive changes in the original components. No route replacement, new generic table, broad tab interface, global stylesheet change, or new status model is carried forward. Earlier commits remain in history; no shared history is rewritten.

## Invoice Financing

1. Conditional homepage upload action. Compact searchable buyer selection distinguishes who uploads; buyer-managed options are visible but not selectable. The button is absent if none are supplier-managed.
2. Native grouped upload modal. Required relationship/due date/files, add/copy/remove sections, conditional Proof of Delivery, duplicate/type/size validation and delivery declaration with identity/time. Copying does not duplicate files. The chooser uses a bounded result list and supports hundreds of relationships.
3. Buyers retain the original table and actions; buyer-managed uploads have an explicit label.
4. Explanations use the installed design system's compact icon tooltip and the requested dark bubble. No help icon on the uploader or What this means.
5. Original summary-card DOM/CSS retained. Available Financing adds the independently configured total approved supplier limit. What this means uses eligible financing, eligible-period count, approved total limit and outstanding disbursed financing. No invented reservation is introduced.
6. Original `2 payments due`, `1 overdue / 1 upcoming`, original financing statuses and amounts are preserved. Outstanding CTA filters disbursed unpaid periods, not all unpaid invoices or pending requests.
7. Buyer details include relationship terms. Unknown bespoke payment terms are not fabricated: the text defers to the invoice agreement.
8. The original period modal overview, overdue card, details grid, Files, legal snapshot and payment screens remain. An expandable Invoices area at the bottom reuses the actual original Invoices component scoped to the period. No-file records remain and their file action is omitted.
9. Desktop/mobile navigation reads Invoices. The standalone Invoice Financing Invoices page retains its original flat four-record table, statuses and styling; no Upload History tab.
10. The Funds Request list uses the original assessed eligible periods only and has no redundant filtered-list banner.

## Partner Buyer

1. Home uses the original summary card pattern for invoices, payment overview and rebate due. Rebate opens a supplier-by-supplier breakdown.
2. Supplier details include relationship-specific terms.
3. Period invoices appear in an expandable area in the original payment/period modal; same records and table as the standalone partner invoice records.
4. Home and Payments are distinct pages. Home centres on uploads, rebates and payment management; Payments keeps preview 77's Amount due, Payments due and Overdue payments summaries. Both share the original Payments table, filters and pagination. The obsolete bottom three shortcut cards are removed.
5. Redundant Partner Buyer Portal eyebrow labels are removed on Payments, Suppliers and Invoices.
6. Clearing-account details and copy controls are added inside the existing payment modal. Accounts are relationship-specific; no fallback to a generic collections account. Missing details have an explicit contact state. Payment methods appear only when configured.

## Data and integrations (engineering documentation, not repeated customer banners)

This remains the original repository's browser-only design/interaction prototype, not a live CRM, storage or banking application. User asked to remove prototype notices from the customer UI; this does not enable production operations.

- Original financing records and their assessed availability/status snapshot are preserved rather than re-aged by the browser clock. Ksh 970,000 = Ksh 650,000 + Ksh 320,000 across two requestable periods; Ksh 1,300,000 remains disbursed outstanding. The rejected Ksh 292,000 reservation has been removed, not relabelled as a real credit event.
- Approved global limit (Ksh 3,000,000) is an explicit prototype facility configuration. It is not calculated from sub-limits or presented as live approval data outside this prototype.
- Original partner periods, invoice totals, payment statuses and counts remain unchanged: 12 periods, 11 unpaid, Ksh 8,670,000 to pay, one overdue. The previously separate Home payment dataset is not rendered.
- New partner invoice records without files are explicit fixtures linked to the original periods; their counts and invoice values reconcile to those periods. No file is fabricated.
- Rebate examples are a separate collected-principal ledger; rates and amounts are not inferred from invoice values or outstanding payments. Rebate does not reduce supplier obligations.
- Terms are prototype relationship configuration based on the handbook, not imported CRM approvals. Clearing-account identifiers are deliberately non-payable `DEMO-SUP-*` fixtures, not the general Avenews account.
- Native uploads create in-memory records and Blob file links plus a declaration record. They do not call Zoho, send email, parse spreadsheets, create verified invoices or change financing availability. Reload resets local additions. Successful save copy says Invoices added, not that a CRM or bank operation succeeded.
- Existing Funds Request and legal snapshot behaviour is not replaced. Production submission, authorization, signatures, verification and immutable snapshot generation remain integration work.

## Verification

`npm run check` validates the original baseline contract, strict TypeScript and production Angular build.

`node scripts/test-invoice-correction.mjs` verifies original values/statuses, eligibility/counts, ownership, scope, rebates, upload validation/declaration, compact selector scaling and clearing-account separation.

`npx playwright test --config invoice-correction.playwright.config.mjs` exercises the original pages and additive features at 1440x900, 768x1024, 390x844 and 320x720. `REFERENCE_BASE_URL` enables computed-style comparisons against preview 77. `REVIEW_BASE_URL` exercises the deployed preview. Passing automation is not a substitute for inspecting the screenshots.

Leave PR #85 open/Draft. Do not merge or modify `stefan`, `ishai`, `staging` or `main` without explicit approval.
