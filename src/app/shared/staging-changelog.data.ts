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
    id: 'pr-1-customer-portal-foundation',
    stagingDate: '13 Aug 2026',
    prNumber: 1,
    title: 'Design-ready Angular customer portal foundation',
    contributor: 'Stefan — ChatGPT-assisted',
    summary: [
      'Established the Angular customer portal baseline across Login, Home, Available Financing, Financing Activity, Invoices & Documents, Support, Manage Users and Profile.',
      'Restored previous-designer visual and responsive parity while keeping current Handbook product names, the Avenews wordmark and the exact locked customer-navigation icons.',
      'Added prototype OTP, financing, invoice, support, invitation and profile flows backed by fictional data for design and developer handoff.',
      'Added the desktop Developer menu, current Design Lab, staging Changelog, issue-first delivery rules, Netlify Deploy Previews and automated four-viewport UI validation.',
    ],
  },
]
