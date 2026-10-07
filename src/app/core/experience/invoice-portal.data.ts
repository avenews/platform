import { Injectable, OnDestroy, signal } from '@angular/core'
import { INVOICE_UPLOAD_LEGAL } from './invoice-upload-legal.data'
import { customerWorkspaceById, type CustomerFinancingPeriod } from './customer-product-workspace.data'
import { invoiceFinancingInvoices, type FinancingDocument } from './financing-documents.data'
import { PARTNER_SUPPLIERS, PARTNER_PERIODS } from './partner-workspace.data'

export type InvoicePortalRole = 'supplier' | 'partner'
export type InvoiceReviewStatusKey = 'awaiting-review' | 'approved' | 'not-approved'
export type FinancingAvailabilityKey = 'available-to-request' | 'not-yet-available' | 'blocked-overdue' | 'cutoff-reached' | 'fully-financed'
export type UploadProcessingStatusKey = 'processing' | 'completed' | 'completed-with-issues' | 'failed'
export type InvoiceProcessingMode = 'manual' | 'automatic'
export interface InvoiceParty { id: string; name: string; uploader: 'supplier' | 'buyer'; pod: boolean; sublimit: number; processingMode: InvoiceProcessingMode }
export interface RelationshipTerm { label: string; value: string }
export interface ClearingAccount { bank: string; name: string; number: string; branch?: string; branchCode?: string; paybill?: string; accountReference?: string }
export interface ManualInvoiceInput { id: number; reference: string; amount: number | null; file: File | null }
export interface UploadSection { id: number; partyId: string; dueDate: string; invoices: ManualInvoiceInput[]; delivery: File[] }
export interface InvoiceSubmission { id: string; createdAt: string; actorId: string; actor: string; declaration: string; confirmedAt: string; privacyNoticeAcknowledged: boolean; termsAcknowledged: boolean; privacyNoticeUrl: string; fundsRequestTermsUrl: string; mode: InvoiceProcessingMode; processingStatus: UploadProcessingStatusKey; automaticFiles: string[]; sections: {partyId: string; dueDate: string; invoices: {reference:string;amount:number;fileName:string}[]; delivery: string[]}[] }

// Explicit prototype facility configuration, not the sum of buyer sub-limits.
// Production supplies the approved customer limit separately from period balances.
export const INVOICE_FACILITY = { approvedLimit: 3_000_000 }
export const INVOICE_DELIVERY_DECLARATION = 'I confirm that all submitted invoices reflect completed deliveries, not pre-delivery or disputed invoices.'
export const INVOICE_DECLARATION = `${INVOICE_DELIVERY_DECLARATION} I acknowledge the Privacy Notice and Terms & Conditions.`
export const INVOICE_EXTENSIONS = ['pdf','jpg','jpeg','png','xls','xlsx','csv'] as const
export const DELIVERY_EXTENSIONS = ['pdf','jpg','jpeg','png'] as const
export const INVOICE_FILE_POLICY = {maxGroups: 20, maxFiles: 10, maxBytes: 10 * 1024 * 1024}

export function invoiceRelationshipHasOverdue(relationshipId:string):boolean {
  const workspace=customerWorkspaceById('invoice-financing')
  return workspace?.periods.some(period=>period.relationshipId===relationshipId&&period.statusKey==='overdue'&&period.outstandingBalance>0)??false
}
export function invoiceCanRequest(period: CustomerFinancingPeriod): boolean {
  if (invoiceRelationshipHasOverdue(period.relationshipId)) return false
  return ['live', 'requested'].includes(period.statusKey) && (period.availableToWithdraw ?? 0) > 0
}
export function invoiceFinancingAvailability(period:CustomerFinancingPeriod):{key:FinancingAvailabilityKey;label:string;tone:string} {
  if (invoiceRelationshipHasOverdue(period.relationshipId)) return {key:'blocked-overdue',label:'Blocked by overdue payment',tone:'status-danger'}
  if ((period.availableToWithdraw??0)<=0) return {key:'fully-financed',label:'Fully financed',tone:'status-neutral'}
  if (!['live','requested'].includes(period.statusKey)) return {key:'cutoff-reached',label:'Cutoff reached',tone:'status-warning'}
  return {key:'available-to-request',label:'Available to request',tone:'status-success'}
}
export function invoiceFundingWindowState(dueDate:string,now=new Date()):{key:FinancingAvailabilityKey;label:string;eligibleFrom?:string} {
  const todayUtc=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())
  const dueUtc=Date.parse(dueDate+'T00:00:00Z')
  const days=Math.floor((dueUtc-todayUtc)/86400000)
  if(days>60) {
    const eligible=new Date(dueUtc-60*86400000).toISOString().slice(0,10)
    return {key:'not-yet-available',label:'Not yet available',eligibleFrom:eligible}
  }
  if(days>=7) return {key:'available-to-request',label:'Available to request'}
  return {key:'cutoff-reached',label:'Cutoff reached'}
}
export function supplierInvoiceParties(): InvoiceParty[] {
  return customerWorkspaceById('invoice-financing')!.relationships.map(r => ({
    id:r.id, name:r.name, uploader:r.invoiceUploadOwner === 'client' ? 'supplier' : 'buyer', pod:r.invoiceUploadOwner === 'client', sublimit:r.limit, processingMode:r.relationshipType === 'Partner Buyer' ? 'automatic' : 'manual',
  }))
}
export function partnerInvoiceParties(): InvoiceParty[] {
  return PARTNER_SUPPLIERS.map(s => ({id:s.id, name:s.business, uploader:'buyer', pod:false, sublimit:s.maxFinancing, processingMode:'automatic'}))
}
export function invoiceParties(role: InvoicePortalRole): InvoiceParty[] { return role === 'supplier' ? supplierInvoiceParties() : partnerInvoiceParties() }
export function canUploadFor(party: InvoiceParty, role: InvoicePortalRole): boolean { return party.uploader === (role === 'supplier' ? 'supplier' : 'buyer') }

// Example configured terms for the design prototype; not live CRM approval data.
// Display defaults only where known; payment terms are not invented per buyer.
export function invoiceRelationshipTerms(partyId: string, role: InvoicePortalRole): RelationshipTerm[] {
  const party=invoiceParties(role).find(p=>p.id===partyId)
  if(!party) return []
  const fields=role==='partner'?[
    {label:'Payment terms',value:'As agreed on each invoice'},
    {label:'Invoice uploads',value:canUploadFor(party,role)?'You upload invoices':'Supplier uploads invoices'},
  ]:[
    {label:'Payment terms',value:'As agreed on each invoice'},
    {label:'Advance rate',value:'Up to 85% of eligible invoices'},
    {label:'Daily markup',value:'0.17% per financed day'},
    {label:'Financing period',value:'7 to 60 days'},
    {label:'Funds Request cutoff',value:'7 days before the invoice due date'},
    {label:'Invoice uploads',value:canUploadFor(party,role)?'You upload invoices':'Buyer uploads invoices'},
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
export function clearingAccountForBusiness(businessName:string):ClearingAccount|null {
  const supplier=PARTNER_SUPPLIERS.find(s=>s.business===businessName)
  return supplier?clearingAccountFor(supplier.id):null
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
    const invoiceKeys=new Set<string>()
    const invoiceFileFingerprints=new Set<string>()
    const today=new Date()
    const todayKey=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-')
    for(const [i,s] of sections.entries()) {
      const prefix=`Section ${i+1}: `
      const party=invoiceParties(role).find(p=>p.id===s.partyId)
      if(!party || !canUploadFor(party,role)) throw new Error(prefix+`choose a ${role==='supplier'?'buyer':'supplier'} you upload for.`)
      if(party.processingMode!=='manual') throw new Error(prefix+'this relationship uses automatic invoice processing.')
      if(!/^\d{4}-\d{2}-\d{2}$/.test(s.dueDate) || !Number.isFinite(Date.parse(s.dueDate+'T00:00:00Z')) || new Date(s.dueDate+'T00:00:00Z').toISOString().slice(0,10)!==s.dueDate) throw new Error(prefix+'select a valid invoice due date.')
      if(s.dueDate<todayKey) throw new Error(prefix+'overdue invoices cannot be submitted for financing.')
      const key=`${s.partyId}:${s.dueDate}`
      if(keys.has(key)) throw new Error(prefix+'use one section for the same buyer, supplier and due date. Combine the invoices in that section.')
      keys.add(key)
      if(!s.invoices.length || s.invoices.length>10) throw new Error(prefix+'add 1 to 10 invoices.')
      for(const invoice of s.invoices) {
        const reference=invoice.reference.trim()
        if(!reference) throw new Error(prefix+'enter an invoice number for each invoice.')
        if(invoice.amount===null || !Number.isFinite(invoice.amount) || invoice.amount<=0) throw new Error(prefix+'enter an invoice amount greater than zero for each invoice.')
        if(!invoice.file) throw new Error(prefix+'attach one file to each invoice.')
        const duplicateKey=`${s.partyId}:${reference.toLowerCase()}`
        if(invoiceKeys.has(duplicateKey)) throw new Error(prefix+'remove the duplicate invoice number.')
        invoiceKeys.add(duplicateKey)
        this.validateFile(invoice.file,INVOICE_EXTENSIONS,prefix)
        const fingerprint=`${invoice.file.name}:${invoice.file.size}:${invoice.file.lastModified}`
        if(invoiceFileFingerprints.has(fingerprint)) throw new Error(prefix+'remove the duplicate invoice file.')
        invoiceFileFingerprints.add(fingerprint)
      }
      if(party.pod && !s.delivery.length) throw new Error(prefix+'add Proof of Delivery.')
      if(s.delivery.length>10) throw new Error(prefix+'add no more than 10 delivery files.')
      const deliveryFingerprints=new Set<string>()
      for(const file of s.delivery) {
        this.validateFile(file,DELIVERY_EXTENSIONS,prefix)
        const fingerprint=`${file.name}:${file.size}:${file.lastModified}`
        if(deliveryFingerprints.has(fingerprint)) throw new Error(prefix+'remove the duplicate file.')
        deliveryFingerprints.add(fingerprint)
      }
    }
  }
  validateAutomatic(files:File[]):void {
    if(!files.length || files.length>20) throw new Error('Add between 1 and 20 invoice or bulk files.')
    const fingerprints=new Set<string>()
    for(const file of files) {
      this.validateFile(file,INVOICE_EXTENSIONS,'')
      const fingerprint=`${file.name}:${file.size}:${file.lastModified}`
      if(fingerprints.has(fingerprint)) throw new Error('Remove the duplicate file.')
      fingerprints.add(fingerprint)
    }
  }
  private validateFile(file:File,formats:readonly string[],prefix:string):void {
    if(!formats.includes(file.name.split('.').pop()?.toLowerCase()??'') || !file.size || file.size>INVOICE_FILE_POLICY.maxBytes) throw new Error(prefix+'check the file format and the 10 MB maximum size.')
  }
  save(sections:UploadSection[],role:InvoicePortalRole,actorId:string,actor:string,confirmed:boolean,confirmedAt=new Date().toISOString()): InvoiceSubmission {
    this.validate(sections,role)
    if(!confirmed || !actorId || !actor || !Number.isFinite(Date.parse(confirmedAt))) throw new Error('Confirm that the invoices are for completed, undisputed deliveries.')
    const submission:InvoiceSubmission={id:crypto.randomUUID(),createdAt:new Date().toISOString(),actorId,actor,declaration:INVOICE_DECLARATION,confirmedAt,privacyNoticeAcknowledged:true,termsAcknowledged:true,...INVOICE_UPLOAD_LEGAL,mode:'manual',processingStatus:'completed',automaticFiles:[],
      sections:sections.map(s=>({partyId:s.partyId,dueDate:s.dueDate,invoices:s.invoices.map(invoice=>({reference:invoice.reference.trim(),amount:invoice.amount!,fileName:invoice.file!.name})),delivery:s.delivery.map(f=>f.name)}))}
    const invoices:FinancingDocument[]=[],delivery:FinancingDocument[]=[]
    for(const s of sections) {
      const party=invoiceParties(role).find(p=>p.id===s.partyId)!
      const periodId=role==='supplier'?customerWorkspaceById('invoice-financing')!.periods.find(p=>p.relationshipId===party.id&&p.repaymentDueDate===s.dueDate)?.id:PARTNER_PERIODS.find(p=>p.supplierId===party.id&&p.dueDate===s.dueDate)?.id
      for(const invoice of s.invoices) {
        const file=invoice.file!
        const windowState=invoiceFundingWindowState(s.dueDate)
        invoices.push({id:crypto.randomUUID(),productId:'invoice-financing',periodId:periodId??'',type:'Invoice',
          fileName:file.name,fileUrl:this.fileUrl(file),reference:invoice.reference.trim(),counterparty:party.name,dueDate:s.dueDate,amount:invoice.amount!,status:'Awaiting review',statusTone:'status-warning',financingAvailability:windowState.label,financingAvailableFrom:windowState.eligibleFrom})
      }
      for(const file of s.delivery) delivery.push({id:crypto.randomUUID(),productId:'invoice-financing',periodId:periodId??'',type:'Proof of Delivery',
        fileName:file.name,fileUrl:this.fileUrl(file),reference:'Proof of Delivery',counterparty:party.name,dueDate:s.dueDate,status:'Submitted',statusTone:'status-info'})
    }
    ;(role==='supplier'?this.addedSupplier:this.addedPartner).update(items=>[...items,...invoices])
    this.deliveryFiles.update(items=>[...items,...delivery])
    this.submissions.update(items=>[submission,...items])
    return submission
  }
  saveAutomatic(files:File[],actorId:string,actor:string,confirmed:boolean,confirmedAt=new Date().toISOString()):InvoiceSubmission {
    this.validateAutomatic(files)
    if(!confirmed || !actorId || !actor || !Number.isFinite(Date.parse(confirmedAt))) throw new Error('Confirm that the invoices are for completed, undisputed deliveries.')
    const submission:InvoiceSubmission={id:crypto.randomUUID(),createdAt:new Date().toISOString(),actorId,actor,declaration:INVOICE_DECLARATION,confirmedAt,privacyNoticeAcknowledged:true,termsAcknowledged:true,...INVOICE_UPLOAD_LEGAL,mode:'automatic',processingStatus:'processing',automaticFiles:files.map(file=>file.name),sections:[]}
    this.submissions.update(items=>[submission,...items])
    return submission
  }
}
