# Invoice Financing and Partner Buyer review

Issues: #83 and #84. Review PR: #85, `stefan-invoice-partner-review` -> `stefan`.
Base: `4d10fb879c1e3e5b6baf0e7d45778949cf30eb8c`. Review only; do not merge without approval.

## Review entry points

Use the PR's verified Netlify Deploy Preview. After the existing demo login, choose Invoice Financing or Partner Buyer Portal.

- Supplier: `/experience/invoice-financing/home`
- Buyers: `/experience/invoice-financing/financing`
- Supplier invoices: `/experience/invoice-financing/invoices`
- Partner: `/experience/invoice-partner/home`
- Partner suppliers: `/experience/invoice-partner/suppliers`
- Partner payments: `/experience/invoice-partner/obligations`
- Partner invoices: `/experience/invoice-partner/invoice-uploads`

## Requirement mapping

### Invoice Financing

| User point | Implemented review behaviour |
| --- | --- |
| 1. Conditional upload action | Show Upload invoices only when at least one relationship assigns uploads to the supplier. The chooser distinguishes You upload invoices / Buyer uploads invoices. Buyer-owned relationships have no upload action. |
| 2. Native upload modal | Repeatable 1-20 relationship/due-date sections; 1-10 invoice files per section; add/copy/delete; conditional Proof of Delivery; file format/size/date/duplicate-group validation; mandatory delivery/dispute declaration with contact identity and timestamp; review receipt and visible file rows. Copying a section copies context but not files. |
| 3. Buyers upload ownership | Dedicated Invoice uploads column and equivalent mobile information. Ownership is configuration, not inferred from buyer type. |
| 4. Card and column explanations | Shared hover/focus/tap help for summary cards, table headings, mobile record fields, terms and payment instructions. |
| 5a. What this means | Explanation immediately after the summary cards, using the same live-in-tab figures as the tables and credit calculations. |
| 5b. Global approved limit | Available Financing includes the supplier's total approved limit. Outstanding principal, pending reservations, unused credit and invoice-backed availability are distinct. Global credit is capped once across relationships. |
| 6. Outstanding CTA | View outstanding periods filters every period with disbursed principal still unpaid, rather than only overdue payments or pending requests. |
| 7. Buyer terms | Per-relationship payment basis, upload responsibility, Proof of Delivery, clearing destination, sub-limit, advance rate, daily markup, funding window and settlement information. |
| 8. Invoices inside each period | Overview / Invoices(count) tabs in the existing period journey. Shared invoice table and records; exact period filtering; same fields/search/status/sort/pagination; no-file records retained without a file action. Empty period retains the tab. Files and the existing sample legal PDF remain accessible. |
| 9. Navigation | Invoice Uploader renamed to Invoices in the desktop and mobile shared navigation definition. |

### Partner Buyer Portal

| User point | Implemented review behaviour |
| --- | --- |
| 1. Rebates | Home Rebate due card opens a supplier breakdown of rate, principal collected, rebate earned, rebate paid and rebate due. Rebate uses principal collected, never invoice value or disbursements. |
| 2. Supplier terms | Supplier details show role-appropriate payment, upload, Proof of Delivery, rebate and clearing-account terms. Supplier credit limits, availability and markup are not exposed in the partner view. |
| 3. Period invoices | The same Overview / Invoices(count) pattern and shared invoice table as the supplier portal. Only the selected period's invoices appear. |
| 4. Payment-first home | Full searchable/filterable/sortable/paginated supplier payments on Home, using the exact records and direct payment dialog as Payments. Upload remains prominent. The three bottom shortcut cards are removed. |
| 5. Redundant labels | No green Partner Buyer Portal eyebrow on Payments, Suppliers or Invoices. Their page titles remain. |
| 6. Clearing account | Payment overview shows remaining invoice balance, allocated payments, designated clearing-account fields and copy actions. Only configured payment methods appear. Missing account configuration has an explicit contact-Avenews state; no generic account is substituted. |

## A few useful review cases

- Twiga is buyer-managed; FreshProduce is supplier-managed and requires Proof of Delivery.
- `DP-2026-09-15-TWIGA` has two invoice files; `DP-2026-10-15-TWIGA` has an invoice record without a file; the November FreshProduce period has no invoices.
- Saving a KES 50,000 review request against the October Twiga period reduces available financing from KES 320,000 to KES 270,000 and increases reservations, without changing disbursed outstanding principal.
- Coastline's partner invoice balance is KES 890,000 after a partial buyer payment. Its rebate uses KES 150,000 principal collected: KES 1,500 earned, KES 500 paid, KES 1,000 due.
- Total partner rebate due is KES 2,600 across all supplier relationships. The total remains the complete total when the breakdown table is searched.
- Eldoret demonstrates missing clearing-account configuration. Kioko/Twiga demonstrates both bank and M-Pesa layouts with unmistakably non-payable sample identifiers.

## Prototype and production boundary

This is the repository's existing browser-only design/interaction prototype, not a production financial application.

- All review calculations use sample data fixed at 23 September 2026. The date and sample-data status are visible in the UI.
- The KES 3,000,000 approved limit, relationship terms, rates, contacts, invoice records and clearing identifiers are review fixtures, not an assertion of current approved customer data.
- Outstanding means disbursed principal not repaid. Markup and late charges are explicitly excluded from that card; production repayment balances must use the authoritative allocation/charge records.
- Uploads, declarations and receipts stay in memory in this browser tab and reset on reload. Source-file Blob URLs are revoked when the store is destroyed. No CRM, email, bank, external storage or production upload is called.
- Upload amounts and references remain pending review; spreadsheets are not silently parsed or treated as verified invoices. The review upload does not increase financing eligibility. Production needs ingestion, per-row outcomes, secure storage, server-side identity/ownership checks, deduplication and audit persistence.
- Review Funds Requests only demonstrate a pending reservation and its effect on shared credit. No agreement is signed, funds disbursed or legal snapshot minted. The existing sample PDF is retained and labelled as a sample. Production must attach each submission's immutable legal snapshot.
- Real clearing-account details must come from the designated verified relationship account. Demo account strings cannot be used to pay. Copying details never changes payment status.
- Terms changes in production must be prospective and use period/advance snapshots; this review has no term-editing flow.
- Existing ACL, ABF, Stockist and Invoice Financing Express page components and the accepted legacy baseline are not rewritten. A contextual route entry opts only the two requested portals into the review.

## Validation

Run `npm run check`, `node scripts/test-invoice-review.mjs`, and `npx playwright test --config invoice-review.playwright.config.mjs` after installing the pinned audit dependencies used by `.github/workflows/invoice-review.yml`.

The focused browser suite covers 12 journeys at 1440x900, 768x1024, 390x844 and 320x720. It checks layouts, period-tab scoping, no-file and empty states, shared list operations, upload validation/receipt, reservation totals, rebate math, clipboard feedback, payment instructions and unchanged other-product homes. The same suite then runs against the successful Netlify preview associated with the exact PR head. Logs, screenshots and the verified deploy-status record are retained as a workflow artifact. A workflow pass is evidence for that exact head only.
