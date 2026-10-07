export interface StagingChangelogEntry {
  id: string
  stagingDate: string
  prNumber: number
  title: string
  contributor: string
  summary: readonly string[]
}

/**
 * Source of truth for changes prepared for and accepted into staging.
 *
 * Entries are added during final staging review in the same pull request. They
 * become staging history when that pull request is merged. If the merge date
 * changes, update `stagingDate` before promotion.
 */
export const STAGING_CHANGELOG: readonly StagingChangelogEntry[] = [
  {
    id: 'pr-87-follow-up-modal-support',
    stagingDate: '7 Oct 2026',
    prNumber: 87,
    title: 'Review follow-up: modal support and payment detail cleanup',
    contributor: 'Stefan, ChatGPT-assisted',
    summary: [
      'Kept financing-period support requests inside the open modal instead of sending the user to the Support page.',
      'Returned invoice actions to file-only behavior, wrapped long statuses, and kept supplier identifiers visually secondary to financing-period references.',
      'Removed duplicate buyer payment destination wording and exposed the supplier Clearing Account details in the Invoice Financing payment view.',
    ],
  },
  {
    id: 'pr-87-pass-5',
    stagingDate: '7 Oct 2026',
    prNumber: 87,
    title: 'Pass 5: cross-portal reconciliation and QA',
    contributor: 'Stefan, ChatGPT-assisted',
    summary: [
      'Reconciled Partner Buyer home totals, invoice counts and payment balances against the shared fixture data.',
      'Separated invoice review status from financing availability and aligned overdue blocking across supplier and buyer views.',
      'Validated desktop, tablet, mobile and 320px minimum-mobile behavior against the preserved Preview 86 baseline.',
    ],
  },
  {
    id: 'pr-87-pass-4',
    stagingDate: '7 Oct 2026',
    prNumber: 87,
    title: 'Pass 4: Partner Buyer payments, visibility, support and rebates',
    contributor: 'Stefan, ChatGPT-assisted',
    summary: [
      'Removed supplier pricing and unnecessary financing economics from Partner Buyer views while keeping useful financing availability.',
      'Separated amount due, amount received and remaining amount, and made paid periods clearly paid with no active payment instructions.',
      'Kept rebates on the shared collected-principal ledger and added contextual support information for operational resolution.',
    ],
  },
  {
    id: 'pr-87-pass-3',
    stagingDate: '7 Oct 2026',
    prNumber: 87,
    title: 'Pass 3: financing eligibility, Funds Request behavior and cancellation',
    contributor: 'Stefan, ChatGPT-assisted',
    summary: [
      'Kept Invoice Financing Funds Requests as a toast explaining the CRM-provided Zoho Form handoff, with no URL integration.',
      'Applied overdue blocking only to the affected supplier and buyer relationship while keeping valid invoice upload available.',
      'Added future-date financing-window states and supplier-only manual cancellation requests for unfunded periods.',
    ],
  },
  {
    id: 'pr-87-pass-2',
    stagingDate: '7 Oct 2026',
    prNumber: 87,
    title: 'Pass 2: invoice upload modes and lifecycle',
    contributor: 'Stefan, ChatGPT-assisted',
    summary: [
      'Split invoice processing into manual Counterparty Buyer uploads and automatic Partner Buyer bulk processing.',
      'Added invoice number, amount and one attachment per manual invoice, blocked overdue invoices and kept future invoices valid.',
      'Locked submitted invoices, moved manual submissions to Awaiting review and prevented stale buyer search text from silently retaining a selection.',
    ],
  },
  {
    id: 'pr-87-pass-1',
    stagingDate: '7 Oct 2026',
    prNumber: 87,
    title: 'Pass 1: data foundation, statuses and pagination',
    contributor: 'Stefan, ChatGPT-assisted',
    summary: [
      'Separated invoice review, financing availability, financing period, payment and upload-processing status concepts.',
      'Removed the undefined Payment processing customer status and split financing-period status from payment-status filters.',
      'Standardized relevant Partner Buyer tables and rebate lists to a minimum of 10 rows per page.',
    ],
  },
  {
    id: 'pr-34-responsive-customer-filters',
    stagingDate: '13 Aug 2026',
    prNumber: 34,
    title: 'Responsive customer search and filter bar',
    contributor: 'Stefan, ChatGPT-assisted, customer filter work',
    summary: [
      'Introduced one reusable responsive customer search and filter bar based on the ASFo buyer portal interaction pattern.',
      'Replaced permanently stacked mobile selects with an immediately available search field, a compact Filters disclosure, and consistent Clear all and Apply actions.',
      'Rolled the pattern out to Available Financing, Financing Activity, Invoices & Documents and Manage Users while preserving each page’s existing data, filter values and Home view handoff.',
      'Standardized spacing around list-page filters and removed WhatsApp glyphs from customer actions while retaining their labels and behaviour.',
    ],
  },
  {
    id: 'pr-1-customer-portal-foundation',
    stagingDate: '13 Aug 2026',
    prNumber: 1,
    title: 'Design-ready Angular customer portal foundation',
    contributor: 'Stefan, ChatGPT-assisted',
    summary: [
      'Established the Angular customer portal baseline across Login, Home, Available Financing, Financing Activity, Invoices & Documents, Support, Manage Users and Profile.',
      'Restored previous-designer visual and responsive parity while keeping current Handbook product names, the Avenews wordmark and the exact locked customer-navigation icons.',
      'Added prototype OTP, financing, invoice, support, invitation and profile flows backed by fictional data for design and developer handoff.',
      'Added the desktop Developer menu, current Design Lab, staging Changelog, issue-first delivery rules, Netlify Deploy Previews and automated four-viewport UI validation.',
    ],
  },
]
