export type ProductCode = 'ACL' | 'ABF' | 'SF' | 'ASF' | 'ASFX'
export type FinancingStatus =
  | 'requested'
  | 'validating'
  | 'offered'
  | 'live'
  | 'repaid'
  | 'delinquent'
  | 'default'
  | 'cancelled'
  | 'declined'

export type InvoiceFinancingStatus =
  | 'eligible-pending-validation'
  | 'eligible'
  | 'partially-financed'
  | 'financed'
  | 'rejected'
  | 'not-eligible'

export type PortalRole = 'admin' | 'user'
export type UserStatus = 'active' | 'pending' | 'deactivated'

export interface BusinessSummary {
  name: string
  availableCredit: number
  activeLoansCount: number
  duePeriodsCount: number
  overdueLoansCount: number
  totalAmountDue: number
  nextRepaymentAmount: number
  nextRepaymentDate: string
}

export interface CreditLine {
  id: string
  product: ProductCode
  partner: string
  totalLimit: number
  used: number
  available: number
  rewardsBalance: number
  status: 'available' | 'limit-reached'
  fundsRequestAvailable: boolean
}

export interface Installment {
  dueDate: string
  status: 'upcoming' | 'paid' | 'overdue'
}

export interface FinancingRecord {
  id: string
  product: ProductCode
  partner: string
  status: FinancingStatus
  principal: number
  disbursementDate: string | null
  fundsRequestId: string
  totalRepaid: number
  balance: number
  installments: Installment[]
}

export interface InvoiceRecord {
  id: string
  invoiceNumber: string
  partner: string
  amount: number
  dueDate: string | null
  financingStatus: InvoiceFinancingStatus
  invoiceFileUrl: string | null
  product: ProductCode | null
}

export interface InvoiceGroup {
  id: string
  buyerName: string
  dueDate: string
  approvedInvoiceCount: number
  approvedInvoiceValue: number
  maxRequestable: number
  status: 'ready' | 'validating'
}

export interface PortalUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: PortalRole
  status: Exclude<UserStatus, 'pending'>
  invitedAt: string
  lastActiveAt: string | null
}

export interface Invitation {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: PortalRole
  invitedAt: string
  expiresAt: string
}

export const BUSINESS: BusinessSummary = {
  name: 'Kioko Agri Supplies Ltd',
  availableCredit: 5800000,
  activeLoansCount: 3,
  duePeriodsCount: 2,
  overdueLoansCount: 1,
  totalAmountDue: 2500000,
  nextRepaymentAmount: 320000,
  nextRepaymentDate: '2026-05-25',
}

export const CREDIT_LINES: CreditLine[] = [
  { id: 'cl_asf_twiga', product: 'ASF', partner: 'Twiga Foods Ltd', totalLimit: 6000000, used: 850000, available: 5150000, rewardsBalance: 0, status: 'available', fundsRequestAvailable: true },
  { id: 'cl_acl_general', product: 'ACL', partner: 'Avenews', totalLimit: 2500000, used: 1200000, available: 1300000, rewardsBalance: 48000, status: 'available', fundsRequestAvailable: true },
  { id: 'cl_abf_naivas', product: 'ABF', partner: 'Naivas Fresh Produce', totalLimit: 1500000, used: 1500000, available: 0, rewardsBalance: 0, status: 'limit-reached', fundsRequestAvailable: false },
  { id: 'cl_sf_stockist', product: 'SF', partner: 'GreenHarvest Distributors', totalLimit: 900000, used: 100000, available: 800000, rewardsBalance: 0, status: 'available', fundsRequestAvailable: true },
  { id: 'cl_asfx_express', product: 'ASFX', partner: 'Kisumu Buyers Co-op', totalLimit: 1800000, used: 0, available: 1800000, rewardsBalance: 0, status: 'available', fundsRequestAvailable: false },
  { id: 'cl_abf_equity', product: 'ABF', partner: 'Equity Bank Agri Partners', totalLimit: 3000000, used: 0, available: 3000000, rewardsBalance: 0, status: 'available', fundsRequestAvailable: true },
  { id: 'cl_asf_fresh', product: 'ASF', partner: 'FreshProduce Kenya Ltd', totalLimit: 2000000, used: 2000000, available: 0, rewardsBalance: 0, status: 'limit-reached', fundsRequestAvailable: false },
  { id: 'cl_acl_paused', product: 'ACL', partner: 'Avenews', totalLimit: 500000, used: 0, available: 0, rewardsBalance: 0, status: 'limit-reached', fundsRequestAvailable: false },
  { id: 'cl_demo_requested', product: 'ACL', partner: 'Mt Kenya Cooperative', totalLimit: 1500000, used: 0, available: 1500000, rewardsBalance: 0, status: 'available', fundsRequestAvailable: false },
  { id: 'cl_demo_validating', product: 'SF', partner: 'Nakuru Stockists', totalLimit: 2200000, used: 0, available: 2200000, rewardsBalance: 0, status: 'available', fundsRequestAvailable: false },
  { id: 'cl_demo_offered', product: 'ASFX', partner: 'Mombasa Buyers Network', totalLimit: 1800000, used: 0, available: 1800000, rewardsBalance: 0, status: 'available', fundsRequestAvailable: false },
]

export const FINANCING_RECORDS: FinancingRecord[] = [
  { id: 'loan_asf_001', product: 'ASF', partner: 'Twiga Foods Ltd', status: 'delinquent', principal: 850000, disbursementDate: '2026-04-11', fundsRequestId: 'fr_2026_0421', totalRepaid: 0, balance: 850000, installments: [{ dueDate: '2026-05-11', status: 'overdue' }] },
  { id: 'loan_acl_001', product: 'ACL', partner: 'Avenews', status: 'live', principal: 1400000, disbursementDate: '2026-03-18', fundsRequestId: 'fr_2026_0318', totalRepaid: 200000, balance: 1400000, installments: [{ dueDate: '2026-04-25', status: 'paid' }, { dueDate: '2026-05-25', status: 'upcoming' }] },
  { id: 'loan_abf_001', product: 'ABF', partner: 'Naivas Fresh Produce', status: 'repaid', principal: 459000, disbursementDate: '2026-04-07', fundsRequestId: 'fr_2026_0407', totalRepaid: 501000, balance: 0, installments: [{ dueDate: '2026-04-21', status: 'paid' }] },
  { id: 'loan_sf_001', product: 'SF', partner: 'GreenHarvest Distributors', status: 'validating', principal: 100000, disbursementDate: null, fundsRequestId: 'fr_2026_0501', totalRepaid: 0, balance: 100000, installments: [{ dueDate: '2026-06-01', status: 'upcoming' }] },
  { id: 'loan_asfx_001', product: 'ASFX', partner: 'Kisumu Buyers Co-op', status: 'validating', principal: 900000, disbursementDate: null, fundsRequestId: 'fr_2026_0502', totalRepaid: 0, balance: 900000, installments: [] },
  { id: 'loan_acl_req_001', product: 'ACL', partner: 'Avenews', status: 'requested', principal: 600000, disbursementDate: null, fundsRequestId: 'fr_2026_0510', totalRepaid: 0, balance: 600000, installments: [] },
  { id: 'loan_sf_offered_001', product: 'SF', partner: 'Meru Agrovets Ltd', status: 'offered', principal: 250000, disbursementDate: null, fundsRequestId: 'fr_2026_0508', totalRepaid: 0, balance: 250000, installments: [] },
  { id: 'loan_asf_def_001', product: 'ASF', partner: 'Highlands Fresh Produce', status: 'default', principal: 1200000, disbursementDate: '2026-01-10', fundsRequestId: 'fr_2026_0110', totalRepaid: 0, balance: 1200000, installments: [{ dueDate: '2026-02-10', status: 'overdue' }] },
  { id: 'loan_abf_can_001', product: 'ABF', partner: 'Eastleigh Traders Co.', status: 'cancelled', principal: 180000, disbursementDate: null, fundsRequestId: 'fr_2026_0430', totalRepaid: 0, balance: 0, installments: [] },
  { id: 'loan_asfx_dec_001', product: 'ASFX', partner: 'Nakuru Grain Stores', status: 'declined', principal: 320000, disbursementDate: null, fundsRequestId: 'fr_2026_0425', totalRepaid: 0, balance: 0, installments: [] },
  { id: 'loan_abf_002', product: 'ABF', partner: 'Quick Mart Stores', status: 'live', principal: 380000, disbursementDate: '2026-04-22', fundsRequestId: 'fr_2026_0422', totalRepaid: 0, balance: 380000, installments: [{ dueDate: '2026-06-22', status: 'upcoming' }] },
]

export const INVOICES: InvoiceRecord[] = [
  { id: 'inv_101', invoiceNumber: 'INV-2026-0042', partner: 'Twiga Foods Ltd', amount: 1000000, dueDate: '2026-05-30', financingStatus: 'eligible', invoiceFileUrl: 'https://example.com/files/INV-2026-0042.pdf', product: 'ASF' },
  { id: 'inv_102', invoiceNumber: 'INV-2026-0043', partner: 'Twiga Foods Ltd', amount: 750000, dueDate: '2026-05-30', financingStatus: 'eligible', invoiceFileUrl: 'https://example.com/files/INV-2026-0043.pdf', product: 'ASF' },
  { id: 'inv_201', invoiceNumber: 'INV-2026-0019', partner: 'GreenHarvest Distributors', amount: 180000, dueDate: null, financingStatus: 'eligible-pending-validation', invoiceFileUrl: 'https://example.com/files/INV-2026-0019.pdf', product: 'SF' },
  { id: 'inv_301', invoiceNumber: 'INV-2026-0007', partner: 'Naivas Fresh Produce', amount: 540000, dueDate: '2026-04-15', financingStatus: 'partially-financed', invoiceFileUrl: 'https://example.com/files/INV-2026-0007.pdf', product: 'ABF' },
  { id: 'inv_401', invoiceNumber: 'INV-2026-0028', partner: 'Kisumu Buyers Co-op', amount: 900000, dueDate: '2026-06-08', financingStatus: 'eligible-pending-validation', invoiceFileUrl: 'https://example.com/files/INV-2026-0028.pdf', product: 'ASFX' },
  { id: 'inv_501', invoiceNumber: 'INV-2026-0002', partner: 'Makueni Aggregators', amount: 120000, dueDate: '2026-03-03', financingStatus: 'rejected', invoiceFileUrl: 'https://example.com/files/INV-2026-0002.pdf', product: 'ASF' },
  { id: 'inv_601', invoiceNumber: 'INV-2026-0001', partner: 'Avenews', amount: 90000, dueDate: '2026-02-20', financingStatus: 'not-eligible', invoiceFileUrl: null, product: null },
  { id: 'inv_701', invoiceNumber: 'INV-2026-0051', partner: 'Naivas Fresh Produce', amount: 420000, dueDate: '2026-05-12', financingStatus: 'financed', invoiceFileUrl: 'https://example.com/files/INV-2026-0051.pdf', product: 'ABF' },
]

export const INVOICE_GROUPS: InvoiceGroup[] = [
  { id: 'asfgroup_twiga_2026-05-30', buyerName: 'Twiga Foods Ltd', dueDate: '2026-05-30', approvedInvoiceCount: 2, approvedInvoiceValue: 1750000, maxRequestable: 1487500, status: 'ready' },
  { id: 'asfgroup_twiga_2026-06-15a', buyerName: 'Twiga Foods Ltd', dueDate: '2026-06-15', approvedInvoiceCount: 1, approvedInvoiceValue: 700000, maxRequestable: 595000, status: 'ready' },
  { id: 'asfgroup_twiga_2026-06-15b', buyerName: 'Twiga Foods Ltd', dueDate: '2026-06-15', approvedInvoiceCount: 1, approvedInvoiceValue: 400000, maxRequestable: 0, status: 'validating' },
]

export const USERS: PortalUser[] = [
  { id: 'usr_001', firstName: 'Amara', lastName: 'Osei', email: 'amara.osei@kiokoagri.co.ke', phone: '+254712345678', role: 'admin', status: 'active', invitedAt: '2026-01-10', lastActiveAt: '2026-05-05' },
  { id: 'usr_002', firstName: 'James', lastName: 'Mutua', email: 'james.mutua@kiokoagri.co.ke', phone: '+254723456789', role: 'user', status: 'active', invitedAt: '2026-02-15', lastActiveAt: '2026-05-04' },
  { id: 'usr_003', firstName: 'Faith', lastName: "Ndung'u", email: 'faith.ndungu@kiokoagri.co.ke', phone: '+254734567890', role: 'user', status: 'active', invitedAt: '2026-03-01', lastActiveAt: '2026-04-28' },
  { id: 'usr_004', firstName: 'Peter', lastName: 'Kamau', email: 'peter.kamau@kiokoagri.co.ke', phone: null, role: 'user', status: 'deactivated', invitedAt: '2026-01-20', lastActiveAt: '2026-03-15' },
]

export const INVITATIONS: Invitation[] = [
  { id: 'invite_001', firstName: 'Miriam', lastName: 'Achieng', email: 'miriam.achieng@kiokoagri.co.ke', phone: '+254745678901', role: 'user', invitedAt: '2026-05-02', expiresAt: '2026-05-09' },
  { id: 'invite_002', firstName: 'David', lastName: 'Omondi', email: 'david.omondi@kiokoagri.co.ke', phone: null, role: 'admin', invitedAt: '2026-05-04', expiresAt: '2026-05-11' },
]

export const PROFILE = {
  contact: {
    id: 'usr_001',
    firstName: 'Amara',
    lastName: 'Osei',
    email: 'amara.osei@kiokoagri.co.ke',
    phone: '+254712345678',
    role: 'admin' as PortalRole,
  },
  business: {
    name: BUSINESS.name,
    activeCreditLinesCount: 4,
    activeLoansCount: 2,
  },
  accountManager: {
    name: 'Grace Wanjiku',
    phone: '+254700000000',
    email: 'grace@avenews-gt.com',
  },
}

export function productLabel(code: ProductCode | null): string {
  const labels: Record<ProductCode, string> = {
    ACL: 'Agri Credit Line (ACL)',
    ABF: 'Agri Buyer Financing (ABF)',
    SF: 'Stockist Financing (STF)',
    ASF: 'Invoice Financing (INF)',
    ASFX: 'Invoice Financing Express (INFX)',
  }
  return code ? labels[code] : 'Not assigned'
}

export function formatKes(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Nil'
  return `Ksh ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(value)}`
}

export function formatDate(value: string | null | undefined, short = false): string {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '-'
  const options: Intl.DateTimeFormatOptions = short
    ? { day: '2-digit', month: 'short', year: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' }
  return new Intl.DateTimeFormat('en-GB', options).format(date).replace(',', '')
}

export function fullName(value: { firstName: string; lastName: string }): string {
  return `${value.firstName} ${value.lastName}`
}

export function statusLabel(status: FinancingStatus): string {
  const labels: Record<FinancingStatus, string> = {
    requested: 'Requested',
    validating: 'Validating',
    offered: 'Offered',
    live: 'Live',
    repaid: 'Repaid',
    delinquent: 'Delinquent',
    default: 'Default',
    cancelled: 'Cancelled',
    declined: 'Declined',
  }
  return labels[status]
}

export function statusTone(status: FinancingStatus): string {
  if (status === 'live') return 'status-live'
  if (status === 'repaid') return 'status-success'
  if (status === 'delinquent' || status === 'default' || status === 'declined') return 'status-danger'
  if (status === 'offered' || status === 'validating') return 'status-warning'
  if (status === 'requested') return 'status-info'
  return 'status-neutral'
}

export function invoiceStatusLabel(status: InvoiceFinancingStatus): string {
  const labels: Record<InvoiceFinancingStatus, string> = {
    'eligible-pending-validation': 'Pending Validation',
    eligible: 'Eligible',
    'partially-financed': 'Partially Financed',
    financed: 'Financed',
    rejected: 'Rejected',
    'not-eligible': 'Not Eligible',
  }
  return labels[status]
}

export function invoiceStatusTone(status: InvoiceFinancingStatus): string {
  if (status === 'eligible' || status === 'financed') return 'status-success'
  if (status === 'eligible-pending-validation' || status === 'partially-financed') return 'status-warning'
  if (status === 'rejected') return 'status-danger'
  return 'status-neutral'
}
