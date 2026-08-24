import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
  invoiceFinancingInvoices,
  type FinancingDocument,
} from '../../core/experience/financing-documents.data'
import { formatDate, formatKes } from '../../shared/customer-portal.data'

@Component({
  selector: 'app-customer-invoices',
  standalone: true,
  template: `
    <div class="portal-page invoice-workspace">
      <section class="invoice-workspace__hero">
        <div>
          <h1>Invoices</h1>
          <p>View invoice files used for Invoice Financing and upload new invoices where you are responsible.</p>
        </div>
        <button type="button" class="baseline-button baseline-button--primary invoice-upload-action" data-action="invoice-upload" (click)="uploadOpen = true">Upload invoices</button>
      </section>

      <section class="baseline-section" aria-labelledby="invoice-files-title">
        <div class="baseline-section-heading">
          <div>
            <h2 id="invoice-files-title">Invoice files</h2>
            <p>Invoices are grouped into financing periods by buyer and invoice due date.</p>
          </div>
        </div>

        <div class="baseline-table-wrap">
          <table class="baseline-table invoice-files-table">
            <thead><tr><th>Invoice</th><th>Buyer</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              @for (invoice of invoices; track invoice.id) {
                <tr [class.invoice-row--overdue]="invoice.status === 'Overdue'">
                  <td><span class="baseline-financing-cell"><strong>{{ invoice.reference }}</strong><span>{{ invoice.fileName }}</span></span></td>
                  <td>{{ invoice.counterparty }}</td>
                  <td>{{ invoice.dueDate ? formatDate(invoice.dueDate, true) : '—' }}</td>
                  <td>{{ invoice.amount !== undefined ? formatKes(invoice.amount) : '—' }}</td>
                  <td><span class="baseline-status" [class]="'baseline-status ' + (invoice.statusTone ?? 'status-neutral')">{{ invoice.status ?? 'Uploaded' }}</span></td>
                  <td><a class="baseline-button baseline-button--secondary" [href]="invoice.fileUrl" target="_blank" rel="noopener noreferrer">View invoice</a></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="baseline-cards invoice-files-cards">
          @for (invoice of invoices; track invoice.id) {
            <article class="baseline-record-card invoice-file-card" [class.invoice-file-card--overdue]="invoice.status === 'Overdue'">
              <div class="baseline-record-card__head">
                <span class="baseline-financing-cell"><strong>{{ invoice.counterparty }}</strong><span>{{ invoice.reference }}</span></span>
                <span class="baseline-status" [class]="'baseline-status ' + (invoice.statusTone ?? 'status-neutral')">{{ invoice.status ?? 'Uploaded' }}</span>
              </div>
              <div class="baseline-metrics">
                <span class="baseline-metric"><small>Due Date</small><strong>{{ invoice.dueDate ? formatDate(invoice.dueDate, true) : '—' }}</strong></span>
                <span class="baseline-metric"><small>Invoice Amount</small><strong>{{ invoice.amount !== undefined ? formatKes(invoice.amount) : '—' }}</strong></span>
              </div>
              <a class="baseline-button baseline-button--secondary baseline-button--block" [href]="invoice.fileUrl" target="_blank" rel="noopener noreferrer">View invoice</a>
            </article>
          }
        </div>
      </section>
    </div>

    @if (uploadOpen) {
      <div class="baseline-modal-backdrop invoice-upload-backdrop" role="presentation" (click)="uploadOpen = false">
        <section class="baseline-modal invoice-upload-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-upload-title" (click)="$event.stopPropagation()">
          <header class="baseline-modal__head"><h2 id="invoice-upload-title">Upload invoices</h2><button type="button" class="baseline-modal__close" aria-label="Close" (click)="uploadOpen = false">&times;</button></header>
          <div class="baseline-modal__body invoice-upload-modal__body">
            <p>Upload an invoice for one of your buyers. Once approved, it will be added to the matching financing period.</p>
            <div class="baseline-field"><label for="invoice-buyer">Buyer</label><select id="invoice-buyer" class="baseline-control"><option>FreshProduce Kenya Ltd</option><option>Twiga Foods Ltd</option></select></div>
            <div class="baseline-field"><label for="invoice-file">Invoice file</label><input id="invoice-file" class="baseline-control" type="file" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv"></div>
            <div class="baseline-field"><label for="invoice-due">Invoice due date</label><input id="invoice-due" class="baseline-control" type="date"></div>
            <div class="baseline-field"><label for="invoice-amount">Invoice amount</label><input id="invoice-amount" class="baseline-control" type="number" min="0" placeholder="KES"></div>
            <button type="button" class="baseline-button baseline-button--primary baseline-button--block invoice-upload-action" data-action="invoice-upload" (click)="completeUpload()">Submit invoice</button>
          </div>
        </section>
      </div>
    }

    @if (toast) { <button type="button" class="baseline-toast" (click)="toast = ''">{{ toast }}</button> }
  `,
  styles: [`
    :host { display: block; }
    .invoice-workspace { gap: 20px; }
    .invoice-workspace__hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
    .invoice-workspace__hero > div { display: grid; gap: 6px; }
    .invoice-workspace__hero h1, .invoice-workspace__hero p { margin: 0; }
    .invoice-workspace__hero h1 { color: var(--av-color-text-heading, #0d343f); font-size: 32px; line-height: 1.15; }
    .invoice-workspace__hero p, .invoice-upload-modal__body > p { max-width: 760px; color: var(--av-color-text-muted, #66788a); font-size: 13px; line-height: 1.55; }
    .invoice-upload-action { border-color: var(--av-color-success, #39c173) !important; background: var(--av-color-success, #39c173) !important; color: #fff !important; }
    .invoice-files-table { min-width: 860px; }
    .invoice-files-cards { display: none; }
    .invoice-row--overdue { background: #fff4f4; }
    .invoice-file-card--overdue { border-color: #efb4b4; background: #fff4f4; }
    .invoice-upload-backdrop { display: flex; align-items: center; justify-content: center; padding: 24px; }
    .invoice-upload-modal { width: min(100%, 620px); max-height: min(88dvh, 780px); display: flex; flex-direction: column; overflow: hidden; margin: 0; border-radius: 14px; }
    .invoice-upload-modal__body { min-height: 0; overflow-y: auto; display: grid; gap: 14px; }
    .invoice-upload-modal__body > p { margin: 0; }
    @media (max-width: 767px) {
      .invoice-workspace__hero { display: grid; gap: 16px; }
      .invoice-workspace__hero h1 { font-size: 26px; }
      .invoice-workspace__hero .baseline-button { width: 100%; }
      .baseline-table-wrap { display: none; }
      .invoice-files-cards { display: grid; gap: 12px; }
      .invoice-upload-backdrop { align-items: flex-end; padding: 0; }
      .invoice-upload-modal { width: 100%; max-height: 92dvh; border-radius: 18px 18px 0 0; border-bottom: 0; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerInvoicesComponent {
  private readonly route = inject(ActivatedRoute)
  uploadOpen = this.route.snapshot.queryParamMap.get('action') === 'upload'
  toast = ''
  readonly formatDate = formatDate
  readonly formatKes = formatKes
  readonly invoices: readonly FinancingDocument[] = [...invoiceFinancingInvoices()].sort((a, b) => {
    const overdueA = a.status === 'Overdue' ? 0 : 1
    const overdueB = b.status === 'Overdue' ? 0 : 1
    if (overdueA !== overdueB) return overdueA - overdueB
    return (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
  })

  completeUpload(): void {
    this.uploadOpen = false
    this.toast = 'Invoice received. It will appear here after review.'
  }
}
