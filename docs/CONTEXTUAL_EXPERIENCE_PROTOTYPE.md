# Contextual Product and Partner Experience Prototype

## Purpose

This branch tests a simpler portal architecture for customers and Partners who may have access to several Avenews products, businesses, or roles. It remains a parallel Draft prototype. The accepted staging baseline remains available at `/` for side-by-side comparison.

Tracked work: #41-#51. PR: #46.

## Source labels used in the prototype

Every review explainer states what kind of source or decision it represents:

| Explainer label | Meaning |
| --- | --- |
| Handbook rule | Directly supported by the current Handbook source |
| Product terminology decision | The latest approved §15.3/§15.4 mapping supplied by Product, used where older Handbook sections conflict |
| Why this screen exists | The user question or job the proposed screen is designed to answer |
| Action placement | Why a Funds Request or invoice/document upload appears at that object level |
| Role boundary | What the Client, Partner, or Counterparty does and does not do |
| Prototype decision | A proposed UX interpretation that still requires Product approval |
| Current limitation | A future-state behaviour, fictional value, or missing integration that must not be mistaken for a live capability |

Explainers are enabled by default for Product review. On desktop, use:

```text
Developer
  -> Explainers: On / Off
```

The setting applies immediately and is stored only for the current browser session. It does not change authentication, product access, or the current product context.

## Authoritative terminology decision

The uploaded Handbook contains older conflicting `Supplier Financing` / `SFX` wording in some sections. For this contextual prototype, Product's latest supplied legacy-to-current mapping governs visible labels:

| Current destination | Financing role |
| --- | --- |
| Agri Credit Line - ACL | Client Buyer |
| Agri Buyer Financing - ABF | Client Buyer |
| Stockist Financing - STF | Client Buyer - Stockist |
| Invoice Financing | Client Supplier |
| Invoice Financing Express - INFX | Client Supplier |
| Invoice Financing - Partner Buyer | Partner Buyer access, not a financing product |

Current party and object terms are:

- Client Buyer
- Client Buyer - Stockist
- Client Supplier
- Partner Buyer
- Partner Supplier
- Counterparty Buyer
- Counterparty Supplier
- Financing Relationship
- Dynamic Period
- Funds Request
- Advance

Legacy ASF, ASFO, ASFX, SF, Offtaker, Anchor Buyer, Buyer Partner, Non-Partner Buyer, Supplier Client, Buyer Client, and similar retired labels are not rendered in the contextual routes. Internal mock identifiers may remain legacy-shaped only where they are not visible.

## Authentication and access resolution

Login and OTP remain generic. The prototype resolves available destinations immediately after OTP.

- Exactly one destination: go directly to its Home.
- More than one destination: show the access chooser.
- Resolve access on every new login.
- Do not remember the previous destination after logout.
- Allow switching during the authenticated session when several destinations exist.

A destination combines:

```text
Business + financing or Partner role + product or workspace
```

### Review scenarios

| Scenario | Login URL | Expected result after OTP |
| --- | --- | --- |
| Multiple products and Partner access | `/login?access=multiple` | Access chooser with six destinations |
| One customer product | `/login?access=abf-only` | Directly opens Agri Buyer Financing Home |
| One Partner workspace | `/login?access=partner-only` | Directly opens Invoice Financing - Partner Buyer Home |

Any non-empty prototype verification code succeeds.

## Contextual shell

Customer product contexts share:

```text
Home
Financing
Support
Manage Users - admin only
```

The Partner Buyer workspace uses:

```text
Home
Invoice Uploads
Obligations
Suppliers
Support
Manage Users - admin only
```

The current business, product or workspace, and role appear in the desktop sidebar and mobile header. When several destinations exist, the selector groups:

- Your financing
- Partner access

Changing context routes to that destination's Home. Logging out clears the choice.

## Product-specific object and action model

### Agri Credit Line - ACL

```text
Approved Credit Facility
  -> eligible commercial transaction
      -> Funds Request
          -> amount
          -> approved Instalment option
          -> transaction evidence
          -> approved disbursement recipient
      -> Advance
          -> Instalments
```

An approved Credit Limit does not create financing by itself. Invoice and other transaction evidence stays inside the Funds Request.

### Agri Buyer Financing - ABF

```text
Available Credit / Supplier sub-limit
  -> Funds Request
      -> Fully Paid Invoice OR Unpaid Invoice
      -> path-specific documents
      -> path-specific disbursement recipient
  -> Advance
      -> repayments
```

- Fully Paid Invoice: Supplier Invoice, Proof of Payment, and Proof of Delivery; approved disbursement reimburses the Client Buyer.
- Unpaid Invoice: Supplier Invoice and Proof of Delivery, plus proof for the Client-funded portion where required; approved disbursement goes to the Supplier.

The invoice-type decision appears before document upload because it controls the rest of the request.

### Stockist Financing - STF

```text
Partner Supplier Financing Relationship
  -> Funds Request
      -> Partner Supplier invoice
      -> delivery date
      -> online delivery confirmation
      -> amount
      -> approved Instalment option
  -> Advance
      -> Instalments
```

The Stockist is the Client Buyer. Avenews disburses the approved financing amount to the Partner Supplier. Invoice and delivery evidence stays inside the Funds Request.

### Invoice Financing Express - INFX

```text
Approved Buyer
  -> Funds Request
      -> one invoice
      -> invoice value and Due Date
      -> POD
      -> requested amount
  -> Advance
      -> Client Supplier manual repayment to Avenews
```

One invoice is financed per Funds Request. There is no standalone invoice uploader and no Dynamic Period reuse.

### Invoice Financing

```text
Financing Relationship
  -> Partner Buyer OR Counterparty Buyer
      -> Dynamic Period (Client Supplier + Buyer + invoice Due Date)
          -> invoices
          -> Funds Requests
          -> Advances
          -> Buyer payment and settlement
```

The Client Supplier submits the Funds Request from a specific Dynamic Period. The requested amount cannot exceed that period's Available to Withdraw. More than one Funds Request may be submitted while the request window remains open and availability remains.

Invoice-upload responsibility is relationship-specific:

- Partner Buyer relationship: the Partner Buyer normally supplies invoice or receivables information.
- Counterparty Buyer relationship: the Client Supplier normally uploads invoices.
- Reassigned responsibility is permitted only when documented and duplicate-upload risk is controlled.
- The Client Supplier remains the Funds Request submitter in both relationship models.

## Dynamic Period calculations and settlement

The prototype explains these figures separately:

- Total Receivables
- Eligible Receivables
- Advance Rate
- Borrowing Base
- Already Drawn
- Reserved Amount
- Available to Withdraw
- Buyer sub-limit remaining
- Invoice Financing facility remaining
- Business Available Credit

Available to Withdraw is constrained by Eligible Receivables and approved credit, then reduced by amounts already financed, reserved or pending, and other applicable deductions.

One approved Funds Request becomes one Advance. Several Advances may exist against one Dynamic Period. Each Advance keeps its own Principal, disbursement date, Financing Period, and Markup while sharing the period's invoice Due Date as the repayment date.

The Buyer pays the full invoice or receivables amount into the designated Client Clearing Account. Avenews allocates the payment, retains the applicable Principal and Markup, and transfers the remaining invoice proceeds to the Client Supplier.

Partner-only commercial economics are calculated separately and are not included in the Client Supplier's Available to Withdraw, repayment obligation, or settlement breakdown.

## Partner Buyer workspace

### Invoice Uploads

The Partner Buyer may submit individual invoices, multiple invoices, a bulk file, or other approved receivables information. The workspace has no Funds Request action.

The imported / skipped / failed row history is explicitly labelled as a proposed future-state experience. The current source supports a branded uploader link and form-level feedback, but does not confirm a durable Partner-facing batch-result record.

### Obligations

The Partner Buyer obligation is the full invoice or receivables value due for the date. The amount financed is contextual information only and does not replace the Buyer's payment obligation.

The prototype deliberately shows no real bank name, account number, or payment reference. Final settlement values must come from the approved production settlement source.

### Suppliers

The Partner Buyer may provide access to its Supplier network and support onboarding. A participating business is a Client Supplier when it receives financing. The Partner Buyer supports the program but does not become the financing Client for the Client Supplier's Advances.

Supplier invitation and onboarding buttons are placeholders only and are not connected to CRM or a production eligibility workflow.

## Developer navigation

The desktop Developer menu links to:

- Explainers On / Off
- access chooser
- all five customer product contexts
- Invoice Financing - Partner Buyer
- accepted staging baseline
- Design Lab
- Changelog

## Intentional baseline deviation

The accepted staging baseline uses universal Home, Available Financing, Financing Activity, and Invoices & Documents navigation. This branch intentionally tests product- and role-contextual navigation. It does not remove the baseline routes; both approaches remain accessible until Product approves a direction.

The Avenews logo and exact locked navigation artwork remain unchanged.

## Prototype boundaries

- All businesses, people, amounts, dates, files, statuses, and references are fictional.
- No live authorization, CRM, file upload, bank, payment, settlement, allocation, notification, or disbursement integration exists on this branch.
- Funds Request and invoice-upload forms demonstrate placement and branching, not production submission.
- No Partner Buyer rebate amount is shown in the Client Supplier experience.
- No staging changelog entry is added until the requester approves PR #46 for staging.
- PR #46 remains Draft and unmerged until explicit approval.
