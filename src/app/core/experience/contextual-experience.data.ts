export type ExperienceId =
  | 'acl'
  | 'abf'
  | 'stf'
  | 'invoice-financing'
  | 'infx'
  | 'invoice-partner'

export type ExperienceScenario = 'multiple' | 'abf-only' | 'partner-only'
export type ExperienceKind = 'customer' | 'partner'
export type StatusTone = 'status-info' | 'status-success' | 'status-warning' | 'status-danger' | 'status-neutral'
export type ExperienceActionKind =
  | 'funds-request'
  | 'upload-invoices'
  | 'view-financing'
  | 'view-periods'
  | 'view-invoice-uploads'
  | 'view-obligations'
  | 'view-suppliers'

export interface ExperienceMetric {
  label: string
  value: string
  helper: string
}

export interface ExperienceRecord {
  title: string
  subtitle: string
  amountLabel: string
  amount: string
  status: string
  statusTone: StatusTone
  actionLabel: string
  actionKind: ExperienceActionKind
}

export interface PortalExperience {
  id: ExperienceId
  kind: ExperienceKind
  businessName: string
  productName: string
  switcherLabel: string
  roleLabel: string
  description: string
  homeHeading: string
  homeIntro: string
  primaryActionLabel: string
  primaryActionKind: ExperienceActionKind
  metrics: readonly ExperienceMetric[]
  records: readonly ExperienceRecord[]
}

export const EXPERIENCES: readonly PortalExperience[] = [
  {
    id: 'acl',
    kind: 'customer',
    businessName: 'Kioko Agri Supplies Ltd',
    productName: 'Agri Credit Line - ACL',
    switcherLabel: 'Agri Credit Line - ACL',
    roleLabel: 'Client Buyer',
    description: 'Recurring working capital for approved inventory and business purchases.',
    homeHeading: 'Agri Credit Line - ACL',
    homeIntro: 'Manage available credit, Funds Requests, Advances, and Instalments for approved purchases.',
    primaryActionLabel: 'Start Funds Request',
    primaryActionKind: 'funds-request',
    metrics: [
      { label: 'Available Credit', value: 'KES 1,300,000', helper: 'Across approved transactions' },
      { label: 'Outstanding Principal', value: 'KES 1,200,000', helper: 'Across 2 active Advances' },
      { label: 'Next Instalment', value: 'KES 320,000', helper: 'Due 25 Aug 2026' },
    ],
    records: [
      { title: 'Avenews approved purchases', subtitle: 'FR-2026-0318 - 2 Instalments', amountLabel: 'Outstanding', amount: 'KES 1,200,000', status: 'Live', statusTone: 'status-info', actionLabel: 'View financing', actionKind: 'view-financing' },
      { title: 'Mt Kenya Cooperative', subtitle: 'FR-2026-0510 - Supporting documents pending', amountLabel: 'Requested', amount: 'KES 600,000', status: 'Submitted', statusTone: 'status-warning', actionLabel: 'View request', actionKind: 'view-financing' },
    ],
  },
  {
    id: 'abf',
    kind: 'customer',
    businessName: 'Kioko Agri Supplies Ltd',
    productName: 'Agri Buyer Financing - ABF',
    switcherLabel: 'Agri Buyer Financing - ABF',
    roleLabel: 'Client Buyer',
    description: 'Finance eligible Supplier invoices or receive reimbursement for invoices already paid.',
    homeHeading: 'Agri Buyer Financing - ABF',
    homeIntro: 'Choose whether an invoice is Fully Paid or Unpaid before starting the correct Funds Request flow.',
    primaryActionLabel: 'Start Funds Request',
    primaryActionKind: 'funds-request',
    metrics: [
      { label: 'Available Credit', value: 'KES 3,000,000', helper: 'Subject to Supplier sub-limits' },
      { label: 'Active Advances', value: '1', helper: 'KES 380,000 outstanding' },
      { label: 'Next Repayment', value: 'KES 380,000', helper: 'Due 22 Sep 2026' },
    ],
    records: [
      { title: 'Quick Mart Stores', subtitle: 'Unpaid Invoice - FR-2026-0422', amountLabel: 'Outstanding', amount: 'KES 380,000', status: 'Live', statusTone: 'status-info', actionLabel: 'View financing', actionKind: 'view-financing' },
      { title: 'Naivas Fresh Produce', subtitle: 'Fully Paid Invoice - Reimbursement completed', amountLabel: 'Financed', amount: 'KES 459,000', status: 'Repaid', statusTone: 'status-success', actionLabel: 'View details', actionKind: 'view-financing' },
    ],
  },
  {
    id: 'stf',
    kind: 'customer',
    businessName: 'Kioko Agri Supplies Ltd',
    productName: 'Stockist Financing - STF',
    switcherLabel: 'Stockist Financing - STF',
    roleLabel: 'Client Buyer - Stockist',
    description: 'Finance approved purchases from approved Partner Suppliers.',
    homeHeading: 'Stockist Financing - STF',
    homeIntro: 'Select a Partner Supplier, then submit the invoice and delivery evidence within the Funds Request.',
    primaryActionLabel: 'Start Funds Request',
    primaryActionKind: 'funds-request',
    metrics: [
      { label: 'Available Financing', value: 'KES 800,000', helper: 'Across approved Partner Suppliers' },
      { label: 'Partner Suppliers', value: '2', helper: 'GreenHarvest and Meru Agrovets' },
      { label: 'Pending Request', value: 'KES 100,000', helper: 'Validation in progress' },
    ],
    records: [
      { title: 'GreenHarvest Distributors', subtitle: 'Partner Supplier - FR-2026-0501', amountLabel: 'Requested', amount: 'KES 100,000', status: 'Validating', statusTone: 'status-warning', actionLabel: 'View request', actionKind: 'view-financing' },
      { title: 'Meru Agrovets Ltd', subtitle: 'Partner Supplier - 100% invoice financing cap', amountLabel: 'Available', amount: 'KES 450,000', status: 'Available', statusTone: 'status-success', actionLabel: 'Start Funds Request', actionKind: 'funds-request' },
    ],
  },
  {
    id: 'invoice-financing',
    kind: 'customer',
    businessName: 'Kioko Agri Supplies Ltd',
    productName: 'Invoice Financing',
    switcherLabel: 'Invoice Financing',
    roleLabel: 'Client Supplier',
    description: 'Receive liquidity against eligible receivables owed by a Counterparty Buyer or Partner Buyer.',
    homeHeading: 'Invoice Financing',
    homeIntro: 'Funds Requests are submitted from a specific Dynamic Period, never from a generic product action.',
    primaryActionLabel: 'View Dynamic Periods',
    primaryActionKind: 'view-periods',
    metrics: [
      { label: 'Available to Withdraw', value: 'KES 1,245,000', helper: 'Across 2 open Dynamic Periods' },
      { label: 'Open Dynamic Periods', value: '3', helper: '2 open, 1 under verification' },
      { label: 'Buyer Relationships', value: '2', helper: '1 Partner Buyer, 1 Counterparty Buyer' },
    ],
    records: [
      { title: 'Twiga Foods Ltd', subtitle: 'Partner Buyer - invoices due 15 Sep 2026', amountLabel: 'Available to Withdraw', amount: 'KES 650,000', status: 'Open for requests', statusTone: 'status-info', actionLabel: 'View Dynamic Period', actionKind: 'view-periods' },
      { title: 'FreshProduce Kenya Ltd', subtitle: 'Counterparty Buyer - 2 invoices under verification', amountLabel: 'Available to Withdraw', amount: 'KES 0', status: 'Under verification', statusTone: 'status-warning', actionLabel: 'View relationship', actionKind: 'view-financing' },
    ],
  },
  {
    id: 'infx',
    kind: 'customer',
    businessName: 'Kioko Agri Supplies Ltd',
    productName: 'Invoice Financing Express - INFX',
    switcherLabel: 'Invoice Financing Express - INFX',
    roleLabel: 'Client Supplier',
    description: 'Finance one approved invoice per Funds Request and repay Avenews directly.',
    homeHeading: 'Invoice Financing Express - INFX',
    homeIntro: 'Each Funds Request contains one approved Buyer, one invoice, the invoice due date, POD, and requested amount.',
    primaryActionLabel: 'Start Funds Request',
    primaryActionKind: 'funds-request',
    metrics: [
      { label: 'Available Credit', value: 'KES 1,800,000', helper: 'Subject to Buyer sub-limits' },
      { label: 'Active Advances', value: '1', helper: 'One invoice per Funds Request' },
      { label: 'Next Repayment', value: 'KES 958,650', helper: 'Client repayment due 02 Oct 2026' },
    ],
    records: [
      { title: 'Kisumu Buyers Co-op', subtitle: 'INFX-2026-0028 - 30 financed days', amountLabel: 'Principal', amount: 'KES 900,000', status: 'Validating', statusTone: 'status-warning', actionLabel: 'View request', actionKind: 'view-financing' },
      { title: 'Mombasa Buyers Network', subtitle: 'Approved Buyer - no active request', amountLabel: 'Buyer sub-limit', amount: 'KES 600,000', status: 'Available', statusTone: 'status-success', actionLabel: 'Start Funds Request', actionKind: 'funds-request' },
    ],
  },
  {
    id: 'invoice-partner',
    kind: 'partner',
    businessName: 'Twiga Foods Ltd',
    productName: 'Partner Buyer Portal',
    switcherLabel: 'Partner Buyer Portal',
    roleLabel: 'Partner Buyer',
    description: 'Upload invoices, review Buyer payments, and manage participating Supplier financing limits.',
    homeHeading: 'Partner Buyer Portal',
    homeIntro: 'Upload invoices for participating Suppliers, see what needs to be paid, and manage Supplier financing limits.',
    primaryActionLabel: 'Upload invoices',
    primaryActionKind: 'upload-invoices',
    metrics: [
      { label: 'Invoices Uploaded', value: '128', helper: '126 processed, 2 need attention' },
      { label: 'Payments Due', value: 'KES 8,420,000', helper: 'Next payment due 15 Sep 2026' },
      { label: 'Supplier Financing Available', value: 'KES 1,250,000', helper: 'Across active Supplier limits' },
    ],
    records: [
      { title: 'August Supplier invoice batch', subtitle: 'Uploaded 12 Aug 2026', amountLabel: 'Imported', amount: '37 of 40 invoices', status: 'Needs attention', statusTone: 'status-warning', actionLabel: 'View invoice uploads', actionKind: 'view-invoice-uploads' },
      { title: 'Payment due 15 Sep 2026', subtitle: '18 participating Suppliers', amountLabel: 'Amount to pay', amount: 'KES 8,420,000', status: 'Upcoming', statusTone: 'status-info', actionLabel: 'View payments', actionKind: 'view-obligations' },
      { title: 'Supplier financing limits', subtitle: '4 participating Suppliers', amountLabel: 'Available', amount: 'KES 1,250,000', status: 'Review limits', statusTone: 'status-info', actionLabel: 'Manage suppliers', actionKind: 'view-suppliers' },
    ],
  },
]

export const MULTIPLE_EXPERIENCE_IDS: readonly ExperienceId[] = EXPERIENCES.map(item => item.id)

export function experienceById(id: string | null | undefined): PortalExperience | undefined {
  return EXPERIENCES.find(item => item.id === id)
}

export function experiencesForScenario(scenario: ExperienceScenario): readonly PortalExperience[] {
  if (scenario === 'abf-only') return EXPERIENCES.filter(item => item.id === 'abf')
  if (scenario === 'partner-only') return EXPERIENCES.filter(item => item.id === 'invoice-partner')
  return EXPERIENCES
}

export function isExperienceScenario(value: string | null): value is ExperienceScenario {
  return value === 'multiple' || value === 'abf-only' || value === 'partner-only'
}
