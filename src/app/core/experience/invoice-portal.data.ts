import { Injectable, OnDestroy, signal } from '@angular/core'
import { INVOICE_UPLOAD_LEGAL } from './invoice-upload-legal.data'
import { customerWorkspaceById, type CustomerFinancingPeriod } from './customer-product-workspace.data'
import { invoiceFinancingInvoices, type FinancingDocument } from './financing-documents.data'
import { PARTNER_SUPPLIERS, PARTNER_PERIODS } from './partner-workspace.data'

export type InvoicePortalRole = 'supplier' | 'partner'
export interface InvoiceParty { id: string; name: string; uploader: 'supplier' | 'buyer'; pod: boolean; sublimit: number }
export interface RelationshipTerm { label: string; value: string }
export interface ClearingAccount { bank: string; name: string; number: string; branch?: string; branchCode?: string; paybill?: string; accountReference?: string }
export interface UploadSection { id: number; partyId: string; dueDate: string; invoices: File[]; delivery: File[] }
export interface InvoiceSubmission { id: string; createdAt: string; actorId: string; actor: string; declaration: string; confirmedAt: string; privacyNoticeAcknowledged: boolean; privacyNoticeUrl: string; fundsRequestTermsUrl: string; sections: {partyId: string; dueDate: string; invoices: string[]; delivery: string[]}[] }

// Explicit prototype facility configuration, not the sum of buyer sub-limits.
// Production supplies the approved customer limit separately from period balances.
export const INVOICE_FACILITY = { approvedLimit: 3_000_000 }
export const INVOICE_DECLARATION = 'I confirm that all submitted invoices reflect completed deliveries, not pre-delivery or disputed invoices.'
export const INVOICE_EXTENSIONS = ['pdf','jpg','jpeg','png','xls','xlsx','csv'] as const
export const DELIVERY_EXTENSIONS = ['pdf','jpg','jpeg','png'] as const
export const INVOICE_FILE_POLICY = {maxGroups: 20, maxFiles: 10, maxBytes: 10 * 1024 * 1024}

export function invoiceCanRequest(period: CustomerFinancingPeriod): boolean {
  // Preview-77 records carry assessed availability. Do not re-age the snapshot
  // or replace its configured lifecycle statuses using the browser's clock.
  // Production must return eligibility calculated by the authoritative service.
  return ['live', 'requested'].includes(period.statusKey) && (period.availableToWithdraw ?? 0) > 0
}
export function supplierInvoiceParties(): InvoiceParty[] {
  return customerWorkspaceById('invoice-financing')!.relationships.map(r => ({
    id:r.id, name:r.name, uploader:r.invoiceUploadOwner === 'client' ? 'supplier' : 'buyer', pod:r.invoiceUploadOwner === 'client', sublimit:r.limit,
  }))
}
export function partnerInvoiceParties(): InvoiceParty[] {
  return PARTNER_SUPPLIERS.map(s => ({id:s.id, name:s.business, uploader:'buyer', pod:false, sublimit:s.maxFinancing}))
}
export function invoiceParties(role: InvoicePortalRole): InvoiceParty[] { return role === 'supplier' ? supplierInvoiceParties() : partnerInvoiceParties() }
export function canUploadFor(party: InvoiceParty, role: InvoicePortalRole): boolean { return party.uploader === (role === 'supplier' ? 'supplier' : 'buyer') }

// Example configured terms for the design prototype; not live CRM approval data.
// Display defaults only where known; payment terms are not invented per buyer.
export function invoiceRelationshipTerms(partyId: string, role: InvoicePortalRole): RelationshipTerm[] {
  const party=invoiceParties(role).find(p=>p.id===partyId)
  if(!party) return []
  const fields=[
    {label:'Payment terms',value:'As agreed on each invoice'},
    {label:'Advance rate',value:'Up to 85% of eligible invoices'},
    {label:'Daily markup',value:'0.17% per financed day'},
    {label:'Financing period',value:'7 to 60 days'},
    {label:'Funds Request cutoff',value:'7 days before the invoice due date'},
    {label:'Invoice uploads',value:canUploadFor(party,role)?'You upload invoices':role==='supplier'?'Buyer uploads invoices':'Supplier uploads invoices'},
  ]
  if(role==='partner') fields.push({label:'Rebate rate',value:partyId==='supplier-nairobi'?'0.8% of principal collected':'1% of principal collected'})
  fields.push({label:'Settlement',value:'Buyer pays into the designated clearing account. Avenews settles the financing and transfers the remaining proceeds to the supplier.'})
  return fields
}
// Independent rebate ledger examples. These are collected-principal entries,
// not amounts inferred from the unpaid period table or invoice values.
export const PARTNER_REBATES = PARTNER_SUPPLIERS.map(s => {
  const collected=s.id==='supplier-nairobi'?200_000:s.id==='supplier-coast'?150_000:0
  const rate=s.id==='supplier-nairobi'?0.008:0.01
  const paid=s.id==='supplier-coast'?500:0
  const earned=Math.round(collected*rate*100)/100
  return {supplierId:s.id, supplier:s.business, collected, rate, earned, paid, due:earned-paid}
})
// Non-payable layout fixtures. Real clearing details must be independently
// supplied and verified; never substitute the general collections account.
export function clearingAccountFor(supplierId: string): ClearingAccount | null {
  const supplier=PARTNER_SUPPLIERS.find(s=>s.id===supplierId)
  if(!supplier || supplierId==='supplier-eldoret') return null
  return {bank:'ABSA Bank Kenya PLC',name:`Client Clearing Account - ${supplier.business}`,number:`DEMO-${supplier.identifier}`,branch:'Headquarters',branchCode:'03400'}
}
// Period-linked partner invoice fixtures provide the new invoice view without
// altering preview-77 period totals. Source files are intentionally optional.
export const PARTNER_INVOICES: readonly FinancingDocument[] = PARTNER_PERIODS.flatMap(p => {
  const supplier=PARTNER_SUPPLIERS.find(s=>s.id===p.supplierId)!
  const unit=Math.floor(p.invoiceValue / p.invoiceCount)
  return Array.from({length:p.invoiceCount},(_,i)=>({
    id:`${p.id}-invoice-${i+1}`,productId:'invoice-financing' as const,periodId:p.id,type:'Invoice' as const,
    reference:`INV-${supplier.identifier.slice(4)}-${p.dueDate.replace(/-/g,'')}-${i+1}`,
    counterparty:supplier.business, fileName:'',fileUrl:'', dueDate:p.dueDate,
    amount:i===p.invoiceCount-1?p.invoiceValue-unit*i:unit,
    status:p.paymentStatusKey==='paid'?'Paid':p.paymentStatusKey==='overdue'?'Overdue':'Approved',
    statusTone:p.paymentStatusKey==='overdue'?'status-danger':'status-success',
  }))
})

@Injectable({providedIn:'root'})
export class InvoiceDocumentsStore implements OnDestroy {
  private readonly fileUrls:string[]=[]
  private fileUrl(file:File):string {const url=URL.createObjectURL(file);this.fileUrls.push(url);return url}
  ngOnDestroy():void {this.fileUrls.forEach(url=>URL.revokeObjectURL(url))}
  private readonly addedSupplier=signal<FinancingDocument[]>([])
  private readonly addedPartner=signal<FinancingDocument[]>([])
  readonly submissions=signal<InvoiceSubmission[]>([])
  readonly deliveryFiles=signal<FinancingDocument[]>([])
  supplierInvoices(): readonly FinancingDocument[] { return [...invoiceFinancingInvoices(),...this.addedSupplier()] }
  partnerInvoices(): readonly FinancingDocument[] { return [...PARTNER_INVOICES,...this.addedPartner()] }
  periodInvoices(periodId: string,role: InvoicePortalRole): readonly FinancingDocument[] {
    return (role==='supplier'?this.supplierInvoices():this.partnerInvoices()).filter(i=>i.periodId===periodId)
  }
  validate(sections: UploadSection[],role:InvoicePortalRole): void {
    if(!sections.length || sections.length>20) throw new Error('Add between 1 and 20 upload sections.')
    const keys=new Set<string>()
    for(const [i,s] of sections.entries()) {
      const prefix=`Section ${i+1}: `
      const party=invoiceParties(role).find(p=>p.id===s.partyId)
      if(!party || !canUploadFor(party,role)) throw new Error(prefix+`choose a ${role==='supplier'?'buyer':'supplier'} you upload for.`)
      if(!/^\d{4}-\d{2}-\d{2}$/.test(s.dueDate) || !Number.isFinite(Date.parse(s.dueDate+'T00:00:00Z')) || new Date(s.dueDate+'T00:00:00Z').toISOString().slice(0,10)!==s.dueDate) throw new Error(prefix+'select a valid invoice due date.')
      const key=`${s.partyId}:${s.dueDate}`
      if(keys.has(key)) throw new Error(prefix+'use one section for the same buyer, supplier and due date. Combine the files in that section.')
      keys.add(key)
      if(!s.invoices.length || s.invoices.length>10) throw new Error(prefix+'add 1 to 10 invoice files.')
      if(party.pod && !s.delivery.length) throw new Error(prefix+'add Proof of Delivery.')
      if(s.delivery.length>10) throw new Error(prefix+'add no more than 10 delivery files.')
      for(const files of [s.invoices,s.delivery]) {
        const names=new Set<string>()
        for(const file of files) {
          const formats:readonly string[]=files===s.invoices?INVOICE_EXTENSIONS:DELIVERY_EXTENSIONS
          if(!formats.includes(file.name.split('.').pop()?.toLowerCase()??'') || !file.size || file.size>INVOICE_FILE_POLICY.maxBytes) throw new Error(prefix+'check the file format and the 10 MB maximum size.')
          const fingerprint=`${file.name}:${file.size}:${file.lastModified}`
          if(names.has(fingerprint)) throw new Error(prefix+'remove the duplicate file.')
          names.add(fingerprint)
        }
      }
    }
  }
  save(sections:UploadSection[],role:InvoicePortalRole,actorId:string,actor:string,confirmed:boolean,confirmedAt=new Date().toISOString()): InvoiceSubmission {
    this.validate(sections,role)
    if(!confirmed || !actorId || !actor || !Number.isFinite(Date.parse(confirmedAt))) throw new Error('Confirm that the invoices are for completed, undisputed deliveries.')
    const submission:InvoiceSubmission={id:crypto.randomUUID(),createdAt:new Date().toISOString(),actorId,actor,declaration:INVOICE_DECLARATION,confirmedAt,privacyNoticeAcknowledged:true,...INVOICE_UPLOAD_LEGAL,
      sections:sections.map(s=>({partyId:s.partyId,dueDate:s.dueDate,invoices:s.invoices.map(f=>f.name),delivery:s.delivery.map(f=>f.name)}))}
    const invoices:FinancingDocument[]=[],delivery:FinancingDocument[]=[]
    for(const s of sections) {
      const party=invoiceParties(role).find(p=>p.id===s.partyId)!
      const periodId=role==='supplier'?customerWorkspaceById('invoice-financing')!.periods.find(p=>p.relationshipId===party.id&&p.repaymentDueDate===s.dueDate)?.id:PARTNER_PERIODS.find(p=>p.supplierId===party.id&&p.dueDate===s.dueDate)?.id
      for(const [files,type,target] of [[s.invoices,'Invoice',invoices],[s.delivery,'Proof of Delivery',delivery]] as const) {
        for(const file of files) target.push({id:crypto.randomUUID(),productId:'invoice-financing',periodId:periodId??'',type,
          fileName:file.name,fileUrl:this.fileUrl(file),reference:'Pending review',counterparty:party.name,dueDate:s.dueDate,status:'Uploaded',statusTone:'status-info'})
      }
    }
    ;(role==='supplier'?this.addedSupplier:this.addedPartner).update(items=>[...items,...invoices])
    this.deliveryFiles.update(items=>[...items,...delivery])
    this.submissions.update(items=>[submission,...items])
    return submission
  }
}
