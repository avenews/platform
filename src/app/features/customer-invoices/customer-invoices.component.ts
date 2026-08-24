import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
  invoiceFinancingInvoices,
  type FinancingDocument,
} from '../../core/experience/financing-documents.data'
import {
  CustomerFilterBarComponent,
  type CustomerFilterField,
  type CustomerSortOption,
} from '../../shared/customer-filter-bar.component'
import { formatDate, formatKes } from '../../shared/customer-portal.data'

@Component({
  selector: 'app-customer-invoices',
  standalone: true,
  imports: [CustomerFilterBarComponent],
  template: `
    <div class="portal-page invoice-workspace">
      <section class="invoice-workspace__hero">
        <div><h1>Invoices</h1><p>View invoice files used for Invoice Financing and upload new invoices where you are responsible.</p></div>
        <button type="button" class="baseline-button baseline-button--primary invoice-upload-action" data-action="invoice-upload" (click)="uploadOpen = true">Upload invoices</button>
      </section>

      <section class="baseline-section invoice-list" aria-label="Invoices">
        <div class="invoice-list__toolbar">
          <app-customer-filter-bar
            [searchValue]="search"
            [searchPlaceholder]="'Search'"
            [searchAriaLabel]="'Search invoices'"
            [filters]="filterFields"
            [values]="filterValues"
            [sortOptions]="sortOptions"
            [sortValue]="sort"
            (searchValueChange)="onSearch($event)"
            (valuesChange)="onFilters($event)"
            (sortValueChange)="onSort($event)"
          />
        </div>

        <div class="baseline-table-wrap">
          <table class="baseline-table invoice-files-table">
            <thead><tr><th>Invoice</th><th>Buyer</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              @for (invoice of pageItems; track invoice.id) {
                <tr [class.invoice-row--overdue]="invoice.status === 'Overdue'">
                  <td><span class="baseline-financing-cell"><strong>{{ invoice.reference }}</strong><span>{{ invoice.fileName }}</span></span></td>
                  <td>{{ invoice.counterparty }}</td>
                  <td>{{ invoice.dueDate ? formatDate(invoice.dueDate, true) : '—' }}</td>
                  <td>{{ invoice.amount !== undefined ? formatKes(invoice.amount) : '—' }}</td>
                  <td><span class="baseline-status" [class]="'baseline-status ' + (invoice.statusTone ?? 'status-neutral')">{{ invoice.status ?? 'Uploaded' }}</span></td>
                  <td><a class="baseline-button baseline-button--secondary" [href]="invoice.fileUrl" target="_blank" rel="noopener noreferrer">View invoice</a></td>
                </tr>
              } @empty {
                <tr><td colspan="6"><div class="baseline-empty"><strong>No matching invoices</strong><p>Try changing your search or filters.</p></div></td></tr>
              }
            </tbody>
          </table>
        </div>

        <div class="baseline-cards invoice-files-cards">
          @for (invoice of pageItems; track invoice.id) {
            <article class="baseline-record-card invoice-file-card" [class.invoice-file-card--overdue]="invoice.status === 'Overdue'">
              <div class="baseline-record-card__head"><span class="baseline-financing-cell"><strong>{{ invoice.counterparty }}</strong><span>{{ invoice.reference }}</span></span><span class="baseline-status" [class]="'baseline-status ' + (invoice.statusTone ?? 'status-neutral')">{{ invoice.status ?? 'Uploaded' }}</span></div>
              <div class="baseline-metrics"><span class="baseline-metric"><small>Due Date</small><strong>{{ invoice.dueDate ? formatDate(invoice.dueDate, true) : '—' }}</strong></span><span class="baseline-metric"><small>Invoice Amount</small><strong>{{ invoice.amount !== undefined ? formatKes(invoice.amount) : '—' }}</strong></span></div>
              <a class="baseline-button baseline-button--secondary baseline-button--block" [href]="invoice.fileUrl" target="_blank" rel="noopener noreferrer">View invoice</a>
            </article>
          } @empty { <div class="baseline-empty"><strong>No matching invoices</strong><p>Try changing your search or filters.</p></div> }
        </div>

        @if (filteredInvoices.length) {
          <div class="baseline-pagination"><p>Showing <strong>{{ rangeStart }}-{{ rangeEnd }}</strong> of {{ filteredInvoices.length }} invoices</p><div class="baseline-pagination__controls"><button type="button" [disabled]="page === 1" (click)="changePage(page - 1)">‹</button>@for (n of pageNumbers; track n) { <button type="button" [class.is-active]="n === page" (click)="changePage(n)">{{ n }}</button> }<button type="button" [disabled]="page === totalPages" (click)="changePage(page + 1)">›</button></div></div>
        }
      </section>
    </div>

    @if (uploadOpen) {
      <div class="baseline-modal-backdrop invoice-upload-backdrop" role="presentation" (click)="uploadOpen = false">
        <section class="baseline-modal invoice-upload-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-upload-title" (click)="$event.stopPropagation()">
          <header class="baseline-modal__head"><h2 id="invoice-upload-title">Upload invoices</h2><button type="button" class="baseline-modal__close" aria-label="Close" (click)="uploadOpen = false">&times;</button></header>
          <div class="baseline-modal__body invoice-upload-modal__body">
            <p>Upload an invoice for a buyer where you provide the invoice information. Once approved, it will be added to the matching financing period.</p>
            <div class="baseline-field"><label for="invoice-buyer">Buyer</label><select id="invoice-buyer" class="baseline-control"><option>FreshProduce Kenya Ltd</option></select></div>
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
    :host{display:block}.invoice-workspace{gap:20px}.invoice-workspace__hero{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}.invoice-workspace__hero>div{display:grid;gap:6px}.invoice-workspace__hero h1,.invoice-workspace__hero p{margin:0}.invoice-workspace__hero h1{color:var(--av-color-text-heading,#0d343f);font-size:32px;line-height:1.15}.invoice-workspace__hero p,.invoice-upload-modal__body>p{max-width:760px;color:var(--av-color-text-muted,#66788a);font-size:13px;line-height:1.55}.invoice-list{display:grid;gap:14px}.invoice-list__toolbar{display:flex;justify-content:flex-end}.invoice-list__toolbar app-customer-filter-bar{width:100%}.invoice-upload-action{border-color:var(--av-color-success,#39c173)!important;background:var(--av-color-success,#39c173)!important;color:#fff!important}.invoice-files-table{min-width:860px}.invoice-files-cards{display:none}.invoice-row--overdue{background:#fff4f4}.invoice-file-card--overdue{border-color:#efb4b4;background:#fff4f4}.invoice-upload-backdrop{display:flex;align-items:center;justify-content:center;padding:24px}.invoice-upload-modal{width:min(100%,620px);max-height:min(88dvh,780px);display:flex;flex-direction:column;overflow:hidden;margin:0;border-radius:14px}.invoice-upload-modal__body{min-height:0;overflow-y:auto;display:grid;gap:14px}.invoice-upload-modal__body>p{margin:0}@media(max-width:767px){.invoice-workspace__hero{display:grid;gap:16px}.invoice-workspace__hero h1{font-size:26px}.invoice-workspace__hero .baseline-button{width:100%}.baseline-table-wrap{display:none}.invoice-files-cards{display:grid;gap:12px}.invoice-upload-backdrop{align-items:flex-end;padding:0}.invoice-upload-modal{width:100%;max-height:92dvh;border-radius:18px 18px 0 0;border-bottom:0}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerInvoicesComponent {
  private readonly route = inject(ActivatedRoute)
  uploadOpen = this.route.snapshot.queryParamMap.get('action') === 'upload'
  toast = ''
  search = ''
  status = ''
  sort = ''
  page = 1
  readonly pageSize = 10
  readonly formatDate = formatDate
  readonly formatKes = formatKes
  readonly invoices: readonly FinancingDocument[] = invoiceFinancingInvoices()

  readonly filterFields: readonly CustomerFilterField[] = [{ key: 'status', label: 'Status', allLabel: 'All statuses', options: [
    { value: 'Overdue', label: 'Overdue' }, { value: 'Financed', label: 'Financed' }, { value: 'Eligible', label: 'Eligible' }, { value: 'Not financed', label: 'Not financed' },
  ] }]

  readonly sortOptions: readonly CustomerSortOption[] = [
    { value: 'due-asc', label: 'Due date: earliest' }, { value: 'due-desc', label: 'Due date: latest' }, { value: 'amount-desc', label: 'Amount: high to low' }, { value: 'amount-asc', label: 'Amount: low to high' }, { value: 'buyer-asc', label: 'Buyer: A-Z' },
  ]

  get filterValues(): Readonly<Record<string,string>> { return { status: this.status } }

  get filteredInvoices(): readonly FinancingDocument[] {
    const q=this.search.trim().toLowerCase()
    const items=this.invoices.filter(i=>!this.status || (i.status ?? 'Uploaded')===this.status).filter(i=>!q || [i.reference,i.fileName,i.counterparty,i.status ?? 'Uploaded',i.dueDate ?? '',i.amount ?? ''].join(' ').toLowerCase().includes(q))
    return [...items].sort((a,b)=>{
      if(this.sort==='due-asc') return (a.dueDate??'').localeCompare(b.dueDate??'')
      if(this.sort==='due-desc') return (b.dueDate??'').localeCompare(a.dueDate??'')
      if(this.sort==='amount-desc') return (b.amount??0)-(a.amount??0)
      if(this.sort==='amount-asc') return (a.amount??0)-(b.amount??0)
      if(this.sort==='buyer-asc') return a.counterparty.localeCompare(b.counterparty)
      const oa=a.status==='Overdue'?0:1, ob=b.status==='Overdue'?0:1
      return oa-ob || (a.dueDate??'').localeCompare(b.dueDate??'')
    })
  }
  get pageItems(){const s=(this.page-1)*this.pageSize;return this.filteredInvoices.slice(s,s+this.pageSize)}
  get totalPages(){return Math.max(1,Math.ceil(this.filteredInvoices.length/this.pageSize))}
  get pageNumbers(){return Array.from({length:this.totalPages},(_,i)=>i+1)}
  get rangeStart(){return this.filteredInvoices.length?(this.page-1)*this.pageSize+1:0}
  get rangeEnd(){return Math.min(this.page*this.pageSize,this.filteredInvoices.length)}
  onSearch(v:string){this.search=v;this.page=1}
  onFilters(v:Record<string,string>){this.status=v['status']??'';this.page=1}
  onSort(v:string){this.sort=v;this.page=1}
  changePage(p:number){this.page=Math.min(Math.max(1,p),this.totalPages)}
  completeUpload(): void { this.uploadOpen=false; this.toast='Invoice received. It will appear here after review.' }
}
