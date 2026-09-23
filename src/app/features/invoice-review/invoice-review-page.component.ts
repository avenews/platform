import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core'
import { Router } from '@angular/router'
import { formatDate, formatKes } from '../../shared/customer-portal.data'
import { InvoiceReviewStore, InvoiceRole, ReviewPeriod, ReviewRelationship, UploadReceipt, percent } from './invoice-review.store'
import { ReviewHelpComponent } from './review-help.component'
import { ReviewDialogComponent } from './review-dialog.component'
import { ReviewTableComponent, ReviewColumn, ReviewRow } from './review-table.component'
import { ReviewInvoicesComponent } from './review-invoices.component'
import { ReviewPeriodTableComponent, PeriodScope } from './review-period-table.component'
import { ReviewPeriodDialogComponent } from './review-period-dialog.component'
import { ReviewTermsComponent } from './review-terms.component'
import { ReviewUploadComponent } from './review-upload.component'

export type ReviewSection = 'home' | 'financing' | 'request-funds' | 'invoices' | 'invoice-uploads' | 'suppliers' | 'obligations' | 'period'
interface ReviewMetric { label:string; value:string; helper:string; help:string; action:string; actionLabel:string; showLimit?:boolean }

@Component({
  selector:'app-invoice-review-page', standalone:true,
  imports:[ReviewHelpComponent, ReviewDialogComponent, ReviewTableComponent, ReviewInvoicesComponent,
    ReviewPeriodTableComponent, ReviewPeriodDialogComponent, ReviewTermsComponent, ReviewUploadComponent],
  templateUrl:'./invoice-review-page.component.html', styleUrl:'./invoice-review.shared.css',
})
export class InvoiceReviewPageComponent implements OnChanges {
  readonly store = inject(InvoiceReviewStore)
  private readonly router = inject(Router)
  @Input() role: InvoiceRole = 'supplier'
  @Input() section: ReviewSection = 'home'
  @Input() initialPeriodId = ''
  @Input() requestedAction = ''
  readonly formatKes = formatKes
  readonly formatDate = formatDate
  readonly percent = percent
  scope: PeriodScope = ''
  invoiceTab: 'invoices' | 'history' = 'invoices'
  relationshipView: 'overview' | 'periods' = 'overview'
  selectedRelationship: ReviewRelationship | null = null
  selectedPeriod: ReviewPeriod | null = null
  returnRelationship: ReviewRelationship | null = null
  returnRelationshipView: 'overview' | 'periods' = 'overview'
  requestOpen = false
  chooserOpen = false
  uploadOpen = false
  uploadRelationshipId = ''
  rebatesOpen = false
  selectedReceipt: UploadReceipt | null = null
  notice = ''
  periodNotFound = false

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['role'] && !changes['section'] && !changes['initialPeriodId'] && !changes['requestedAction']) return
    this.selectedPeriod=null; this.selectedRelationship=null; this.returnRelationship=null
    this.chooserOpen=false; this.uploadOpen=false; this.rebatesOpen=false; this.selectedReceipt=null
    this.invoiceTab='invoices'; this.notice=''; this.periodNotFound=false
    this.scope=this.section === 'request-funds' ? 'available' : ''
    if (this.initialPeriodId) {
      this.selectedPeriod=this.store.periodsFor(this.role).find(p => p.id === this.initialPeriodId) ?? null
      this.periodNotFound=!this.selectedPeriod
    }
    if (this.requestedAction === 'upload') this.startUpload()
  }
  get title(): string {
    if (this.section === 'home') return this.role === 'supplier' ? 'Invoice Financing' : 'Partner Buyer Portal'
    if (this.isInvoices) return 'Invoices'
    if (this.isRelationships) return this.role === 'supplier' ? 'Buyers' : 'Suppliers'
    if (this.section === 'request-funds') return 'Funds Request'
    return this.role === 'partner' ? 'Payments' : 'Financing'
  }
  get intro(): string {
    if (this.section === 'home') return this.role === 'supplier' ? 'View your available financing, outstanding amounts and buyer invoice periods.' : 'View your rebates, upload supplier invoices and manage payments.'
    if (this.isInvoices) return 'View invoice records and their files. Upload only for relationships where you are responsible.'
    if (this.isRelationships) return this.role === 'supplier' ? 'See who uploads invoices, review your buyer terms and open financing periods.' : 'Review supplier terms, invoice periods and payments.'
    if (this.section === 'request-funds') return 'Choose an eligible period to review your available financing and request funds.'
    return 'View payments by supplier and invoice due date.'
  }
  get isInvoices(): boolean { return this.section === 'invoices' || this.section === 'invoice-uploads' }
  get isRelationships(): boolean { return this.section === 'financing' || this.section === 'suppliers' }
  get relationships(): ReviewRelationship[] { return this.store.relationshipsFor(this.role) }
  get canUpload(): boolean { return this.relationships.some(r => this.store.canUpload(r,this.role)) }
  get buyerPayments(): ReviewPeriod[] { return this.store.periodsFor(this.role).filter(p => this.store.amountToPay(p)>0) }
  get paymentTotal(): number { return this.buyerPayments.reduce((n,p) => n + this.store.amountToPay(p),0) }
  get overdueCount(): number { return this.buyerPayments.filter(p => this.store.paymentStatus(p)==='Overdue').length }
  get metrics(): ReviewMetric[] {
    if (this.role === 'partner') return [
      {label:'Rebate due',value:formatKes(this.store.rebateDue),helper:'Earned rebates not yet paid to you',help:'Rebates earned on principal successfully collected by Avenews, less rebates already paid. Rates are configured per supplier relationship. Do not deduct rebates from invoice payments.',action:'rebates',actionLabel:'View rebate breakdown'},
      {label:'Invoices',value:String(this.store.invoicesFor('partner').length),helper:'Across your supplier relationships',help:'Invoice records visible for your supplier relationships, including records without attached files. Review uploads have not been parsed or verified.',action:'invoices',actionLabel:'View invoices'},
      {label:'Payments due',value:formatKes(this.paymentTotal),helper:`${this.buyerPayments.length} unpaid periods · ${this.overdueCount} overdue`,help:'The remaining full invoice balances across your suppliers, after allocated buyer payments. These amounts are different from the financing Avenews has disbursed.',action:'payments',actionLabel:'View unpaid payments'},
    ]
    return [
      {label:'Available financing',value:formatKes(this.store.availableTotal),helper:'Available to request from eligible invoice periods',help:'Financing available now after eligible invoices, advance rates, existing draws, reservations, buyer sub-limits and your total approved limit are applied. Individual period figures share the same global credit and must not simply be added.',action:'available',actionLabel:'View available periods',showLimit:true},
      {label:'Outstanding amount',value:formatKes(this.store.outstandingTotal),helper:'Disbursed principal still unpaid',help:'Principal actually disbursed to you and not yet repaid or collected. Excludes undisbursed requests, reservations, markup and late charges. The action includes all periods with outstanding principal, not only overdue periods.',action:'outstanding',actionLabel:'View outstanding periods'},
      {label:'Buyer payments due',value:`${this.buyerPayments.length} unpaid periods`,helper:`${this.overdueCount} overdue · ${this.buyerPayments.length - this.overdueCount} not overdue`,help:'Periods with invoice balances your buyers still need to pay. A buyer pays the full invoice balance into the designated clearing account, not only the financed principal.',action:'payments',actionLabel:'View payments due'},
    ]
  }
  get usedWidth(): number { return Math.min(100,100*this.store.outstandingTotal/this.store.approvedLimit) }
  get reservedWidth(): number { return Math.min(100-this.usedWidth,100*this.store.reservedTotal/this.store.approvedLimit) }
  get filterLabel(): string {
    if (this.scope === 'available') return 'Showing periods available for a new financing request'
    if (this.scope === 'outstanding') return 'Showing disbursed financing with an outstanding principal balance'
    if (this.scope === 'payments') return 'Showing periods with unpaid invoice balances'
    if (this.scope === 'overdue') return 'Showing overdue invoice payments'
    return ''
  }
  metricAction(action: string): void {
    if (action==='rebates') { this.rebatesOpen=true; return }
    if (action==='invoices') { this.navigateInvoices(); return }
    this.scope=action as PeriodScope
    setTimeout(() => document.getElementById('review-main-periods')?.scrollIntoView({behavior:'smooth',block:'start'}))
  }
  navigateInvoices(): void { void this.router.navigate(['/experience',this.role==='supplier'?'invoice-financing':'invoice-partner',this.role==='supplier'?'invoices':'invoice-uploads']) }
  navigateHome(): void { void this.router.navigate(['/experience',this.role==='supplier'?'invoice-financing':'invoice-partner','home']) }
  startUpload(): void {
    if (!this.canUpload) { this.notice=this.role==='supplier'?'Your buyers upload invoices for all your relationships. There is nothing for you to upload.':'Your suppliers manage invoice uploads for these relationships.'; return }
    if (this.role==='supplier') this.chooserOpen=true
    else { this.uploadRelationshipId=''; this.uploadOpen=true }
  }
  uploadFor(relationship: ReviewRelationship): void {
    if (!this.store.canUpload(relationship,this.role)) return
    this.chooserOpen=false; this.selectedRelationship=null; this.uploadRelationshipId=relationship.id; this.uploadOpen=true
  }
  uploadSaved(_receipt: UploadReceipt): void { this.uploadOpen=false; this.invoiceTab='invoices'; this.navigateInvoices() }
  uploadLabel(r: ReviewRelationship): string {
    return this.role==='supplier' ? r.owner==='supplier'?'You upload invoices':'Buyer uploads invoices' : r.owner==='buyer'?'You upload invoices':'Supplier uploads invoices'
  }
  openRelationship(r: ReviewRelationship): void { this.rebatesOpen=false; this.selectedRelationship=r; this.relationshipView='overview' }
  openPeriod(period: ReviewPeriod, request=false): void {
    this.returnRelationship=this.selectedRelationship; this.returnRelationshipView=this.relationshipView
    this.selectedRelationship=null; this.selectedPeriod=period; this.requestOpen=request
  }
  backToRelationship(): void {
    this.selectedPeriod=null; this.selectedRelationship=this.returnRelationship
    this.relationshipView=this.returnRelationshipView; this.returnRelationship=null
  }
  closePeriod(): void { this.selectedPeriod=null; this.returnRelationship=null; this.requestOpen=false }
  get relationshipColumns(): ReviewColumn[] {
    if (this.role==='supplier') return [
      {key:'name',label:'Buyer',help:'The buyer and its approved relationship type. Upload responsibility is configured separately from the relationship type.'},
      {key:'available',label:'Available financing',numeric:true,help:'Financing you can currently request against this buyer’s eligible invoice periods, capped by the buyer sub-limit and your shared total approved credit.'},
      {key:'uploads',label:'Invoice uploads',help:'Who is responsible for supplying invoice information. Where the buyer uploads, you do not need to upload the same invoices again.'},
      {key:'status',label:'Status',help:'Available means eligible financing can currently be requested. Unavailable means no additional amount can be requested; invoices may still be uploaded where you are responsible.'},
    ]
    return [
      {key:'name',label:'Supplier',help:'The supplier participating in your invoice and payment relationship.'},
      {key:'periods',label:'Active periods',numeric:true,help:'Invoice periods for this supplier that are not yet settled or expired.'},
      {key:'due',label:'Amount to pay',numeric:true,help:'All unpaid invoice balances for this supplier, after allocated buyer payments.'},
      {key:'next',label:'Next due date',help:'The earliest unpaid invoice due date for this supplier, including overdue periods.'},
      {key:'uploads',label:'Invoice uploads',help:'The party configured to upload invoice information for this supplier relationship.'},
    ]
  }
  get relationshipRows(): ReviewRow[] {
    return this.relationships.map((r): ReviewRow => {
      const periods=this.store.relationshipPeriods(r), unpaid=periods.filter(p=>this.store.amountToPay(p)>0).sort((a,b)=>a.dueDate.localeCompare(b.dueDate))
      const actions=[{key:'relationship',label:'View details'},...(this.store.canUpload(r,this.role)?[{key:'upload',label:'Upload invoices',primary:true}]:[])]
      if(this.role==='supplier') return {id:r.id,open:'relationship',cells:{name:{text:r.buyer,secondary:r.kind},available:{text:formatKes(this.store.relationshipAvailable(r)),sort:this.store.relationshipAvailable(r)},uploads:{text:this.uploadLabel(r)},status:{text:this.store.relationshipAvailable(r)>0?'Available':'Unavailable',status:true}},actions}
      const amount=unpaid.reduce((n,p)=>n+this.store.amountToPay(p),0)
      return {id:r.id,open:'relationship',overdue:unpaid.some(p=>this.store.paymentStatus(p)==='Overdue'),cells:{name:{text:r.supplier},periods:{text:String(periods.filter(p=>!['Settled','Expired'].includes(this.store.periodStatus(p))).length),sort:periods.filter(p=>!['Settled','Expired'].includes(this.store.periodStatus(p))).length},due:{text:formatKes(amount),sort:amount},next:{text:unpaid[0]?formatDate(unpaid[0].dueDate,true):'No payment due',sort:unpaid[0]?.dueDate??'9999-12-31'},uploads:{text:this.uploadLabel(r)}},actions}
    })
  }
  relationshipAction(event:{key:string;id:string}): void {
    const r=this.relationships.find(item=>item.id===event.id)
    if(!r)return
    if(event.key==='upload')this.uploadFor(r);else this.openRelationship(r)
  }
  readonly rebateColumns: ReviewColumn[] = [
    {key:'supplier',label:'Supplier',help:'The supplier relationship responsible for this part of your rebate.'},
    {key:'rate',label:'Rebate rate',numeric:true,help:'The agreed rebate percentage for this supplier relationship. These are sample review rates.'},
    {key:'collected',label:'Principal collected',numeric:true,help:'Financed principal successfully collected by Avenews. Invoice values and disbursements are not the rebate basis.'},
    {key:'earned',label:'Rebate earned',numeric:true,help:'Principal collected multiplied by the approved rebate rate.'},
    {key:'paid',label:'Rebate paid',numeric:true,help:'Rebates already paid to the partner buyer.'},
    {key:'due',label:'Rebate due',numeric:true,help:'Rebates earned less rebates already paid. This must not be deducted from your invoice payments.'},
  ]
  get rebateRows(): ReviewRow[] {
    return this.store.relationshipsFor('partner').map(r=>{const value=this.store.rebate(r);return{id:r.id,cells:{supplier:{text:r.supplier},rate:{text:percent(r.rebateRate),sort:r.rebateRate},collected:{text:formatKes(value.collected),sort:value.collected},earned:{text:formatKes(value.earned),sort:value.earned},paid:{text:formatKes(value.paid),sort:value.paid},due:{text:formatKes(value.due),sort:value.due}},actions:[{key:'relationship',label:'View supplier'}]}})
  }
  get sessionReceipts(): UploadReceipt[] { return this.store.receipts.filter(r=>r.role===this.role) }
  readonly receiptColumns: ReviewColumn[] = [
    {key:'reference',label:'Receipt',help:'The reference for an upload saved in this browser review session.'},
    {key:'created',label:'Saved at',help:'The time the review upload was saved, shown in East Africa Time.'},
    {key:'groups',label:'Sections',numeric:true,help:'Groups of files, each for one supplier-buyer relationship and one invoice due date.'},
    {key:'files',label:'Invoice files',numeric:true,help:'The number of uploaded files, not a count of invoice rows parsed from a spreadsheet.'},
    {key:'status',label:'Status',help:'Saved in review means the files remain in this tab only. They have not been sent to a CRM or verified.'},
  ]
  get receiptRows(): ReviewRow[] { return this.sessionReceipts.map(r=>({id:r.id,open:'receipt',cells:{reference:{text:r.id},created:{text:this.readableTime(r.createdAt),sort:r.createdAt},groups:{text:String(r.groupCount),sort:r.groupCount},files:{text:String(r.fileCount),sort:r.fileCount},status:{text:'Saved in review',status:true}},actions:[{key:'receipt',label:'View receipt'}]})) }
  receiptAction(event:{key:string;id:string}): void { this.selectedReceipt=this.sessionReceipts.find(r=>r.id===event.id)??null }
  readableTime(value:string):string {return new Date(value).toLocaleString('en-KE',{timeZone:'Africa/Nairobi'})+' EAT'}
}
