# Contextual Product and Partner Experience Prototype

## Purpose

This branch tests a simpler portal architecture for customers and Partners who may have access to several Avenews products or roles. It is a parallel prototype. The accepted staging baseline remains available at `/` for side-by-side comparison.

Issues: #41, #42, #43, #44, #45.

## Handbook and terminology decisions

The prototype uses these current products:

| Destination | Financing role |
| --- | --- |
| Agri Credit Line - ACL | Client Buyer |
| Agri Buyer Financing - ABF | Client Buyer |
| Stockist Financing - STF | Client Buyer - Stockist |
| Invoice Financing | Client Supplier |
| Invoice Financing Express - INFX | Client Supplier |
| Invoice Financing - Partner Buyer | Partner Buyer access, not a financing product |

Invoice Financing contains Partner Buyer and Counterparty Buyer Financing Relationships. A Dynamic Period groups one Client Supplier, one Buyer, and one invoice Due Date. The Client Supplier submits the Funds Request from the Dynamic Period. The default invoice uploader depends on the Financing Relationship.

Legacy ASF, ASFO, ASFX, SF, Offtaker, Anchor Buyer, Buyer Partner, Non-Partner Buyer, Supplier Client, and Buyer Client terminology is not rendered in the new routes.

## Authentication and access resolution

Login and OTP remain generic. The prototype resolves available destinations immediately after OTP.

- Exactly one destination: go directly to its Home.
- More than one destination: show the access chooser.
- Resolve access on every new login.
- Do not remember the previous destination after logout.
- The in-session context switcher remains available when the identity has several destinations.

### Review scenarios

| Scenario | Login URL | Expected result after OTP |
| --- | --- | --- |
| Multiple products and Partner access | `/login?access=multiple` | Access chooser with six destinations |
| One customer product | `/login?access=abf-only` | Directly opens Agri Buyer Financing Home |
| One Partner workspace | `/login?access=partner-only` | Directly opens Invoice Financing - Partner Buyer Home |

Any non-empty prototype verification code succeeds.

## Customer information architecture

Customer product contexts share this shell:

```text
Home
Financing
Support
Manage Users (admin only)
```

The content and object hierarchy inside Home and Financing are product-specific.

### Agri Credit Line - ACL

```text
Credit facility
  -> Funds Request
      -> amount, Instalments, transaction documents, disbursement recipient
  -> Advance
      -> Instalments
```

Invoice and supporting-document upload belongs inside the Funds Request.

### Agri Buyer Financing - ABF

```text
Available Credit / Supplier sub-limit
  -> Funds Request
      -> Fully Paid Invoice OR Unpaid Invoice
      -> product-specific documents and disbursement recipient
  -> Advance
      -> repayments
```

A Fully Paid Invoice flow includes Supplier Invoice, Proof of Payment, and Proof of Delivery and reimburses the Client Buyer. An Unpaid Invoice flow includes the Supplier Invoice and Proof of Delivery and disburses the approved amount to the Supplier.

### Stockist Financing - STF

```text
Partner Supplier relationship
  -> Funds Request
      -> Partner Supplier invoice, delivery date, delivery confirmation, amount, Instalments
  -> Advance
      -> Instalments
```

Invoice and delivery evidence belongs inside the Funds Request.

### Invoice Financing Express - INFX

```text
Approved Buyer
  -> Funds Request
      -> one invoice, invoice value, invoice Due Date, POD, amount
  -> Advance
      -> Client Supplier repayment
```

One invoice is financed per Funds Request. There is no standalone invoice uploader.

### Invoice Financing

```text
Buyer Financing Relationship
  -> Dynamic Period (Buyer + invoice Due Date)
      -> invoices
      -> Funds Requests
      -> Advances
      -> settlement
```

There is no product-level Funds Request. The `Request funds` action appears only on an eligible Dynamic Period with Available to Withdraw.

- Counterparty Buyer: the Client Supplier normally uploads invoices from the Financing Relationship.
- Partner Buyer: the Partner Buyer normally uploads invoices; the Client Supplier sees the periods and submits Funds Requests.
- Reassigned invoice-upload responsibility is a relationship capability, not a different product.

## Partner Buyer information architecture

The Invoice Financing - Partner Buyer workspace uses:

```text
Home
Invoice Uploads
Obligations
Suppliers
Support
Manage Users (admin only)
```

The Partner Buyer has an `Upload invoices` action and no Funds Request action. The upload-history prototype shows imported, skipped, and failed row outcomes. Obligations display the full invoice value due, not merely the amount financed.

## Context switcher

The current business, product/access type, and role are shown at the top of the sidebar and mobile header. When several destinations exist, the selector groups:

- Your financing
- Partner access

Changing context routes to that destination's Home. The selection exists only for the authenticated session and is cleared at logout.

## Developer navigation

The desktop Developer menu links to:

- access chooser
- all five customer product contexts
- Invoice Financing - Partner Buyer
- accepted staging baseline
- Design Lab
- Changelog

## Intentional baseline deviation

The accepted staging baseline uses universal Home, Available Financing, Financing Activity, and Invoices & Documents navigation. This branch intentionally tests product- and role-contextual navigation. It does not remove or alter the baseline routes; both approaches remain accessible until review determines which structure should proceed.

The Avenews logo and exact locked navigation artwork remain unchanged.

## Prototype boundaries

- Fictional data only.
- No live authorization, CRM, file upload, payment, settlement, bank, or disbursement integration.
- Funds Request and invoice-upload forms show placement and branching, not production submission.
- No staging changelog entry is added until the requester approves the PR for staging.
- The Draft PR must remain unmerged until explicit approval.
