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
    description: 'Finance eligible inventory and business purchases using your approved credit.',
    homeHeading: 'Agri Credit Line - ACL',
    homeIntro: 'View available financing, repayments and financing periods.',
    primaryActionLabel: 'Request funds',
    primaryActionKind: 'funds-request',
    metrics: [
      { label: 'Available Financing', value: 'KES 1,300,000', helper: 'For approved purchases' },
      { label: 'Outstanding Amount', value: 'KES 1,200,000', helper: 'Across active financing' },
      { label: 'Next Payment', value: 'KES 320,000', helper: 'Due 25 Aug 2026' },
    ],
    records: [
      { title: 'Avenews approved purchases', subtitle: 'FR-2026-0318 - 2 instalments', amountLabel: 'Outstanding', amount: 'KES 1,200,000', status: 'Live', statusTone: 'status-info', actionLabel: 'View financing', actionKind: 'view-financing' },
      { title: 'Mt Kenya Cooperative', subtitle: 'FR-2026-0510 - Documents pending', amountLabel: 'Requested', amount: 'KES 600,000', status: 'Submitted', statusTone: 'status-warning', actionLabel: 'View request', actionKind: 'view-financing' },
    ],
  },
  {
    id: 'abf',
    kind: 'customer',
    businessName: 'Kioko Agri Supplies Ltd',
    productName: 'Agri Buyer Financing - ABF',
    switcherLabel: 'Agri Buyer Financing - ABF',
    roleLabel: 'Client Buyer',
    description: 'Finance eligible supplier invoices, whether they are paid or unpaid.',
    homeHeading: 'Agri Buyer Financing - ABF',
    homeIntro: 'View financing by supplier, track repayments and request funds.',
    primaryActionLabel: 'Request funds',
    primaryActionKind: 'funds-request',
    metrics: [
      { label: 'Available Financing', value: 'KES 3,000,000', helper: 'Across approved suppliers' },
      { label: 'Outstanding Amount', value: 'KES 380,000', helper: 'Across active financing' },
      { label: 'Next Payment', value: 'KES 380,000', helper: 'Due 22 Sep 2026' },
    ],
    records: [
      { title: 'Quick Mart Stores', subtitle: 'Unpaid invoice - FR-2026-0422', amountLabel: 'Outstanding', amount: 'KES 380,000', status: 'Live', statusTone: 'status-info', actionLabel: 'View financing', actionKind: 'view-financing' },
      { title: 'Naivas Fresh Produce', subtitle: 'Paid invoice - reimbursement completed', amountLabel: 'Financed', amount: 'KES 459,000', status: 'Repaid', statusTone: 'status-success', actionLabel: 'View details', actionKind: 'view-financing' },
    ],
  },
  {
    id: 'stf',
    kind: 'customer',
    businessName: 'Kioko Agri Supplies Ltd',
    productName: 'Stockist Financing - STF',
    switcherLabel: 'Stockist Financing - STF',
    roleLabel: 'Client Buyer - Stockist',
    description: 'Finance approved purchases from your suppliers.',
    homeHeading: 'Stockist Financing - STF',
    homeIntro: 'View financing by supplier, track repayments and request funds.',
    primaryActionLabel: 'Request funds',
    primaryActionKind: 'funds-request',
    metrics: [
      { label: 'Available Financing', value: 'KES 800,000', helper: 'Across approved suppliers' },
      { label: 'Outstanding Amount', value: 'KES 390,000', helper: 'Across active financing' },
      { label: 'Next Payment', value: 'KES 150,000', helper: 'Due 30 Aug 2026' },
    ],
    records: [
      { title: 'GreenHarvest Distributors', subtitle: 'FR-2026-0501', amountLabel: 'Requested', amount: 'KES 100,000', status: 'Validating', statusTone: 'status-warning', actionLabel: 'View request', actionKind: 'view-financing' },
      { title: 'Meru Agrovets Ltd', subtitle: 'Approved supplier', amountLabel: 'Available', amount: 'KES 450,000', status: 'Available', statusTone: 'status-success', actionLabel: 'Request funds', actionKind: 'funds-request' },
    ],
  },
  {
    id: 'invoice-financing',
    kind: 'customer',
    businessName: 'Kioko Agri Supplies Ltd',
    productName: 'Invoice Financing',
    switcherLabel: 'Invoice Financing',
    roleLabel: 'Client Supplier',
    description: 'Get financing against eligible invoices owed by your buyers.',
    homeHeading: 'Invoice Financing',
    homeIntro: 'View financing by buyer and invoice due date, upload invoices and request funds.',
    primaryActionLabel: 'View financing periods',
    primaryActionKind: 'view-periods',
    metrics: [
      { label: 'Available Financing', value: 'KES 1,245,000', helper: 'Across eligible financing periods' },
      { label: 'Financing Periods', value: '3', helper: '2 available, 1 under review' },
      { label: 'Buyers', value: '2', helper: '2 approved buyers' },
    ],
    records: [
      { title: 'Twiga Foods Ltd', subtitle: 'Invoices due 15 Sep 2026', amountLabel: 'Available Financing', amount: 'KES 650,000', status: 'Available', statusTone: 'status-info', actionLabel: 'View financing period', actionKind: 'view-periods' },
      { title: 'FreshProduce Kenya Ltd', subtitle: '2 invoices under review', amountLabel: 'Available Financing', amount: 'KES 0', status: 'Under review', statusTone: 'status-warning', actionLabel: 'View buyer', actionKind: 'view-financing' },
    ],
  },
  {
    id: 'infx',
    kind: 'customer',
    businessName: 'Kioko Agri Supplies Ltd',
    productName: 'Invoice Financing Express - INFX',
    switcherLabel: 'Invoice Financing Express - INFX',
    roleLabel: 'Client Supplier',
    description: 'Finance one approved invoice at a time and repay Avenews directly.',
    homeHeading: 'Invoice Financing Express - INFX',
    homeIntro: 'Finance one invoice at a time, track repayments and request funds by buyer.',
    primaryActionLabel: 'Request funds',
    primaryActionKind: 'funds-request',
    metrics: [
      { label: 'Available Financing', value: 'KES 1,800,000', helper: 'Across approved buyers' },
      { label: 'Outstanding Amount', value: 'KES 900,000', helper: 'Across active financing' },
      { label: 'Next Payment', value: 'KES 958,650', helper: 'Due 02 Oct 2026' },
    ],
    records: [
      { title: 'Kisumu Buyers Co-op', subtitle: 'INFX-2026-0028 - 30 days', amountLabel: 'Outstanding', amount: 'KES 900,000', status: 'Validating', statusTone: 'status-warning', actionLabel: 'View request', actionKind: 'view-financing' },
      { title: 'Mombasa Buyers Network', subtitle: 'No active request', amountLabel: 'Available', amount: 'KES 600,000', status: 'Available', statusTone: 'status-success', actionLabel: 'Request funds', actionKind: 'funds-request' },
    ],
  },
  {
    id: 'invoice-partner',
    kind: 'partner',
    businessName: 'Twiga Foods Ltd',
    productName: 'Partner Buyer Portal',
    switcherLabel: 'Partner Buyer Portal',
    roleLabel: 'Partner Buyer',
    description: 'Upload supplier invoices and track payments and financing periods.',
    homeHeading: 'Partner Buyer Portal',
    homeIntro: 'Upload supplier invoices and track financing periods and payments.',
    primaryActionLabel: 'Upload invoices',
    primaryActionKind: 'upload-invoices',
    metrics: [
      { label: 'Invoices Uploaded', value: '128', helper: '126 processed, 2 need attention' },
      { label: 'Payments Due', value: 'KES 8,420,000', helper: 'Next payment due 15 Sep 2026' },
      { label: 'Available Financing', value: 'KES 1,250,000', helper: 'Across participating suppliers' },
    ],
    records: [
      { title: 'August supplier invoice batch', subtitle: 'Uploaded 12 Aug 2026', amountLabel: 'Imported', amount: '37 of 40 invoices', status: 'Needs attention', statusTone: 'status-warning', actionLabel: 'View invoice uploads', actionKind: 'view-invoice-uploads' },
      { title: 'Payment due 15 Sep 2026', subtitle: '18 participating suppliers', amountLabel: 'Amount to pay', amount: 'KES 8,420,000', status: 'Upcoming', statusTone: 'status-info', actionLabel: 'View payments', actionKind: 'view-obligations' },
      { title: 'Supplier financing', subtitle: '4 participating suppliers', amountLabel: 'Available', amount: 'KES 1,250,000', status: 'Available', statusTone: 'status-info', actionLabel: 'View suppliers', actionKind: 'view-suppliers' },
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
