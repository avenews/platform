export type SupplierRelationshipModel = 'partner-buyer' | 'counterparty-buyer'
export type SupplierInvoiceEligibility = 'eligible' | 'verification-pending' | 'financed' | 'excluded'
export type SupplierAdvanceStatus = 'submitted' | 'under-review' | 'approved' | 'disbursed' | 'repaid'

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

export const SUPPLIER_FINANCING_PERIODS: readonly SupplierFinancingPeriod[] = []
export const SUPPLIER_PERIOD_INVOICES: readonly SupplierPeriodInvoice[] = []
export const SUPPLIER_ADVANCES: readonly SupplierAdvance[] = []

export function supplierRelationshipLabel(model: SupplierRelationshipModel): string {
  return model === 'partner-buyer' ? 'Partner Buyer' : 'Counterparty Buyer'
}

export function supplierPeriodStatusLabel(period: SupplierFinancingPeriod): string {
  if (period.lifecycleStatus === 'pending') return 'Requests not open yet'
  if (period.lifecycleStatus === 'open') return 'Open for requests'
  if (period.lifecycleStatus === 'cutoff') return 'Request window closed'
  if (period.lifecycleStatus === 'overdue') return 'Awaiting buyer payment'
  if (period.lifecycleStatus === 'closed') return 'Complete'
  return 'Closed, no financing taken'
}

export function supplierPeriodStatusTone(period: SupplierFinancingPeriod): string {
  if (period.lifecycleStatus === 'open') return 'status-info'
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
