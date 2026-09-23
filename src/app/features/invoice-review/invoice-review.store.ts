import { Injectable, OnDestroy } from '@angular/core'
import { customerWorkspaceById } from '../../core/experience/customer-product-workspace.data'
import { invoiceFinancingInvoices } from '../../core/experience/financing-documents.data'

/** Browser-only, fictional review fixtures. Never calls a CRM, bank or storage API. */
export const REVIEW_DATE = '2026-09-23'
export const REVIEW_LIMIT = 3_000_000
export type InvoiceRole = 'supplier' | 'partner'
export type UploadOwner = 'supplier' | 'buyer'
export interface ClearingAccount {
  bank: string; name: string; number: string; branch: string; branchCode: string
  paybill?: string; mpesaReference?: string
}
export interface ReviewRelationship {
  id: string; supplier: string; buyer: string; kind: 'Partner Buyer' | 'Counterparty Buyer'
  owner: UploadOwner; pod: boolean | null; sublimit: number; advanceRate: number
  dailyMarkup: number; paymentTerms: string; minDays: number; maxDays: number
  rebateRate: number; rebatePaid: number; clearing: ClearingAccount | null
}
export interface ReviewInvoice {
  id: string; relationshipId: string; periodId?: string; reference: string
  buyer: string; supplier: string; dueDate: string; amount: number | null
  status: string; eligible: boolean; fileName?: string; fileUrl?: string
}
export interface ReviewPeriod {
  id: string; reference: string; relationshipId: string; dueDate: string
  disbursed: number; principalCollected: number; buyerPaid: number; reserved: number
  disbursedDate?: string; closed: boolean; processing?: boolean
}
export interface UploadGroup {
  id: string; relationshipId: string; dueDate: string; files: File[]; pod: File[]
}
export interface UploadReceipt {
  id: string; role: InvoiceRole; createdAt: string; confirmedAt: string; actor: string; actorId: string
  confirmation: string; groupCount: number; fileCount: number; groups: {
    relationshipId: string; dueDate: string; invoiceNames: string[]; podNames: string[]
  }[]
}
export interface ReviewAttachment {
  id: string; periodId?: string; relationshipId: string; fileName: string; fileUrl: string
}
export const DELIVERY_CONFIRMATION = 'I confirm that all submitted invoices reflect completed deliveries, not pre-delivery or disputed invoices.'
export const FILE_POLICY = {
  maxGroups: 20, maxFiles: 10, maxBytes: 10 * 1024 * 1024,
  extensions: ['pdf', 'jpg', 'jpeg', 'png', 'csv', 'xlsx'],
  documentExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
}
export function dateDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}
export function positive(value: number): number { return Math.max(0, Math.round(value * 100) / 100) }
export function percent(value: number): string { return `${Number((value * 100).toFixed(3))}%` }
function demoAccount(supplier: string, id: string): ClearingAccount {
  return { bank: 'Demo bank - do not pay', name: `Demo clearing account - ${supplier}`,
    number: `DEMO-${id.toUpperCase()}`, branch: 'Demo branch', branchCode: 'DEMO',
    ...(id === 'inf-twiga' ? { paybill: 'DEMO-PAYBILL', mpesaReference: 'DEMO-KIOKO' } : {}) }
}

@Injectable({ providedIn: 'root' })
export class InvoiceReviewStore implements OnDestroy {
  readonly asOf = REVIEW_DATE
  readonly approvedLimit = REVIEW_LIMIT
  readonly customer = 'Kioko Agri Supplies Ltd'
  readonly partner = 'Twiga Foods Ltd'
  readonly relationships: ReviewRelationship[] = []
  readonly periods: ReviewPeriod[] = []
  readonly invoices: ReviewInvoice[] = []
  readonly receipts: UploadReceipt[] = []
  readonly attachments: ReviewAttachment[] = []
  readonly requests: {id: string; periodId: string; amount: number; createdAt: string}[] = []
  private readonly objectUrls: string[] = []
  private sequence = 0

  constructor() {
    const workspace = customerWorkspaceById('invoice-financing')!
    for (const r of workspace.relationships) this.relationships.push({
      id: r.id, supplier: this.customer, buyer: r.name,
      kind: r.relationshipType as ReviewRelationship['kind'],
      owner: r.invoiceUploadOwner === 'client' ? 'supplier' : 'buyer', pod: r.invoiceUploadOwner === 'client',
      sublimit: r.limit, advanceRate: 0.85, dailyMarkup: 0.0017,
      paymentTerms: 'Pay on the agreed invoice due date', minDays: 7, maxDays: 60,
      rebateRate: r.invoiceUploadOwner === 'partner-buyer' ? 0.01 : 0, rebatePaid: 0,
      clearing: demoAccount(this.customer, r.id),
    })
    for (const p of workspace.periods) this.periods.push({
      id: p.id, reference: p.reference, relationshipId: p.relationshipId,
      dueDate: p.repaymentDueDate, disbursed: p.amountFinanced, principalCollected: p.totalRepaid,
      buyerPaid: p.statusKey === 'repaid' ? (p.eligibleReceivables ?? 0) : p.totalRepaid,
      reserved: p.statusKey === 'requested' ? 292_000 : 0,
      disbursedDate: p.disbursementDate, closed: p.statusKey === 'repaid',
    })
    for (const d of invoiceFinancingInvoices()) {
      const p = this.periods.find(period => period.id === d.periodId)!
      this.invoices.push({ id: d.id, periodId: p.id, relationshipId: p.relationshipId,
        reference: d.reference, buyer: d.counterparty, supplier: this.customer,
        dueDate: d.dueDate ?? p.dueDate, amount: d.amount ?? null,
        status: d.status ?? 'Under review', eligible: d.status !== 'Not financed',
        fileName: d.fileName, fileUrl: d.fileUrl })
    }
    // Explicit records without files reconcile the original demonstration totals.
    this.addInvoice('inf-twiga-requested', 'DEMO-TWIGA-1015', 720_000, 'Eligible', true)
    this.addInvoice('inf-fresh-overdue', 'DEMO-FRESH-0815', 300_000, 'Overdue', true)
    this.addInvoice('inf-fresh-repaid', 'DEMO-FRESH-0630', 500_000, 'Paid', true)
    const seeds = [
      ['nairobi', 'Nairobi Fresh Traders Ltd', 940000, 400000, 200000, '2026-09-30', 6],
      ['makueni', 'Makueni Produce Company', 180000, 0, 180000, '2026-07-31', 2],
      ['highlands', 'Highlands Food Processors', 1320000, 900000, 0, '2026-10-15', 7],
      ['rift', 'Rift Valley Grains Ltd', 590000, 300000, 0, '2026-10-20', 5],
      ['coast', 'Coastline Produce Ltd', 1040000, 650000, 150000, '2026-08-15', 9],
      ['kericho', 'Kericho Fresh Foods', 720000, 500000, 0, '2026-09-10', 4],
      ['eldoret', 'Eldoret Farm Inputs', 480000, 250000, 0, '2026-10-10', 3],
    ] as const
    for (const [id, supplier, value, disbursed, paid, dueDate, count] of seeds) {
      const relationshipId = `partner-${id}`
      this.relationships.push({ id: relationshipId, supplier, buyer: this.partner,
        kind: 'Partner Buyer', owner: 'buyer', pod: false, sublimit: 1_500_000,
        advanceRate: 0.85, dailyMarkup: 0.0017, paymentTerms: 'Pay on the agreed invoice due date',
        minDays: 7, maxDays: 60, rebateRate: id === 'nairobi' ? 0.008 : 0.01,
        rebatePaid: id === 'coast' ? 500 : 0,
        clearing: id === 'eldoret' ? null : demoAccount(supplier, id) })
      const periodId = `pb-${id}-${dueDate}`
      this.periods.push({ id: periodId, reference: `PER-${dueDate}-${id.toUpperCase()}`,
        relationshipId, dueDate, disbursed, principalCollected: Math.min(disbursed, paid),
        buyerPaid: paid, reserved: 0, disbursedDate: disbursed ? '2026-08-01' : undefined,
        closed: paid >= value })
      const portion = Math.floor(value / count)
      for (let i = 0; i < count; i++) this.addInvoice(periodId, `DEMO-${id.toUpperCase()}-${i + 1}`,
        i === count - 1 ? value - portion * i : portion, paid >= value ? 'Paid' : 'Approved', true)
    }
  }
  private addInvoice(periodId: string, reference: string, amount: number, status: string, eligible: boolean): void {
    const p = this.periods.find(item => item.id === periodId)!
    const r = this.relationship(p.relationshipId)
    this.invoices.push({ id: reference, reference, periodId, relationshipId: r.id,
      buyer: r.buyer, supplier: r.supplier, dueDate: p.dueDate, amount, status, eligible })
  }
  relationship(id: string): ReviewRelationship {
    const r = this.relationships.find(item => item.id === id)
    if (!r) throw new Error('Choose an available financing relationship.')
    return r
  }
  relationshipsFor(role: InvoiceRole): ReviewRelationship[] {
    return this.relationships.filter(r => role === 'supplier' ? r.supplier === this.customer : r.buyer === this.partner)
  }
  periodsFor(role: InvoiceRole): ReviewPeriod[] {
    const ids = new Set(this.relationshipsFor(role).map(r => r.id))
    return this.periods.filter(p => ids.has(p.relationshipId))
  }
  invoicesFor(role: InvoiceRole): ReviewInvoice[] {
    const ids = new Set(this.relationshipsFor(role).map(r => r.id))
    return this.invoices.filter(i => ids.has(i.relationshipId))
  }
  periodInvoices(p: ReviewPeriod): ReviewInvoice[] { return this.invoices.filter(i => i.periodId === p.id) }
  relationshipPeriods(r: ReviewRelationship): ReviewPeriod[] { return this.periods.filter(p => p.relationshipId === r.id) }
  invoiceValue(p: ReviewPeriod): number { return this.periodInvoices(p).reduce((n,i) => n + (i.amount ?? 0), 0) }
  eligibleValue(p: ReviewPeriod): number { return this.periodInvoices(p).filter(i => i.eligible).reduce((n,i) => n + (i.amount ?? 0), 0) }
  outstanding(p: ReviewPeriod): number { return p.disbursedDate ? positive(p.disbursed - p.principalCollected) : 0 }
  amountToPay(p: ReviewPeriod): number { return positive(this.invoiceValue(p) - p.buyerPaid) }
  paymentStatus(p: ReviewPeriod): string {
    if (this.amountToPay(p) === 0) return 'Paid'
    if (dateDays(this.asOf, p.dueDate) < 0) return 'Overdue'
    if (p.processing) return 'Processing'
    return p.buyerPaid > 0 ? 'Part paid' : 'Upcoming'
  }
  periodStatus(p: ReviewPeriod): string {
    if (p.closed) return 'Settled'
    const days = dateDays(this.asOf, p.dueDate)
    if (days < 0) return p.disbursed > 0 ? 'Overdue' : 'Expired'
    return days < this.relationship(p.relationshipId).minDays ? 'Cutoff' : 'Open'
  }
  withinWindow(p: ReviewPeriod): boolean {
    const r = this.relationship(p.relationshipId), days = dateDays(this.asOf, p.dueDate)
    return !p.closed && days >= r.minDays && days <= r.maxDays
  }
  get outstandingTotal(): number { return this.periodsFor('supplier').reduce((n,p) => n + this.outstanding(p), 0) }
  get reservedTotal(): number { return this.periodsFor('supplier').reduce((n,p) => n + p.reserved, 0) }
  get headroom(): number { return positive(this.approvedLimit - this.outstandingTotal - this.reservedTotal) }
  invoiceCapacity(p: ReviewPeriod): number {
    if (!this.withinWindow(p)) return 0
    return positive(this.eligibleValue(p) * this.relationship(p.relationshipId).advanceRate - p.disbursed - p.reserved)
  }
  buyerHeadroom(r: ReviewRelationship): number {
    return positive(r.sublimit - this.relationshipPeriods(r).reduce((n,p) => n + this.outstanding(p) + p.reserved, 0))
  }
  available(p: ReviewPeriod): number {
    return Math.min(this.invoiceCapacity(p), this.buyerHeadroom(this.relationship(p.relationshipId)), this.headroom)
  }
  relationshipAvailable(r: ReviewRelationship): number {
    return Math.min(this.relationshipPeriods(r).reduce((n,p) => n + this.invoiceCapacity(p), 0), this.buyerHeadroom(r), this.headroom)
  }
  get availableTotal(): number {
    // Apply the shared global cap once, not once per period/relationship.
    return Math.min(this.headroom, this.relationshipsFor('supplier').reduce((n,r) => n + this.relationshipAvailable(r), 0))
  }
  availabilityReason(p: ReviewPeriod): string {
    if (!this.withinWindow(p)) return 'Outside the funding window. Uploading does not reopen it.'
    if (!this.eligibleValue(p)) return 'No eligible receivables are available for this period.'
    if (!this.invoiceCapacity(p)) return 'The eligible invoice capacity is already financed or reserved.'
    if (this.headroom <= Math.min(this.invoiceCapacity(p), this.buyerHeadroom(this.relationship(p.relationshipId)))) return 'Limited by your remaining total approved credit.'
    if (this.buyerHeadroom(this.relationship(p.relationshipId)) <= this.invoiceCapacity(p)) return 'Limited by the remaining buyer sub-limit.'
    return 'Based on eligible invoices, less financing already drawn and reserved requests.'
  }
  rebate(r: ReviewRelationship): { collected: number; earned: number; paid: number; due: number } {
    const collected = this.relationshipPeriods(r).reduce((n,p) => n + p.principalCollected, 0)
    const earned = positive(collected * r.rebateRate), paid = Math.min(earned, r.rebatePaid)
    return { collected, earned, paid, due: positive(earned - paid) }
  }
  get rebateDue(): number { return this.relationshipsFor('partner').reduce((n,r) => n + this.rebate(r).due, 0) }
  canUpload(r: ReviewRelationship, role: InvoiceRole): boolean {
    return this.relationshipsFor(role).some(item => item.id === r.id) && r.owner === (role === 'supplier' ? 'supplier' : 'buyer')
  }
  paymentReference(p: ReviewPeriod): string { return `${p.relationshipId.toUpperCase()}-${p.dueDate.replace(/-/g, '')}` }
  reserveForReview(p: ReviewPeriod, amount: number): void {
    if (!this.periodsFor('supplier').includes(p) || !Number.isFinite(amount) || amount <= 0 || amount > this.available(p)) throw new Error('Enter an amount within the available financing.')
    p.reserved = positive(p.reserved + amount)
    this.requests.push({id: `REVIEW-FR-${++this.sequence}`, periodId:p.id, amount, createdAt:new Date().toISOString()})
  }
  validateUpload(groups: UploadGroup[], role: InvoiceRole): void {
    if (!groups.length || groups.length > FILE_POLICY.maxGroups) throw new Error('Choose between 1 and 20 upload sections.')
    const keys = new Set<string>()
    for (const [index,g] of groups.entries()) {
      const prefix = `Section ${index + 1}: `
      if (!g.relationshipId) throw new Error(prefix + `choose a ${role === 'supplier' ? 'buyer' : 'supplier'}.`)
      const r = this.relationship(g.relationshipId)
      if (!this.canUpload(r, role)) throw new Error(prefix + 'uploads are managed by the other party for this relationship.')
      const days = dateDays(this.asOf, g.dueDate)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(g.dueDate) || !Number.isFinite(days) || days < 0) throw new Error(prefix + 'choose the review date or a later invoice due date.')
      if (g.files.length < 1 || g.files.length > FILE_POLICY.maxFiles) throw new Error(prefix + 'add 1 to 10 invoice files.')
      if (r.pod === null) throw new Error(prefix + 'Proof of Delivery requirements need confirmation by Avenews.')
      if (r.pod && !g.pod.length) throw new Error(prefix + 'add the required Proof of Delivery.')
      if (g.pod.length > FILE_POLICY.maxFiles) throw new Error(prefix + 'add no more than 10 Proof of Delivery files.')
      const key = `${r.id}:${g.dueDate}`
      if (keys.has(key)) throw new Error(prefix + 'merge sections with the same relationship and due date.')
      keys.add(key)
      for (const [files,isPod] of [[g.files,false],[g.pod,true]] as const) {
        const names = new Set<string>()
        for (const file of files) {
          const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
          const allowed = isPod || role === 'supplier' ? FILE_POLICY.documentExtensions : FILE_POLICY.extensions
          if (!allowed.includes(ext) || file.size <= 0 || file.size > FILE_POLICY.maxBytes) throw new Error(prefix + 'use the listed file formats, with a non-empty file no larger than 10 MB.')
          const fingerprint = `${file.name}:${file.size}:${file.lastModified}`
          if (names.has(fingerprint)) throw new Error(prefix + 'the same file was added twice. Remove the duplicate.')
          names.add(fingerprint)
        }
      }
    }
  }
  saveUpload(groups: UploadGroup[], role: InvoiceRole, actor: string, actorId: string, confirmedAt: string): UploadReceipt {
    // Recheck role, group and file constraints at the state-changing boundary.
    this.validateUpload(groups, role)
    if (!actor.trim() || !actorId.trim() || !confirmedAt || !Number.isFinite(Date.parse(confirmedAt))) throw new Error('Confirm the delivery declaration before saving.')
    const id = `REVIEW-UPLOAD-${++this.sequence}`
    const receipt: UploadReceipt = {id, role, createdAt:new Date().toISOString(), confirmedAt, actor, actorId,
      confirmation:DELIVERY_CONFIRMATION, groupCount:groups.length,
      fileCount:groups.reduce((n,g) => n + g.files.length, 0),
      groups:groups.map(g => ({relationshipId:g.relationshipId, dueDate:g.dueDate, invoiceNames:g.files.map(f => f.name), podNames:g.pod.map(f => f.name)}))}
    for (const g of groups) {
      const r = this.relationship(g.relationshipId)
      const p = this.periods.find(item => item.relationshipId === r.id && item.dueDate === g.dueDate)
      for (const file of g.files) this.invoices.push({id:`${id}-${++this.sequence}`, reference:'Pending review',
        relationshipId:r.id, periodId:p?.id, buyer:r.buyer, supplier:r.supplier,
        dueDate:g.dueDate, amount:null, status:'Review upload', eligible:false,
        fileName:file.name, fileUrl:this.fileUrl(file)})
      for (const file of g.pod) this.attachments.push({id:`${id}-POD-${++this.sequence}`, relationshipId:r.id,
        periodId:p?.id, fileName:file.name, fileUrl:this.fileUrl(file)})
    }
    this.receipts.unshift(receipt)
    return receipt
  }
  private fileUrl(file: File): string { const url=URL.createObjectURL(file); this.objectUrls.push(url); return url }
  ngOnDestroy(): void { for (const url of this.objectUrls) URL.revokeObjectURL(url) }
}
