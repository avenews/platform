# Invoice Financing refinements from PR #85

Issue: #83. Shared uploader/modal fixes also relate to #84.
Baseline and fallback: PR #85 / `da90e73d33f11a09864bca968518b6b1fa6a2b20`.
Branch: `stefan-invoice-financing-refinements`; Draft PR #86 targets `stefan`.
The fallback branch `stefan-invoice-partner-review` must remain unchanged. Do not merge without explicit approval.

## Confirmed acceptance mapping

1. New branch, Draft PR and independent preview; #85 preserved.
2. Keep existing card/table styles, lifecycle statuses and financing figures. No Partner Home/Payments redesign.
3. Lucide arrow-left artwork in existing Back controls; no navigation-icon substitutions.
4. Right-aligned values in paired settlement rows; label-above-value grids unchanged.
5. Scroll to top when the destination pathname changes; in-page filters, queries and modals retain their position.
6. Modal primary/secondary actions share a desktop row and stack on mobile. A single action fills the row.
7. Open the grouped invoice form directly, without the preliminary chooser. Buyer-context actions preselect that buyer.
8. Fixed-position, bounded dropdown does not resize its modal. Search is separate from selection; it retains the committed buyer, POD and confirmation until another permitted buyer is selected. Helper text is stable. 500-party domain test; 30-result rendering cap with search guidance.
9. Vertically centered 16px chevron-down matches the existing table-filter artwork.
10. Dashed file-selection area for invoices and POD, with upload icon, native accessible file input and named remove actions.
11. PDF/JPG/JPEG/PNG/XLS/XLSX/CSV invoice files supported for both roles. POD accepts PDF/images. Existing 10 MB, 10-file and 20-section limits retained.
12. Uploader Instructions explain same buyer/supplier and due date per section, conditional POD and Add another section.
13. Delivery/dispute confirmation includes Privacy Notice acknowledgement. Exact supplied links open separately. Funds Request terms remain clearly distinguished from the invoice-upload declaration. Confirmation timestamp, actor, acknowledgement and document URLs are recorded in the session receipt. User-supplied regulatory/footer copy is separate.
14. Success explains review, eligible/approved invoices creating or updating the matching period, and funds requests only when availability and the FR window permit. Role-aware wording, View invoices and Done actions.
15. Card filters appear in the existing controls and a small clearable summary. Clear filters clears the active scope as well as search/sort. Search and sort preserve the selected scope. Available to request is a filter option, not a lifecycle status. Funds Request stays eligible-only.
16. Buyer uploads invoices is an aligned, noninteractive outlined note, not a misleading enabled action.
17. Period-level headings and tooltip use Invoice(s) Due Date. The standalone invoice-table structure and original records are unchanged.
18. Buyer/partner detail grids retain intrinsic content height inside a scrolling modal body. Settlement spans the two desktop columns and full mobile width.

## Source and integration boundaries

The Avenews Handbook sections 10.7, 10.8, 10.10 and 10.12 govern the review/grouping/eligibility explanation. Do not create approved financing eligibility from an upload or invent reservations. The existing figures remain Ksh 970,000 available, Ksh 1,300,000 outstanding and 2 payments due (1 overdue / 1 upcoming).

Product supplied:
- Funds Request Terms: https://docs.google.com/document/d/1sKfI46A5zjWpzkHsXXOoefbcRB3XK2eha_h0VjteOTM/edit?tab=t.0#heading=h.t4m1vp8ushhx
- Privacy Notice: https://docs.google.com/document/d/1Majh4ZEQ26icfUSVVycA2e9J3JE0uw_i2syI1WTiZQY/edit?tab=t.0#heading=h.t0r9ovjgdv4y

These are linked documents, not rewritten legal terms. No Google Docs sharing permissions are changed. End-user access remains governed by the source documents' sharing settings.

This remains the original browser-only interaction prototype. Files and submission receipts are session state and reset on reload. No live CRM, storage, email, bank or Funds Request operation is introduced. Customer-facing review warning banners are not added. Existing sample legal snapshot behaviour and payment accounts are not changed.

## Verification

Run `npm run check`, `node scripts/test-invoice-correction.mjs`, both Playwright suites, then both suites against the exact-head Netlify preview. Use #85 as the card/table visual-property reference. Required viewports: 1440x900, 768x1024, 390x844, 320x720.

Local environment notes: TypeScript, Angular development compilation and domain checks run in the working container. Network restrictions block Google Fonts inlining and localhost Chromium navigation here, so production builds and browser checks run in the authorized GitHub Actions environment; do not claim those passed until their results are available.
