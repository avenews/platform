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

Status: Implemented, deploy validation pending

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

Status: Implemented, deploy validation pending

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

Status: Not started

## Pass 4: Partner Buyer payments, visibility, support and rebates

Status: Not started

## Pass 5: Cross-portal reconciliation and QA

Status: Not started
