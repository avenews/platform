import type { ExperienceId } from './contextual-experience.data'

export type CustomerProductId = Exclude<ExperienceId, 'invoice-partner'>
export type PaymentAttention = 'overdue' | 'upcoming' | null
export type SettlementMode = 'manual' | 'buyer-payment'
export type PeriodTone = 'status-info' | 'status-live' | 'status-warning' | 'status-danger' | 'status-success' | 'status-neutral'
export type InstalmentStatus = 'paid' | 'upcoming' | 'overdue' | 'scheduled'

export interface CustomerInstalment {
  label: string
  dueDate: string
  amount: number
  status: InstalmentStatus
}

export interface CustomerFinancingPeriod {
  id: string
  reference: string
  relationshipId: string
  relationshipName: string
  relationshipType: string
  statusKey: string
  statusLabel: string
  statusTone: PeriodTone
  disbursementDate: string
  repaymentDueDate: string
  amountFinanced: number
  totalRepaid: number
  outstandingBalance: number
  amountDue: number
  paymentAttention: PaymentAttention
  settlementMode: SettlementMode
  instalments: readonly CustomerInstalment[]
  invoiceType?: string
  invoiceReference?: string
  eligibleReceivables?: number
  availableToWithdraw?: number
  financedDays?: number
  note?: string
}

export interface CustomerRelationship {
  id: string
  name: string
  relationshipType: string
  limitLabel: string
  limit: number
  used: number
  available: number
  periodIds: readonly string[]
  helper: string
  fundsRequestUrl?: string
  fundsRequestEnabled?: boolean
  fundsRequestLabel?: string
  invoiceUploadResponsibility?: string
}

export interface CustomerWorkspace {
  id: CustomerProductId
  heading: string
  intro: string
  primaryActionLabel: string
  primaryActionKind: 'request-funds' | 'relationships'
  relationshipNavLabel?: string
  relationshipHeading?: string
  relationshipIntro?: string
  relationshipNoun: string
  availableMetricLabel: string
  availableMetricValue: number
  availableMetricHelper: string
  outstandingMetricLabel: string
  outstandingMetricValue: number
  outstandingMetricHelper: string
  dueMetricLabel: string
  dueActionLabel: string
  dueDateColumnLabel: string
  totalRepaidColumnLabel: string
  outstandingColumnLabel: string
  relationships: readonly CustomerRelationship[]
  periods: readonly CustomerFinancingPeriod[]
}

export const ABF_FUNDS_REQUEST_DEMO_URL = 'https://financing.avenews-gt.com/ishai/form/ABFDemo1/formperma/88hpcsGdZAsMIA0-EbgWUOc6jIqIr5VRd1htmpKqIRA'

const ACL_PERIODS: readonly CustomerFinancingPeriod[] = [
  {
    id: 'acl-live-0318',
    reference: 'FR-2026-0318',
    relationshipId: 'acl-general',
    relationshipName: 'Avenews approved purchases',
    relationshipType: 'Agri Credit Line',
    statusKey: 'live',
    statusLabel: 'Live',
    statusTone: 'status-live',
    disbursementDate: '2026-03-18',
    repaymentDueDate: '2026-05-25',
    amountFinanced: 1400000,
    totalRepaid: 700000,
    outstandingBalance: 700000,
    amountDue: 700000,
    paymentAttention: 'upcoming',
    settlementMode: 'manual',
    instalments: [
      { label: 'Instalment 1 of 2', dueDate: '2026-04-25', amount: 700000, status: 'paid' },
      { label: 'Instalment 2 of 2', dueDate: '2026-05-25', amount: 700000, status: 'upcoming' },
    ],
    note: 'Two-instalment example: equal repayments on days 30 and 60.',
  },
  {
    id: 'acl-overdue-0421',
    reference: 'FR-2026-0421',
    relationshipId: 'acl-general',
    relationshipName: 'Inventory purchase',
    relationshipType: 'Agri Credit Line',
    statusKey: 'overdue',
    statusLabel: 'Overdue',
    statusTone: 'status-danger',
    disbursementDate: '2026-04-11',
    repaymentDueDate: '2026-05-11',
    amountFinanced: 850000,
    totalRepaid: 0,
    outstandingBalance: 850000,
    amountDue: 850000,
    paymentAttention: 'overdue',
    settlementMode: 'manual',
    instalments: [
      { label: 'Final repayment', dueDate: '2026-05-11', amount: 850000, status: 'overdue' },
    ],
    note: 'One-instalment financing period now past its repayment due date.',
  },
  {
    id: 'acl-default-0110',
    reference: 'FR-2026-0110',
    relationshipId: 'acl-general',
    relationshipName: 'Seasonal stock purchase',
    relationshipType: 'Agri Credit Line',
    statusKey: 'in-default',
    statusLabel: 'In Default',
    statusTone: 'status-danger',
    disbursementDate: '2026-01-10',
    repaymentDueDate: '2026-02-10',
    amountFinanced: 1200000,
    totalRepaid: 300000,
    outstandingBalance: 900000,
    amountDue: 900000,
    paymentAttention: null,
    settlementMode: 'manual',
    instalments: [
      { label: 'Contractual repayment', dueDate: '2026-02-10', amount: 1200000, status: 'overdue' },
    ],
    note: 'Default status remains visible because the Advance is unsettled.',
  },
  {
    id: 'acl-delinquent-0204',
    reference: 'FR-2026-0204',
    relationshipId: 'acl-general',
    relationshipName: 'Produce purchase',
    relationshipType: 'Agri Credit Line',
    statusKey: 'delinquent',
    statusLabel: 'Delinquent',
    statusTone: 'status-danger',
    disbursementDate: '2026-02-04',
    repaymentDueDate: '2026-04-04',
    amountFinanced: 650000,
    totalRepaid: 330000,
    outstandingBalance: 320000,
    amountDue: 320000,
    paymentAttention: null,
    settlementMode: 'manual',
    instalments: [
      { label: 'Instalment 1 of 2', dueDate: '2026-03-04', amount: 325000, status: 'paid' },
      { label: 'Instalment 2 of 2', dueDate: '2026-04-04', amount: 325000, status: 'overdue' },
    ],
  },
  {
    id: 'acl-plan-0125',
    reference: 'FR-2026-0125',
    relationshipId: 'acl-general',
    relationshipName: 'Input purchase',
    relationshipType: 'Agri Credit Line',
    statusKey: 'on-repayment-plan',
    statusLabel: 'On Repayment Plan',
    statusTone: 'status-warning',
    disbursementDate: '2026-01-25',
    repaymentDueDate: '2026-06-30',
    amountFinanced: 900000,
    totalRepaid: 450000,
    outstandingBalance: 450000,
    amountDue: 150000,
    paymentAttention: null,
    settlementMode: 'manual',
    instalments: [
      { label: 'Plan payment 1 of 3', dueDate: '2026-04-30', amount: 150000, status: 'paid' },
      { label: 'Plan payment 2 of 3', dueDate: '2026-05-31', amount: 150000, status: 'scheduled' },
      { label: 'Plan payment 3 of 3', dueDate: '2026-06-30', amount: 150000, status: 'scheduled' },
    ],
  },
  {
    id: 'acl-transferred-1212',
    reference: 'FR-2025-1212',
    relationshipId: 'acl-general',
    relationshipName: 'Working capital purchase',
    relationshipType: 'Agri Credit Line',
    statusKey: 'transferred-to-repayment-plan',
    statusLabel: 'Transferred to Repayment Plan',
    statusTone: 'status-warning',
    disbursementDate: '2025-12-12',
    repaymentDueDate: '2026-07-15',
    amountFinanced: 720000,
    totalRepaid: 220000,
    outstandingBalance: 500000,
    amountDue: 125000,
    paymentAttention: null,
    settlementMode: 'manual',
    instalments: [
      { label: 'Plan payment 1 of 4', dueDate: '2026-04-15', amount: 125000, status: 'paid' },
      { label: 'Plan payment 2 of 4', dueDate: '2026-05-15', amount: 125000, status: 'scheduled' },
      { label: 'Plan payment 3 of 4', dueDate: '2026-06-15', amount: 125000, status: 'scheduled' },
      { label: 'Plan payment 4 of 4', dueDate: '2026-07-15', amount: 125000, status: 'scheduled' },
    ],
  },
  {
    id: 'acl-collections-1102',
    reference: 'FR-2025-1102',
    relationshipId: 'acl-general',
    relationshipName: 'Commodity purchase',
    relationshipType: 'Agri Credit Line',
    statusKey: 'collections',
    statusLabel: 'Collections',
    statusTone: 'status-danger',
    disbursementDate: '2025-11-02',
    repaymentDueDate: '2025-12-02',
    amountFinanced: 500000,
    totalRepaid: 80000,
    outstandingBalance: 420000,
    amountDue: 420000,
    paymentAttention: null,
    settlementMode: 'manual',
    instalments: [
      { label: 'Outstanding collection balance', dueDate: '2025-12-02', amount: 420000, status: 'overdue' },
    ],
    note: 'Collections remains visible while an external collection process is active.',
  },
]

const ABF_PERIODS: readonly CustomerFinancingPeriod[] = [
  {
    id: 'abf-quickmart-live',
    reference: 'FR-2026-0422',
    relationshipId: 'abf-quickmart',
    relationshipName: 'Quick Mart Stores',
    relationshipType: 'Counterparty Supplier',
    statusKey: 'live',
    statusLabel: 'Live',
    statusTone: 'status-live',
    disbursementDate: '2026-04-22',
    repaymentDueDate: '2026-06-22',
    amountFinanced: 380000,
    totalRepaid: 190000,
    outstandingBalance: 190000,
    amountDue: 190000,
    paymentAttention: 'upcoming',
    settlementMode: 'manual',
    invoiceType: 'Unpaid Invoice',
    invoiceReference: 'INV-QM-2042',
    instalments: [
      { label: 'Instalment 1 of 2', dueDate: '2026-05-22', amount: 190000, status: 'paid' },
      { label: 'Instalment 2 of 2', dueDate: '2026-06-22', amount: 190000, status: 'upcoming' },
    ],
  },
  {
    id: 'abf-naivas-overdue',
    reference: 'FR-2026-0407',
    relationshipId: 'abf-naivas',
    relationshipName: 'Naivas Fresh Produce',
    relationshipType: 'Counterparty Supplier',
    statusKey: 'overdue',
    statusLabel: 'Overdue',
    statusTone: 'status-danger',
    disbursementDate: '2026-04-07',
    repaymentDueDate: '2026-05-07',
    amountFinanced: 459000,
    totalRepaid: 0,
    outstandingBalance: 459000,
    amountDue: 459000,
    paymentAttention: 'overdue',
    settlementMode: 'manual',
    invoiceType: 'Fully Paid Invoice',
    invoiceReference: 'INV-NV-1128',
    instalments: [
      { label: 'Final repayment', dueDate: '2026-05-07', amount: 459000, status: 'overdue' },
    ],
  },
  {
    id: 'abf-eastleigh-plan',
    reference: 'FR-2026-0302',
    relationshipId: 'abf-eastleigh',
    relationshipName: 'Eastleigh Traders Co.',
    relationshipType: 'Counterparty Supplier',
    statusKey: 'on-repayment-plan',
    statusLabel: 'On Repayment Plan',
    statusTone: 'status-warning',
    disbursementDate: '2026-03-02',
    repaymentDueDate: '2026-07-02',
    amountFinanced: 420000,
    totalRepaid: 140000,
    outstandingBalance: 280000,
    amountDue: 140000,
    paymentAttention: null,
    settlementMode: 'manual',
    invoiceType: 'Unpaid Invoice',
    invoiceReference: 'INV-ET-3301',
    instalments: [
      { label: 'Plan payment 1 of 3', dueDate: '2026-05-02', amount: 140000, status: 'paid' },
      { label: 'Plan payment 2 of 3', dueDate: '2026-06-02', amount: 140000, status: 'scheduled' },
      { label: 'Plan payment 3 of 3', dueDate: '2026-07-02', amount: 140000, status: 'scheduled' },
    ],
  },
]

const STF_PERIODS: readonly CustomerFinancingPeriod[] = [
  {
    id: 'stf-greenharvest-live',
    reference: 'FR-2026-0501',
    relationshipId: 'stf-greenharvest',
    relationshipName: 'GreenHarvest Distributors',
    relationshipType: 'Partner Supplier',
    statusKey: 'live',
    statusLabel: 'Live',
    statusTone: 'status-live',
    disbursementDate: '2026-05-01',
    repaymentDueDate: '2026-07-01',
    amountFinanced: 300000,
    totalRepaid: 150000,
    outstandingBalance: 150000,
    amountDue: 150000,
    paymentAttention: 'upcoming',
    settlementMode: 'manual',
    invoiceReference: 'GH-INV-8831',
    instalments: [
      { label: 'Instalment 1 of 2', dueDate: '2026-06-01', amount: 150000, status: 'paid' },
      { label: 'Instalment 2 of 2', dueDate: '2026-07-01', amount: 150000, status: 'upcoming' },
    ],
  },
  {
    id: 'stf-meru-overdue',
    reference: 'FR-2026-0415',
    relationshipId: 'stf-meru',
    relationshipName: 'Meru Agrovets Ltd',
    relationshipType: 'Partner Supplier',
    statusKey: 'overdue',
    statusLabel: 'Overdue',
    statusTone: 'status-danger',
    disbursementDate: '2026-04-15',
    repaymentDueDate: '2026-05-15',
    amountFinanced: 240000,
    totalRepaid: 0,
    outstandingBalance: 240000,
    amountDue: 240000,
    paymentAttention: 'overdue',
    settlementMode: 'manual',
    invoiceReference: 'MA-INV-5519',
    instalments: [
      { label: 'Final repayment', dueDate: '2026-05-15', amount: 240000, status: 'overdue' },
    ],
  },
  {
    id: 'stf-seedco-delinquent',
    reference: 'FR-2026-0218',
    relationshipId: 'stf-seedco',
    relationshipName: 'SeedCo Kenya',
    relationshipType: 'Partner Supplier',
    statusKey: 'delinquent',
    statusLabel: 'Delinquent',
    statusTone: 'status-danger',
    disbursementDate: '2026-02-18',
    repaymentDueDate: '2026-05-18',
    amountFinanced: 510000,
    totalRepaid: 340000,
    outstandingBalance: 170000,
    amountDue: 170000,
    paymentAttention: null,
    settlementMode: 'manual',
    invoiceReference: 'SC-INV-9201',
    instalments: [
      { label: 'Instalment 1 of 3', dueDate: '2026-03-18', amount: 170000, status: 'paid' },
      { label: 'Instalment 2 of 3', dueDate: '2026-04-18', amount: 170000, status: 'paid' },
      { label: 'Instalment 3 of 3', dueDate: '2026-05-18', amount: 170000, status: 'overdue' },
    ],
  },
]

const INF_PERIODS: readonly CustomerFinancingPeriod[] = [
  {
    id: 'inf-twiga-sep15',
    reference: 'DP-2026-09-15-TWIGA',
    relationshipId: 'inf-twiga',
    relationshipName: 'Twiga Foods Ltd',
    relationshipType: 'Partner Buyer',
    statusKey: 'open',
    statusLabel: 'Open',
    statusTone: 'status-info',
    disbursementDate: '2026-08-17',
    repaymentDueDate: '2026-09-15',
    amountFinanced: 850000,
    totalRepaid: 0,
    outstandingBalance: 850000,
    amountDue: 850000,
    paymentAttention: 'upcoming',
    settlementMode: 'buyer-payment',
    eligibleReceivables: 1750000,
    availableToWithdraw: 650000,
    instalments: [],
    note: 'Buyer payment settles the financed principal and markup through the Client Clearing Account.',
  },
  {
    id: 'inf-twiga-aug31',
    reference: 'DP-2026-08-31-TWIGA',
    relationshipId: 'inf-twiga',
    relationshipName: 'Twiga Foods Ltd',
    relationshipType: 'Partner Buyer',
    statusKey: 'cutoff',
    statusLabel: 'Cutoff',
    statusTone: 'status-warning',
    disbursementDate: '2026-07-18',
    repaymentDueDate: '2026-08-31',
    amountFinanced: 560000,
    totalRepaid: 0,
    outstandingBalance: 560000,
    amountDue: 560000,
    paymentAttention: null,
    settlementMode: 'buyer-payment',
    eligibleReceivables: 720000,
    availableToWithdraw: 0,
    instalments: [],
  },
  {
    id: 'inf-fresh-overdue',
    reference: 'DP-2026-05-30-FRESH',
    relationshipId: 'inf-fresh',
    relationshipName: 'FreshProduce Kenya Ltd',
    relationshipType: 'Counterparty Buyer',
    statusKey: 'overdue',
    statusLabel: 'Overdue',
    statusTone: 'status-danger',
    disbursementDate: '2026-05-02',
    repaymentDueDate: '2026-05-30',
    amountFinanced: 600000,
    totalRepaid: 150000,
    outstandingBalance: 450000,
    amountDue: 450000,
    paymentAttention: 'overdue',
    settlementMode: 'buyer-payment',
    eligibleReceivables: 900000,
    availableToWithdraw: 0,
    instalments: [],
  },
  {
    id: 'inf-fresh-jun30',
    reference: 'DP-2026-06-30-FRESH',
    relationshipId: 'inf-fresh',
    relationshipName: 'FreshProduce Kenya Ltd',
    relationshipType: 'Counterparty Buyer',
    statusKey: 'open',
    statusLabel: 'Open',
    statusTone: 'status-info',
    disbursementDate: '2026-06-04',
    repaymentDueDate: '2026-06-30',
    amountFinanced: 320000,
    totalRepaid: 0,
    outstandingBalance: 320000,
    amountDue: 320000,
    paymentAttention: null,
    settlementMode: 'buyer-payment',
    eligibleReceivables: 500000,
    availableToWithdraw: 105000,
    instalments: [],
  },
]

const INFX_PERIODS: readonly CustomerFinancingPeriod[] = [
  {
    id: 'infx-kisumu-live',
    reference: 'FR-2026-0028',
    relationshipId: 'infx-kisumu',
    relationshipName: 'Kisumu Buyers Co-op',
    relationshipType: 'Approved Buyer',
    statusKey: 'live',
    statusLabel: 'Live',
    statusTone: 'status-live',
    disbursementDate: '2026-05-03',
    repaymentDueDate: '2026-06-02',
    amountFinanced: 900000,
    totalRepaid: 0,
    outstandingBalance: 900000,
    amountDue: 958650,
    paymentAttention: 'upcoming',
    settlementMode: 'manual',
    invoiceReference: 'INV-2026-0028',
    financedDays: 30,
    instalments: [],
  },
  {
    id: 'infx-mombasa-overdue',
    reference: 'FR-2026-0017',
    relationshipId: 'infx-mombasa',
    relationshipName: 'Mombasa Buyers Network',
    relationshipType: 'Approved Buyer',
    statusKey: 'overdue',
    statusLabel: 'Overdue',
    statusTone: 'status-danger',
    disbursementDate: '2026-04-01',
    repaymentDueDate: '2026-05-01',
    amountFinanced: 510000,
    totalRepaid: 0,
    outstandingBalance: 510000,
    amountDue: 545190,
    paymentAttention: 'overdue',
    settlementMode: 'manual',
    invoiceReference: 'INV-2026-0017',
    financedDays: 30,
    instalments: [],
  },
  {
    id: 'infx-nairobi-plan',
    reference: 'FR-2026-0009',
    relationshipId: 'infx-nairobi',
    relationshipName: 'Nairobi Retail Group',
    relationshipType: 'Approved Buyer',
    statusKey: 'on-repayment-plan',
    statusLabel: 'On Repayment Plan',
    statusTone: 'status-warning',
    disbursementDate: '2026-02-10',
    repaymentDueDate: '2026-06-15',
    amountFinanced: 400000,
    totalRepaid: 120000,
    outstandingBalance: 280000,
    amountDue: 140000,
    paymentAttention: null,
    settlementMode: 'manual',
    invoiceReference: 'INV-2026-0009',
    financedDays: 45,
    instalments: [
      { label: 'Repayment plan payment 1 of 2', dueDate: '2026-05-15', amount: 140000, status: 'paid' },
      { label: 'Repayment plan payment 2 of 2', dueDate: '2026-06-15', amount: 140000, status: 'scheduled' },
    ],
  },
]

export const CUSTOMER_WORKSPACES: readonly CustomerWorkspace[] = [
  {
    id: 'acl',
    heading: 'Agri Credit Line',
    intro: 'Manage available credit, financing periods and repayment details from one workspace.',
    primaryActionLabel: 'Submit Funds Request',
    primaryActionKind: 'request-funds',
    relationshipNoun: 'financing period',
    availableMetricLabel: 'Available Credit',
    availableMetricValue: 1300000,
    availableMetricHelper: 'KES 1,200,000 currently used',
    outstandingMetricLabel: 'Outstanding Amount',
    outstandingMetricValue: 4060000,
    outstandingMetricHelper: 'Across unsettled Agri Credit Line financing',
    dueMetricLabel: 'Payments Due',
    dueActionLabel: 'View payments due',
    dueDateColumnLabel: 'Repayment Due Date',
    totalRepaidColumnLabel: 'Total Repaid',
    outstandingColumnLabel: 'Outstanding Balance',
    relationships: [],
    periods: ACL_PERIODS,
  },
  {
    id: 'abf',
    heading: 'Agri Buyer Financing',
    intro: 'See your Supplier limits, active financing periods and repayments without leaving the product workspace.',
    primaryActionLabel: 'View approved Suppliers',
    primaryActionKind: 'relationships',
    relationshipNavLabel: 'Suppliers',
    relationshipHeading: 'Approved Suppliers',
    relationshipIntro: 'Each approved Supplier has its own sub-limit and one Supplier-scoped Funds Request entry point.',
    relationshipNoun: 'Supplier',
    availableMetricLabel: 'Available Credit',
    availableMetricValue: 1750000,
    availableMetricHelper: 'Subject to Supplier sub-limits',
    outstandingMetricLabel: 'Outstanding Amount',
    outstandingMetricValue: 929000,
    outstandingMetricHelper: 'Across active ABF financing periods',
    dueMetricLabel: 'Payments Due',
    dueActionLabel: 'View payments due',
    dueDateColumnLabel: 'Repayment Due Date',
    totalRepaidColumnLabel: 'Total Repaid',
    outstandingColumnLabel: 'Outstanding Balance',
    relationships: [
      {
        id: 'abf-quickmart',
        name: 'Quick Mart Stores',
        relationshipType: 'Counterparty Supplier',
        limitLabel: 'Supplier sub-limit',
        limit: 900000,
        used: 380000,
        available: 520000,
        periodIds: ['abf-quickmart-live'],
        helper: 'One active Supplier-scoped Funds Request.',
        fundsRequestUrl: ABF_FUNDS_REQUEST_DEMO_URL,
        fundsRequestEnabled: true,
        fundsRequestLabel: 'Start Funds Request',
      },
      {
        id: 'abf-naivas',
        name: 'Naivas Fresh Produce',
        relationshipType: 'Counterparty Supplier',
        limitLabel: 'Supplier sub-limit',
        limit: 1500000,
        used: 459000,
        available: 1041000,
        periodIds: ['abf-naivas-overdue'],
        helper: 'Fully paid invoice reimbursement path available for the next request.',
        fundsRequestUrl: ABF_FUNDS_REQUEST_DEMO_URL,
        fundsRequestEnabled: true,
        fundsRequestLabel: 'Start Funds Request',
      },
      {
        id: 'abf-eastleigh',
        name: 'Eastleigh Traders Co.',
        relationshipType: 'Counterparty Supplier',
        limitLabel: 'Supplier sub-limit',
        limit: 600000,
        used: 420000,
        available: 180000,
        periodIds: ['abf-eastleigh-plan'],
        helper: 'Existing financing is on a repayment plan.',
        fundsRequestUrl: ABF_FUNDS_REQUEST_DEMO_URL,
        fundsRequestEnabled: true,
        fundsRequestLabel: 'Start Funds Request',
      },
    ],
    periods: ABF_PERIODS,
  },
  {
    id: 'stf',
    heading: 'Stockist Financing',
    intro: 'Manage Partner Supplier limits, financing periods and repayments from one Stockist workspace.',
    primaryActionLabel: 'View Partner Suppliers',
    primaryActionKind: 'relationships',
    relationshipNavLabel: 'Partner Suppliers',
    relationshipHeading: 'Partner Suppliers',
    relationshipIntro: 'Start a Funds Request from the Partner Supplier you are buying from and keep its financing periods together.',
    relationshipNoun: 'Partner Supplier',
    availableMetricLabel: 'Available Financing',
    availableMetricValue: 980000,
    availableMetricHelper: 'Across approved Partner Supplier sub-limits',
    outstandingMetricLabel: 'Outstanding Amount',
    outstandingMetricValue: 560000,
    outstandingMetricHelper: 'Across active Stockist Financing periods',
    dueMetricLabel: 'Payments Due',
    dueActionLabel: 'View payments due',
    dueDateColumnLabel: 'Repayment Due Date',
    totalRepaidColumnLabel: 'Total Repaid',
    outstandingColumnLabel: 'Outstanding Balance',
    relationships: [
      {
        id: 'stf-greenharvest',
        name: 'GreenHarvest Distributors',
        relationshipType: 'Partner Supplier',
        limitLabel: 'Partner Supplier sub-limit',
        limit: 900000,
        used: 300000,
        available: 600000,
        periodIds: ['stf-greenharvest-live'],
        helper: 'Approved Partner Supplier; financing is disbursed directly to the Supplier.',
        fundsRequestEnabled: true,
        fundsRequestLabel: 'Start Funds Request',
      },
      {
        id: 'stf-meru',
        name: 'Meru Agrovets Ltd',
        relationshipType: 'Partner Supplier',
        limitLabel: 'Partner Supplier sub-limit',
        limit: 450000,
        used: 240000,
        available: 210000,
        periodIds: ['stf-meru-overdue'],
        helper: 'Current period needs repayment attention before additional financing is considered.',
        fundsRequestEnabled: true,
        fundsRequestLabel: 'Start Funds Request',
      },
      {
        id: 'stf-seedco',
        name: 'SeedCo Kenya',
        relationshipType: 'Partner Supplier',
        limitLabel: 'Partner Supplier sub-limit',
        limit: 680000,
        used: 510000,
        available: 170000,
        periodIds: ['stf-seedco-delinquent'],
        helper: 'Three-instalment example with the final instalment unresolved.',
        fundsRequestEnabled: true,
        fundsRequestLabel: 'Start Funds Request',
      },
    ],
    periods: STF_PERIODS,
  },
  {
    id: 'invoice-financing',
    heading: 'Invoice Financing',
    intro: 'Manage Buyer relationships and Dynamic Periods from the Client Supplier perspective.',
    primaryActionLabel: 'View Buyers',
    primaryActionKind: 'relationships',
    relationshipNavLabel: 'Buyers',
    relationshipHeading: 'Buyer Relationships',
    relationshipIntro: 'Each Buyer relationship contains the Dynamic Periods created for that Buyer and invoice Due Date.',
    relationshipNoun: 'Buyer',
    availableMetricLabel: 'Available to Withdraw',
    availableMetricValue: 755000,
    availableMetricHelper: 'Across open Dynamic Periods',
    outstandingMetricLabel: 'Outstanding Principal',
    outstandingMetricValue: 2180000,
    outstandingMetricHelper: 'Settled from Buyer payments',
    dueMetricLabel: 'Settlements Due',
    dueActionLabel: 'View periods due',
    dueDateColumnLabel: 'Dynamic Period Due Date',
    totalRepaidColumnLabel: 'Buyer Payments Allocated',
    outstandingColumnLabel: 'Outstanding Principal',
    relationships: [
      {
        id: 'inf-twiga',
        name: 'Twiga Foods Ltd',
        relationshipType: 'Partner Buyer',
        limitLabel: 'Buyer sub-limit',
        limit: 1500000,
        used: 1410000,
        available: 90000,
        periodIds: ['inf-twiga-sep15', 'inf-twiga-aug31'],
        helper: 'Partner Buyer normally supplies the invoice or receivables information.',
        invoiceUploadResponsibility: 'Twiga Foods Ltd normally uploads the invoices for this relationship.',
      },
      {
        id: 'inf-fresh',
        name: 'FreshProduce Kenya Ltd',
        relationshipType: 'Counterparty Buyer',
        limitLabel: 'Buyer sub-limit',
        limit: 2000000,
        used: 920000,
        available: 1080000,
        periodIds: ['inf-fresh-overdue', 'inf-fresh-jun30'],
        helper: 'The Client Supplier normally uploads invoices for this Counterparty Buyer relationship.',
        invoiceUploadResponsibility: 'Your business normally uploads invoices for this relationship.',
      },
    ],
    periods: INF_PERIODS,
  },
  {
    id: 'infx',
    heading: 'Invoice Financing Express',
    intro: 'Manage approved Buyers, one-invoice financing periods and direct repayments to Avenews.',
    primaryActionLabel: 'View Buyers',
    primaryActionKind: 'relationships',
    relationshipNavLabel: 'Buyers',
    relationshipHeading: 'Approved Buyers',
    relationshipIntro: 'Each Funds Request finances one approved invoice for one Buyer and creates its own Financing Period.',
    relationshipNoun: 'Buyer',
    availableMetricLabel: 'Available Credit',
    availableMetricValue: 1190000,
    availableMetricHelper: 'Subject to approved Buyer sub-limits',
    outstandingMetricLabel: 'Outstanding Amount',
    outstandingMetricValue: 1690000,
    outstandingMetricHelper: 'Across active Invoice Financing Express periods',
    dueMetricLabel: 'Payments Due',
    dueActionLabel: 'View payments due',
    dueDateColumnLabel: 'Repayment Due Date',
    totalRepaidColumnLabel: 'Total Repaid',
    outstandingColumnLabel: 'Outstanding Balance',
    relationships: [
      {
        id: 'infx-kisumu',
        name: 'Kisumu Buyers Co-op',
        relationshipType: 'Approved Buyer',
        limitLabel: 'Buyer sub-limit',
        limit: 900000,
        used: 900000,
        available: 0,
        periodIds: ['infx-kisumu-live'],
        helper: 'One financed invoice is currently live.',
        fundsRequestEnabled: false,
        fundsRequestLabel: 'Sub-limit fully used',
      },
      {
        id: 'infx-mombasa',
        name: 'Mombasa Buyers Network',
        relationshipType: 'Approved Buyer',
        limitLabel: 'Buyer sub-limit',
        limit: 600000,
        used: 510000,
        available: 90000,
        periodIds: ['infx-mombasa-overdue'],
        helper: 'One overdue one-invoice Financing Period.',
        fundsRequestEnabled: true,
        fundsRequestLabel: 'Start Funds Request',
      },
      {
        id: 'infx-nairobi',
        name: 'Nairobi Retail Group',
        relationshipType: 'Approved Buyer',
        limitLabel: 'Buyer sub-limit',
        limit: 700000,
        used: 400000,
        available: 300000,
        periodIds: ['infx-nairobi-plan'],
        helper: 'Existing financing is on a repayment plan.',
        fundsRequestEnabled: true,
        fundsRequestLabel: 'Start Funds Request',
      },
    ],
    periods: INFX_PERIODS,
  },
]

export function customerWorkspaceById(id: string | null | undefined): CustomerWorkspace | undefined {
  return CUSTOMER_WORKSPACES.find(workspace => workspace.id === id)
}

export function periodsForRelationship(
  workspace: CustomerWorkspace,
  relationship: CustomerRelationship,
): readonly CustomerFinancingPeriod[] {
  return workspace.periods.filter(period => relationship.periodIds.includes(period.id))
}

export function paymentAttentionCounts(workspace: CustomerWorkspace): { overdue: number; upcoming: number; total: number } {
  const overdue = workspace.periods.filter(period => period.paymentAttention === 'overdue').length
  const upcoming = workspace.periods.filter(period => period.paymentAttention === 'upcoming').length
  return { overdue, upcoming, total: overdue + upcoming }
}
