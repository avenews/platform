export type SupplierRelationshipModel = 'partner-buyer' | 'counterparty-buyer'
export type SupplierInvoiceEligibility = 'eligible' | 'verification-pending' | 'financed' | 'excluded'
export type SupplierAdvanceStatus = 'submitted' | 'under-review' | 'approved' | 'disbursed' | 'repaid'
export type SupplierBindingConstraint = 'borrowing-base' | 'relationship-limit' | 'facility-limit' | 'business-limit' | 'request-window' | 'verification-pending' | 'settlement'

export interface SupplierFinancingPeriod {
  id: string
  relationshipId: string
  buyerName: string
  relationshipModel: SupplierRelationshipModel
  dueDate: string
  daysRemaining: number
  lifecycleStatus: 'pending' | 'open' | 'cutoff' | 'expired' | 'overdue' | 'closed'
  totalReceivables: number
  eligibleReceivables: number
  advanceRate: number
  borrowingBase: number
  drawnPrincipal: number
  reservedAmount: number
  availableToWithdraw: number
  bindingConstraint: SupplierBindingConstraint
  relationshipCreditRemaining: number
  facilityCreditRemaining: number
  businessCreditRemaining: number
  fundsRequestOpensAt: string
  fundsRequestCutoffAt: string
  verificationPendingCount: number
  lastRecalculatedAt: string
}

export interface SupplierPeriodInvoice {
  id: string
  periodId: string
  reference: string
  amount: number
  uploadedAt: string
  uploadedBy: string
  eligibilityStatus: SupplierInvoiceEligibility
  linkedAdvanceId: string | null
}

export interface SupplierAdvance {
  id: string
  periodId: string
  reference: string
  requestDate: string
  disbursementDate: string | null
  principal: number
  dailyMarkupRate: number
  tenorDays: number
  finalMarkup: number
  totalRepayable: number
  status: SupplierAdvanceStatus
}

export const SUPPLIER_FINANCING_PERIODS: readonly SupplierFinancingPeriod[] = [
  {
    id: 'asfgroup_twiga_2026-05-30',
    relationshipId: 'cl_asf_twiga',
    buyerName: 'Twiga Foods Ltd',
    relationshipModel: 'partner-buyer',
    dueDate: '2026-09-15',
    daysRemaining: 29,
    lifecycleStatus: 'open',
    totalReceivables: 1750000,
    eligibleReceivables: 1750000,
    advanceRate: 0.85,
    borrowingBase: 1487500,
    drawnPrincipal: 500000,
    reservedAmount: 100000,
    availableToWithdraw: 650000,
    bindingConstraint: 'relationship-limit',
    relationshipCreditRemaining: 650000,
    facilityCreditRemaining: 4300000,
    businessCreditRemaining: 4800000,
    fundsRequestOpensAt: '2026-07-17',
    fundsRequestCutoffAt: '2026-09-08',
    verificationPendingCount: 0,
    lastRecalculatedAt: '2026-08-17T07:00:00Z',
  },
  {
    id: 'asfgroup_twiga_2026-06-15a',
    relationshipId: 'cl_asf_twiga',
    buyerName: 'Twiga Foods Ltd',
    relationshipModel: 'partner-buyer',
    dueDate: '2026-10-30',
    daysRemaining: 74,
    lifecycleStatus: 'pending',
    totalReceivables: 700000,
    eligibleReceivables: 700000,
    advanceRate: 0.85,
    borrowingBase: 595000,
    drawnPrincipal: 0,
    reservedAmount: 0,
    availableToWithdraw: 0,
    bindingConstraint: 'request-window',
    relationshipCreditRemaining: 900000,
    facilityCreditRemaining: 4300000,
    businessCreditRemaining: 4800000,
    fundsRequestOpensAt: '2026-08-31',
    fundsRequestCutoffAt: '2026-10-23',
    verificationPendingCount: 0,
    lastRecalculatedAt: '2026-08-17T07:00:00Z',
  },
  {
    id: 'asfgroup_twiga_2026-06-15b',
    relationshipId: 'cl_asf_fresh',
    buyerName: 'FreshProduce Kenya Ltd',
    relationshipModel: 'counterparty-buyer',
    dueDate: '2026-09-05',
    daysRemaining: 19,
    lifecycleStatus: 'open',
    totalReceivables: 400000,
    eligibleReceivables: 0,
    advanceRate: 0.85,
    borrowingBase: 0,
    drawnPrincipal: 0,
    reservedAmount: 0,
    availableToWithdraw: 0,
    bindingConstraint: 'verification-pending',
    relationshipCreditRemaining: 0,
    facilityCreditRemaining: 2300000,
    businessCreditRemaining: 2800000,
    fundsRequestOpensAt: '2026-07-07',
    fundsRequestCutoffAt: '2026-08-29',
    verificationPendingCount: 2,
    lastRecalculatedAt: '2026-08-17T07:00:00Z',
  },
]

export const SUPPLIER_PERIOD_INVOICES: readonly SupplierPeriodInvoice[] = [
  { id: 'spi_twiga_001', periodId: 'asfgroup_twiga_2026-05-30', reference: 'INV-2026-0042', amount: 1000000, uploadedAt: '2026-08-01', uploadedBy: 'Twiga Foods Ltd', eligibilityStatus: 'financed', linkedAdvanceId: 'adv_twiga_001' },
  { id: 'spi_twiga_002', periodId: 'asfgroup_twiga_2026-05-30', reference: 'INV-2026-0043', amount: 750000, uploadedAt: '2026-08-05', uploadedBy: 'Twiga Foods Ltd', eligibilityStatus: 'eligible', linkedAdvanceId: null },
  { id: 'spi_twiga_003', periodId: 'asfgroup_twiga_2026-06-15a', reference: 'INV-2026-0061', amount: 700000, uploadedAt: '2026-08-15', uploadedBy: 'Twiga Foods Ltd', eligibilityStatus: 'eligible', linkedAdvanceId: null },
  { id: 'spi_fresh_001', periodId: 'asfgroup_twiga_2026-06-15b', reference: 'INV-2026-0068', amount: 250000, uploadedAt: '2026-08-16', uploadedBy: 'Kioko Agri Supplies Ltd', eligibilityStatus: 'verification-pending', linkedAdvanceId: null },
  { id: 'spi_fresh_002', periodId: 'asfgroup_twiga_2026-06-15b', reference: 'INV-2026-0069', amount: 150000, uploadedAt: '2026-08-16', uploadedBy: 'Kioko Agri Supplies Ltd', eligibilityStatus: 'verification-pending', linkedAdvanceId: null },
]

export const SUPPLIER_ADVANCES: readonly SupplierAdvance[] = [
  { id: 'adv_twiga_001', periodId: 'asfgroup_twiga_2026-05-30', reference: 'FR-2026-0084', requestDate: '2026-08-02', disbursementDate: '2026-08-03', principal: 500000, dailyMarkupRate: 0.0017, tenorDays: 44, finalMarkup: 37400, totalRepayable: 537400, status: 'disbursed' },
  { id: 'adv_twiga_002', periodId: 'asfgroup_twiga_2026-05-30', reference: 'FR-2026-0091', requestDate: '2026-08-16', disbursementDate: null, principal: 100000, dailyMarkupRate: 0.0017, tenorDays: 30, finalMarkup: 5100, totalRepayable: 105100, status: 'under-review' },
]

export function supplierRelationshipLabel(model: SupplierRelationshipModel): string {
  return model === 'partner-buyer' ? 'Partner Buyer' : 'Counterparty Buyer'
}

export function supplierPeriodStatusLabel(period: SupplierFinancingPeriod): string {
  if (period.bindingConstraint === 'verification-pending') return 'Invoices under review'
  if (period.lifecycleStatus === 'pending') return `Opens on ${period.fundsRequestOpensAt}`
  if (period.lifecycleStatus === 'open') return period.availableToWithdraw > 0 ? 'Open for requests' : 'No availability'
  if (period.lifecycleStatus === 'cutoff') return 'Request window closed'
  if (period.lifecycleStatus === 'overdue') return 'Awaiting buyer payment'
  if (period.lifecycleStatus === 'closed') return 'Complete'
  return 'Closed, no financing taken'
}

export function supplierPeriodStatusTone(period: SupplierFinancingPeriod): string {
  if (period.bindingConstraint === 'verification-pending') return 'status-warning'
  if (period.lifecycleStatus === 'open' && period.availableToWithdraw > 0) return 'status-info'
  if (period.lifecycleStatus === 'closed') return 'status-success'
  if (period.lifecycleStatus === 'overdue') return 'status-danger'
  if (period.lifecycleStatus === 'cutoff') return 'status-warning'
  return 'status-neutral'
}

export function supplierInvoiceStatusLabel(status: SupplierInvoiceEligibility): string {
  const labels: Record<SupplierInvoiceEligibility, string> = {
    eligible: 'Eligible',
    'verification-pending': 'Under verification',
    financed: 'Financed',
    excluded: 'Not eligible',
  }
  return labels[status]
}

export function supplierInvoiceStatusTone(status: SupplierInvoiceEligibility): string {
  if (status === 'verification-pending') return 'status-warning'
  if (status === 'eligible' || status === 'financed') return 'status-success'
  return 'status-neutral'
}

export function supplierAdvanceStatusLabel(status: SupplierAdvanceStatus): string {
  const labels: Record<SupplierAdvanceStatus, string> = {
    submitted: 'Submitted',
    'under-review': 'Under review',
    approved: 'Approved',
    disbursed: 'Disbursed',
    repaid: 'Repaid',
  }
  return labels[status]
}

export function supplierAdvanceStatusTone(status: SupplierAdvanceStatus): string {
  if (status === 'disbursed') return 'status-live'
  if (status === 'repaid') return 'status-success'
  if (status === 'under-review' || status === 'approved') return 'status-warning'
  return 'status-info'
}
