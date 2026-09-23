import { Component, EventEmitter, Input, Output, inject } from '@angular/core'
import { formatDate, formatKes } from '../../shared/customer-portal.data'
import { InvoiceReviewStore, InvoiceRole, ReviewPeriod } from './invoice-review.store'
import { ReviewColumn, ReviewRow, ReviewTableComponent } from './review-table.component'

export type PeriodScope = '' | 'available' | 'outstanding' | 'payments' | 'overdue'
@Component({
  selector: 'app-review-period-table', standalone: true, imports: [ReviewTableComponent],
  template: `<app-review-table [rows]="rows" [columns]="columns" [label]="role === 'partner' ? 'payments' : 'financing periods'" [heading]="heading" [contextKey]="contextKey" [pageSize]="role === 'partner' ? 6 : 10" [emptyTitle]="emptyTitle" emptyMessage="Change the selected view or return when more records are available." (takeAction)="action($event)" />`,
})
export class ReviewPeriodTableComponent {
  readonly store = inject(InvoiceReviewStore)
  @Input() role: InvoiceRole = 'supplier'
  @Input() relationshipId = ''
  @Input() scope: PeriodScope = ''
  @Input() heading = ''
  @Output() openPeriod = new EventEmitter<ReviewPeriod>()
  @Output() requestFunds = new EventEmitter<ReviewPeriod>()
  readonly formatKes = formatKes
  get contextKey(): string { return `${this.role}:${this.relationshipId}:${this.scope}` }
  get emptyTitle(): string {
    if (this.scope === 'available') return 'No periods available for a new request'
    if (this.scope === 'outstanding') return 'No outstanding disbursed financing'
    if (this.scope === 'payments') return 'No payments due'
    if (this.scope === 'overdue') return 'No overdue payments'
    return this.role === 'partner' ? 'No payments yet' : 'No financing periods yet'
  }
  get columns(): ReviewColumn[] {
    if (this.role === 'partner') return [
      {key:'name',label:'Supplier',help:'The supplier whose invoices this payment settles.'},
      {key:'reference',label:'Financing period',help:'Invoices for one supplier, buyer and due date are grouped into this period.'},
      {key:'due',label:'Due date',help:'The agreed date the buyer must pay these invoices.'},
      {key:'amount',label:'Amount to pay',numeric:true,help:'The full invoice value less buyer payments already received and allocated. This is not the supplier’s financed principal, and rebates must not be deducted.'},
      {key:'status',label:'Payment status',help:'Upcoming: not yet due. Part paid: a balance remains. Overdue: the due date has passed. Paid: no invoice balance remains. Processing: a payment is being reconciled.'},
    ]
    return [
      {key:'name',label:'Buyer / reference',help:'The buyer and financing-period reference. Each period groups invoices for the same buyer and invoice due date.'},
      {key:'due',label:'Invoice due date',help:'The date the buyer must pay the period’s invoices. Financing requests close 7 days before this date under standard terms.'},
      {key:'available',label:'Available financing',numeric:true,help:'Additional financing available now for this period after invoice eligibility, advance rate, outstanding exposure, pending reservations, buyer sub-limit and total approved limit are applied. Different periods share the same global credit.'},
      {key:'outstanding',label:'Outstanding amount',numeric:true,help:'Principal already disbursed and not yet repaid or collected. Excludes pending requests, undisbursed reservations, markup and late charges.'},
      {key:'status',label:'Status',help:'Open: within the period lifecycle. Cutoff: new requests have closed. Settled: allocated and closed. Overdue: due date passed with unsettled financing. Expired: due date passed without financing being disbursed.'},
    ]
  }
  get periods(): ReviewPeriod[] {
    return this.store.periodsFor(this.role)
      .filter(p => !this.relationshipId || p.relationshipId === this.relationshipId)
      .filter(p => this.role !== 'partner' || this.store.invoiceValue(p) > 0)
      .filter(p => this.scope !== 'available' || this.store.available(p) > 0)
      .filter(p => this.scope !== 'outstanding' || this.store.outstanding(p) > 0)
      .filter(p => this.scope !== 'payments' || this.store.amountToPay(p) > 0)
      .filter(p => this.scope !== 'overdue' || this.store.paymentStatus(p) === 'Overdue')
      .sort((a,b) => Number(this.store.paymentStatus(b) === 'Overdue') - Number(this.store.paymentStatus(a) === 'Overdue') || a.dueDate.localeCompare(b.dueDate))
  }
  get rows(): ReviewRow[] {
    return this.periods.map(p => {
      const relationship = this.store.relationship(p.relationshipId)
      if (this.role === 'partner') return {id:p.id, open:'period', overdue:this.store.paymentStatus(p) === 'Overdue', cells:{
        name:{text:relationship.supplier}, reference:{text:p.reference},
        due:{text:formatDate(p.dueDate,true),sort:p.dueDate},
        amount:{text:formatKes(this.store.amountToPay(p)),sort:this.store.amountToPay(p)},
        status:{text:this.store.paymentStatus(p),status:true},
      },actions:[{key:'period',label:'View payment'}]}
      return {id:p.id, open:'period', overdue:this.store.periodStatus(p) === 'Overdue', cells:{
        name:{text:relationship.buyer,secondary:p.reference},
        due:{text:formatDate(p.dueDate,true),sort:p.dueDate},
        available:{text:formatKes(this.store.available(p)),sort:this.store.available(p)},
        outstanding:{text:formatKes(this.store.outstanding(p)),sort:this.store.outstanding(p)},
        status:{text:this.store.periodStatus(p),status:true},
      },actions:[{key:'period',label:'View'},...(this.store.available(p)>0 ? [{key:'request',label:'Request funds',primary:true}] : [])]}
    })
  }
  action(event: {key:string;id:string}): void {
    const period = this.periods.find(p => p.id === event.id)
    if (!period) return
    if (event.key === 'request' && this.role === 'supplier' && this.store.available(period)>0) this.requestFunds.emit(period)
    else this.openPeriod.emit(period)
  }
}
