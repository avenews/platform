export type BuyerRelationshipModel = 'partner-buyer' | 'counterparty-buyer'
export type DynamicPeriodStatus = 'pending' | 'open' | 'verification' | 'cutoff' | 'overdue' | 'settled'
export type PeriodInvoiceStatus = 'eligible' | 'under-verification' | 'financed' | 'excluded'
export type AdvanceStatus = 'submitted' | 'under-review' | 'approved' | 'disbursed' | 'repaid'

export interface InvoiceFinancingRelationship {
  id: string
  buyerName: string
  model: BuyerRelationshipModel
  canClientUploadInvoices: boolean
  invoiceUploadOwner: 'client-supplier' | 'partner-buyer'
  approvedSubLimit: number
  availableSubLimit: number
  dynamicPeriodCount: number
}

export interface InvoiceFinancingPeriod {
  id: string
  relationshipId: string
  buyerName: string
  relationshipModel: BuyerRelationshipModel
  dueDate: string
  daysRemaining: number
  status: DynamicPeriodStatus
  statusLabel: string
  totalReceivables: number
  eligibleReceivables: number
  advanceRate: number
  borrowingBase: number
  drawnPrincipal: number
  reservedAmount: number
  availableToWithdraw: number
  buyerSubLimitRemaining: number
  facilityCreditRemaining: number
  businessCreditRemaining: number
  bindingConstraint: string
  fundsRequestOpensAt: string
  fundsRequestCutoffAt: string
  lastRecalculatedAt: string
}

export interface PeriodInvoice {
  id: string
  periodId: string
  reference: string
  amount: number
  uploadedAt: string
  uploadedBy: string
  status: PeriodInvoiceStatus
  linkedAdvanceReference: string | null
}

export interface PeriodAdvance {
  id: string
  periodId: string
  reference: string
  requestDate: string
  disbursementDate: string | null
  principal: number
  dailyMarkupRate: number
  tenorDays: number
  markup: number
  totalRepayable: number
  status: AdvanceStatus
}

export const INVOICE_FINANCING_RELATIONSHIPS: readonly InvoiceFinancingRelationship[] = [
  {
    id: 'rel-twiga',
    buyerName: 'Twiga Foods Ltd',
    model: 'partner-buyer',
    canClientUploadInvoices: false,
    invoiceUploadOwner: 'partner-buyer',
    approvedSubLimit: 2000000,
    availableSubLimit: 900000,
    dynamicPeriodCount: 2,
  },
  {
    id: 'rel-freshproduce',
    buyerName: 'FreshProduce Kenya Ltd',
    model: 'counterparty-buyer',
    canClientUploadInvoices: true,
    invoiceUploadOwner: 'client-supplier',
    approvedSubLimit: 1000000,
    availableSubLimit: 650000,
    dynamicPeriodCount: 1,
  },
]

export const INVOICE_FINANCING_PERIODS: readonly InvoiceFinancingPeriod[] = [
  {
    id: 'twiga-2026-09-15',
    relationshipId: 'rel-twiga',
    buyerName: 'Twiga Foods Ltd',
    relationshipModel: 'partner-buyer',
    dueDate: '2026-09-15',
    daysRemaining: 29,
    status: 'open',
    statusLabel: 'Open for requests',
    totalReceivables: 1750000,
    eligibleReceivables: 1750000,
    advanceRate: 0.85,
    borrowingBase: 1487500,
    drawnPrincipal: 500000,
    reservedAmount: 100000,
    availableToWithdraw: 650000,
    buyerSubLimitRemaining: 650000,
    facilityCreditRemaining: 4300000,
    businessCreditRemaining: 4800000,
    bindingConstraint: 'Limited by the approved Buyer sub-limit of KES 650,000 remaining, not by Eligible Receivables.',
    fundsRequestOpensAt: '2026-07-17',
    fundsRequestCutoffAt: '2026-09-08',
    lastRecalculatedAt: '2026-08-17T07:00:00Z',
  },
  {
    id: 'twiga-2026-10-30',
    relationshipId: 'rel-twiga',
    buyerName: 'Twiga Foods Ltd',
    relationshipModel: 'partner-buyer',
    dueDate: '2026-10-30',
    daysRemaining: 74,
    status: 'pending',
    statusLabel: 'Opens on 31 Aug',
    totalReceivables: 700000,
    eligibleReceivables: 700000,
    advanceRate: 0.85,
    borrowingBase: 595000,
    drawnPrincipal: 0,
    reservedAmount: 0,
    availableToWithdraw: 0,
    buyerSubLimitRemaining: 900000,
    facilityCreditRemaining: 4300000,
    businessCreditRemaining: 4800000,
    bindingConstraint: 'Funds Requests open on 31 Aug 2026, 60 days before the invoice Due Date.',
    fundsRequestOpensAt: '2026-08-31',
    fundsRequestCutoffAt: '2026-10-23',
    lastRecalculatedAt: '2026-08-17T07:00:00Z',
  },
  {
    id: 'fresh-2026-09-05',
    relationshipId: 'rel-freshproduce',
    buyerName: 'FreshProduce Kenya Ltd',
    relationshipModel: 'counterparty-buyer',
    dueDate: '2026-09-05',
    daysRemaining: 19,
    status: 'verification',
    statusLabel: 'Invoices under verification',
    totalReceivables: 400000,
    eligibleReceivables: 0,
    advanceRate: 0.85,
    borrowingBase: 0,
    drawnPrincipal: 0,
    reservedAmount: 0,
    availableToWithdraw: 0,
    buyerSubLimitRemaining: 650000,
    facilityCreditRemaining: 3650000,
    businessCreditRemaining: 4800000,
    bindingConstraint: 'Your invoices are being verified. Available to Withdraw will be recalculated as invoices become eligible.',
    fundsRequestOpensAt: '2026-07-07',
    fundsRequestCutoffAt: '2026-08-29',
    lastRecalculatedAt: '2026-08-17T07:00:00Z',
  },
]

export const PERIOD_INVOICES: readonly PeriodInvoice[] = [
  { id: 'inv-twiga-42', periodId: 'twiga-2026-09-15', reference: 'INV-2026-0042', amount: 1000000, uploadedAt: '2026-08-01', uploadedBy: 'Twiga Foods Ltd', status: 'financed', linkedAdvanceReference: 'FR-2026-0084' },
  { id: 'inv-twiga-43', periodId: 'twiga-2026-09-15', reference: 'INV-2026-0043', amount: 750000, uploadedAt: '2026-08-05', uploadedBy: 'Twiga Foods Ltd', status: 'eligible', linkedAdvanceReference: null },
  { id: 'inv-twiga-61', periodId: 'twiga-2026-10-30', reference: 'INV-2026-0061', amount: 700000, uploadedAt: '2026-08-15', uploadedBy: 'Twiga Foods Ltd', status: 'eligible', linkedAdvanceReference: null },
  { id: 'inv-fresh-68', periodId: 'fresh-2026-09-05', reference: 'INV-2026-0068', amount: 250000, uploadedAt: '2026-08-16', uploadedBy: 'Kioko Agri Supplies Ltd', status: 'under-verification', linkedAdvanceReference: null },
  { id: 'inv-fresh-69', periodId: 'fresh-2026-09-05', reference: 'INV-2026-0069', amount: 150000, uploadedAt: '2026-08-16', uploadedBy: 'Kioko Agri Supplies Ltd', status: 'under-verification', linkedAdvanceReference: null },
]

export const PERIOD_ADVANCES: readonly PeriodAdvance[] = [
  { id: 'advance-twiga-84', periodId: 'twiga-2026-09-15', reference: 'FR-2026-0084', requestDate: '2026-08-02', disbursementDate: '2026-08-03', principal: 500000, dailyMarkupRate: 0.0017, tenorDays: 44, markup: 37400, totalRepayable: 537400, status: 'disbursed' },
  { id: 'advance-twiga-91', periodId: 'twiga-2026-09-15', reference: 'FR-2026-0091', requestDate: '2026-08-16', disbursementDate: null, principal: 100000, dailyMarkupRate: 0.0017, tenorDays: 30, markup: 5100, totalRepayable: 105100, status: 'under-review' },
]

export function relationshipModelLabel(model: BuyerRelationshipModel): string {
  return model === 'partner-buyer' ? 'Partner Buyer' : 'Counterparty Buyer'
}

export function periodStatusTone(status: DynamicPeriodStatus): string {
  if (status === 'open') return 'status-info'
  if (status === 'verification' || status === 'cutoff') return 'status-warning'
  if (status === 'overdue') return 'status-danger'
  if (status === 'settled') return 'status-success'
  return 'status-neutral'
}

export function invoiceStatusLabel(status: PeriodInvoiceStatus): string {
  const labels: Record<PeriodInvoiceStatus, string> = {
    eligible: 'Eligible',
    'under-verification': 'Under verification',
    financed: 'Financed',
    excluded: 'Not eligible',
  }
  return labels[status]
}

export function invoiceStatusTone(status: PeriodInvoiceStatus): string {
  if (status === 'under-verification') return 'status-warning'
  if (status === 'eligible' || status === 'financed') return 'status-success'
  return 'status-neutral'
}

export function advanceStatusLabel(status: AdvanceStatus): string {
  const labels: Record<AdvanceStatus, string> = {
    submitted: 'Submitted',
    'under-review': 'Under review',
    approved: 'Approved',
    disbursed: 'Disbursed',
    repaid: 'Repaid',
  }
  return labels[status]
}

export function advanceStatusTone(status: AdvanceStatus): string {
  if (status === 'disbursed') return 'status-info'
  if (status === 'repaid') return 'status-success'
  if (status === 'under-review' || status === 'approved') return 'status-warning'
  return 'status-neutral'
}

export function formatKes(value: number): string {
  return `KES ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(value)}`
}

export function formatDate(value: string): string {
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(date)
    .replace(',', '')
}
