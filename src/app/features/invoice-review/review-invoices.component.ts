import { Component, Input, inject } from '@angular/core'
import { formatDate, formatKes } from '../../shared/customer-portal.data'
import { InvoiceReviewStore, InvoiceRole, ReviewInvoice, dateDays } from './invoice-review.store'
import { ReviewColumn, ReviewRow, ReviewTableComponent } from './review-table.component'

@Component({
  selector: 'app-review-invoices', standalone: true, imports: [ReviewTableComponent],
  template: `<app-review-table [rows]="rows" [columns]="columns" label="invoices" [contextKey]="contextKey"
    [emptyTitle]="periodId ? 'No invoices linked to this period' : 'No invoices yet'"
    emptyMessage="Invoice records appear here even when no source file is attached." />`,
})
export class ReviewInvoicesComponent {
  readonly store = inject(InvoiceReviewStore)
  @Input() role: InvoiceRole = 'supplier'
  @Input() periodId = ''
  @Input() relationshipId = ''
  get contextKey(): string { return `${this.role}:${this.periodId}:${this.relationshipId}` }
  get columns(): ReviewColumn[] {
    const counterpart = this.role === 'supplier' ? 'Buyer' : 'Supplier'
    return [
      {key:'reference', label:'Invoice', help:'The invoice reference and, when attached, its source filename. Pending review means invoice details have not yet been verified.'},
      {key:'counterparty', label:counterpart, help: this.role === 'supplier' ? 'The buyer responsible for paying this invoice.' : 'The supplier that issued this invoice.'},
      {key:'due', label:'Due date', help:'The agreed date the buyer must pay this invoice. Invoices in a financing period share this due date.'},
      {key:'amount', label:'Amount', help:'The full invoice value, not the amount financed. Pending review means the amount has not been extracted or confirmed.', numeric:true},
      {key:'status', label:'Status', help:'The invoice record status. Overdue invoices have passed their payment due date. A review upload is not verified and creates no financing availability.'},
    ]
  }
  get invoiceRecords(): ReviewInvoice[] {
    return this.store.invoicesFor(this.role).filter(i => !this.periodId || i.periodId === this.periodId)
      .filter(i => !this.relationshipId || i.relationshipId === this.relationshipId)
  }
  get rows(): ReviewRow[] {
    return this.invoiceRecords.map(i => {
      const overdue = i.status !== 'Paid' && i.eligible && dateDays(this.store.asOf, i.dueDate) < 0
      return {id:i.id, overdue,
        cells: {
          reference: {text:i.reference, secondary:i.fileName},
          counterparty: {text:this.role === 'supplier' ? i.buyer : i.supplier},
          due: {text:formatDate(i.dueDate, true), sort:i.dueDate},
          amount: {text:i.amount === null ? 'Pending review' : formatKes(i.amount), sort:i.amount ?? -1},
          status: {text:overdue ? 'Overdue' : i.status, status:true},
        },
        actions: i.fileUrl ? [{key:'file', label:'View invoice', href:i.fileUrl}] : [],
      }
    }).sort((a,b) => Number(!!b.overdue) - Number(!!a.overdue))
  }
}
