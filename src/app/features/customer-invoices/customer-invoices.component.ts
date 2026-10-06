import { InvoiceDocumentsStore, supplierInvoiceParties, type InvoicePortalRole } from '../../core/experience/invoice-portal.data'
import { InvoiceUploadComponent } from '../../shared/invoice-upload.component'
import { InvoiceHelpComponent } from '../../shared/invoice-help.component'
import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
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
  imports: [CustomerFilterBarComponent, InvoiceHelpComponent, InvoiceUploadComponent],
  template: `
    <div class="portal-page invoice-workspace" [class.invoice-workspace--embedded]="embedded">
      @if (!embedded) { <section class="invoice-workspace__hero">
        <div><h1>Invoices</h1><p>View invoice files used for Invoice Financing and upload new invoices where you are responsible.</p></div>
        @if (canUpload) { <button type="button" class="baseline-button baseline-button--primary invoice-upload-action" data-action="invoice-upload" (click)="uploadOpen = true">Upload invoices</button> }
      </section> }

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
            <thead><tr><th>Invoice<app-invoice-help label="Invoice" text="The invoice reference and its attached filename, when a file is available." /></th><th>{{ role === 'supplier' ? 'Buyer' : 'Supplier' }}<app-invoice-help label="Invoice party" text="The business linked to this invoice." /></th><th>Due Date<app-invoice-help label="Due Date" text="The agreed invoice payment due date." /></th><th>Amount<app-invoice-help label="Amount" text="The full invoice value, not the amount financed." /></th><th>Review Status<app-invoice-help label="Review Status" text="Whether Avenews has reviewed and approved the invoice." /></th><th>Financing Availability<app-invoice-help label="Financing Availability" text="Whether the approved invoice can currently contribute to financing availability." /></th><th>Action<app-invoice-help label="Action" text="Open the attached invoice file. This action appears only when a file is available." /></th></tr></thead>
            <tbody>
              @for (invoice of pageItems; track invoice.id) {
                <tr [class.invoice-row--overdue]="invoice.status === 'Overdue'">
                  <td><span class="baseline-financing-cell"><strong>{{ invoice.reference }}</strong>@if (invoice.fileName) { <span>{{ invoice.fileName }}</span> }</span></td>
                  <td>{{ invoice.counterparty }}</td>
                  <td>{{ invoice.dueDate ? formatDate(invoice.dueDate, true) : 'Not available' }}</td>
                  <td>{{ invoice.amount !== undefined ? formatKes(invoice.amount) : 'Not available' }}</td>
                  <td><span class="baseline-status" [class]="'baseline-status ' + reviewTone(invoice)">{{ reviewStatus(invoice) }}</span></td>
                  <td><span class="baseline-status" [class]="'baseline-status ' + financingTone(invoice)">{{ financingStatus(invoice) }}</span>@if(invoice.financingAvailableFrom){<small class="invoice-availability-date">From {{formatDate(invoice.financingAvailableFrom,true)}}</small>}</td>
                  <td><div class="invoice-actions">@if (invoice.fileUrl) { <a class="baseline-button baseline-button--secondary" [href]="invoice.fileUrl" target="_blank" rel="noopener noreferrer">View invoice</a> }<button type="button" class="baseline-button baseline-button--secondary" (click)="contactSupport(invoice)">Contact support</button></div></td>
                </tr>
              } @empty {
                <tr><td colspan="7"><div class="baseline-empty"><strong>{{ embedded && !invoices.length ? 'No invoices linked to this period' : 'No matching invoices' }}</strong><p>{{ invoices.length ? 'Try changing your search or filters.' : 'Invoices will appear here when they are available.' }}</p></div></td></tr>
              }
            </tbody>
          </table>
        </div>

        <div class="baseline-cards invoice-files-cards">
          @for (invoice of pageItems; track invoice.id) {
            <article class="baseline-record-card invoice-file-card" [class.invoice-file-card--overdue]="invoice.status === 'Overdue'">
              <div class="baseline-record-card__head"><span class="baseline-financing-cell"><strong>{{ invoice.counterparty }}</strong><span>{{ invoice.reference }}</span></span><span class="baseline-status" [class]="'baseline-status ' + reviewTone(invoice)">{{ reviewStatus(invoice) }}</span></div>
              <div class="baseline-metrics"><span class="baseline-metric"><small>Due Date</small><strong>{{ invoice.dueDate ? formatDate(invoice.dueDate, true) : 'Not available' }}</strong></span><span class="baseline-metric"><small>Invoice Amount</small><strong>{{ invoice.amount !== undefined ? formatKes(invoice.amount) : 'Not available' }}</strong></span></div>
              <div class="invoice-card-availability"><small>Financing Availability</small><span class="baseline-status" [class]="'baseline-status ' + financingTone(invoice)">{{ financingStatus(invoice) }}</span>@if(invoice.financingAvailableFrom){<small>From {{formatDate(invoice.financingAvailableFrom,true)}}</small>}</div>
              <div class="invoice-actions invoice-actions--card">@if (invoice.fileUrl) { <a class="baseline-button baseline-button--secondary baseline-button--block" [href]="invoice.fileUrl" target="_blank" rel="noopener noreferrer">View invoice</a> }<button type="button" class="baseline-button baseline-button--secondary baseline-button--block" (click)="contactSupport(invoice)">Contact support</button></div>
            </article>
          } @empty { <div class="baseline-empty"><strong>{{ embedded && !invoices.length ? 'No invoices linked to this period' : 'No matching invoices' }}</strong><p>{{ invoices.length ? 'Try changing your search or filters.' : 'Invoices will appear here when they are available.' }}</p></div> }
        </div>

        @if (filteredInvoices.length) {
          <div class="baseline-pagination"><p>Showing <strong>{{ rangeStart }}-{{ rangeEnd }}</strong> of {{ filteredInvoices.length }} invoices</p><div class="baseline-pagination__controls"><button type="button" [disabled]="page === 1" (click)="changePage(page - 1)">‹</button>@for (n of pageNumbers; track n) { <button type="button" [class.is-active]="n === page" (click)="changePage(n)">{{ n }}</button> }<button type="button" [disabled]="page === totalPages" (click)="changePage(page + 1)">›</button></div></div>
        }
      </section>
    </div>

    @if (uploadOpen && !embedded && canUpload) { <app-invoice-upload [role]="role" (close)="uploadOpen=false" /> }

    @if (toast) { <button type="button" class="baseline-toast" (click)="toast = ''">{{ toast }}</button> }
  `,
  styles: [`
    :host{display:block;min-width:0}.invoice-workspace--embedded{width:100%;margin:0}.invoice-workspace--embedded .baseline-pagination__controls{flex-wrap:wrap;justify-content:center}.invoice-workspace{gap:24px}.invoice-workspace__hero{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}.invoice-workspace__hero>div{display:grid;gap:6px}.invoice-workspace__hero h1,.invoice-workspace__hero p{margin:0}.invoice-workspace__hero h1{color:var(--av-color-text-heading,#0d343f);font-size:32px;line-height:1.15}.invoice-workspace__hero p,.invoice-upload-modal__body>p{max-width:760px;color:var(--av-color-text-muted,#66788a);font-size:13px;line-height:1.55}.invoice-list{display:grid;gap:16px}.invoice-list__toolbar{display:flex;justify-content:flex-start;width:100%}.invoice-list__toolbar app-customer-filter-bar{width:100%}.invoice-upload-action{border-color:var(--av-color-success,#39c173)!important;background:var(--av-color-success,#39c173)!important;color:#fff!important}.invoice-files-table{min-width:1180px}.invoice-files-cards{display:none}.invoice-row--overdue{background:#fff4f4}.invoice-file-card--overdue{border-color:#efb4b4;background:#fff4f4}.invoice-upload-backdrop{display:flex;align-items:center;justify-content:center;padding:24px}.invoice-upload-modal{width:min(100%,620px);max-height:min(88dvh,780px);display:flex;flex-direction:column;overflow:hidden;margin:0;border-radius:14px}.invoice-upload-modal__body{min-height:0;overflow-y:auto;display:grid;gap:14px}.invoice-upload-modal__body>p{margin:0}.invoice-availability-date,.invoice-card-availability small{display:block;margin-top:4px;color:var(--av-color-text-muted,#66788a);font-size:11px}.invoice-card-availability{display:grid;gap:5px}.invoice-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.invoice-actions--card{display:grid}@media(max-width:767px){.invoice-workspace{gap:20px}.invoice-workspace__hero{display:grid;gap:16px}.invoice-workspace__hero h1{font-size:26px}.invoice-workspace__hero .baseline-button{width:100%}.invoice-list{gap:14px}.baseline-table-wrap{display:none}.invoice-files-cards{display:grid;gap:12px}.invoice-upload-backdrop{align-items:flex-end;padding:0}.invoice-upload-modal{width:100%;max-height:92dvh;border-radius:18px 18px 0 0;border-bottom:0}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerInvoicesComponent implements OnChanges {
  @Input() embedded=false
  @Input() periodId=''
  @Input({transform:(value:InvoicePortalRole|undefined)=>value==='partner'?'partner':'supplier'}) role:InvoicePortalRole='supplier'
  readonly invoiceStore=inject(InvoiceDocumentsStore)
  get canUpload():boolean {return this.role==='partner'||supplierInvoiceParties().some(p=>p.uploader==='supplier')}
  ngOnChanges():void{this.search='';this.review='';this.financing='';this.sort='';this.page=1}
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  uploadOpen = this.route.snapshot.queryParamMap.get('action') === 'upload'
  toast = ''
  search = ''
  review = ''
  financing = ''
  sort = ''
  page = 1
  readonly pageSize = 10
  readonly formatDate = formatDate
  readonly formatKes = formatKes
  get invoices(): readonly FinancingDocument[] {const items=this.role==='supplier'?this.invoiceStore.supplierInvoices():this.invoiceStore.partnerInvoices();return this.periodId?items.filter(i=>i.periodId===this.periodId):items}

  get filterFields(): readonly CustomerFilterField[] {return [
    {key:'review',label:'Review status',allLabel:'All review statuses',options:[...new Set(this.invoices.map(i=>this.reviewStatus(i)))].map(value=>({value,label:value}))},
    {key:'financing',label:'Financing availability',allLabel:'All financing states',options:[...new Set(this.invoices.map(i=>this.financingStatus(i)))].map(value=>({value,label:value}))},
  ]}

  get sortOptions(): readonly CustomerSortOption[] { return [
    { value: 'invoice-asc', label: 'Invoice: A-Z' },
    { value: 'buyer-asc', label: this.role==='partner'?'Supplier: A-Z':'Buyer: A-Z' },
    { value: 'due-asc', label: 'Due date: earliest' },
    { value: 'due-desc', label: 'Due date: latest' },
    { value: 'amount-desc', label: 'Amount: high to low' },
    { value: 'amount-asc', label: 'Amount: low to high' },
    { value: 'status-asc', label: 'Financing availability: A-Z' },
  ] }

  get filterValues(): Readonly<Record<string,string>> { return { review: this.review, financing: this.financing } }

  get filteredInvoices(): readonly FinancingDocument[] {
    const q=this.search.trim().toLowerCase()
    const items=this.invoices.filter(i=>!this.review || this.reviewStatus(i)===this.review).filter(i=>!this.financing || this.financingStatus(i)===this.financing).filter(i=>!q || [i.reference,i.fileName,i.counterparty,this.reviewStatus(i),this.financingStatus(i),i.dueDate ?? '',i.amount ?? ''].join(' ').toLowerCase().includes(q))
    return [...items].sort((a,b)=>{
      if(this.sort==='invoice-asc') return a.reference.localeCompare(b.reference)
      if(this.sort==='buyer-asc') return a.counterparty.localeCompare(b.counterparty)
      if(this.sort==='due-asc') return (a.dueDate??'').localeCompare(b.dueDate??'')
      if(this.sort==='due-desc') return (b.dueDate??'').localeCompare(a.dueDate??'')
      if(this.sort==='amount-desc') return (b.amount??0)-(a.amount??0)
      if(this.sort==='amount-asc') return (a.amount??0)-(b.amount??0)
      if(this.sort==='status-asc') return this.financingStatus(a).localeCompare(this.financingStatus(b))
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
  onFilters(v:Record<string,string>){this.review=v['review']??'';this.financing=v['financing']??'';this.page=1}
  onSort(v:string){this.sort=v;this.page=1}
  changePage(p:number){this.page=Math.min(Math.max(1,p),this.totalPages)}
  reviewStatus(invoice:FinancingDocument):string{return invoice.status==='Awaiting review'?'Awaiting review':'Approved'}
  reviewTone(invoice:FinancingDocument):string{return invoice.status==='Awaiting review'?'status-warning':'status-success'}
  financingStatus(invoice:FinancingDocument):string{
    if(invoice.status==='Awaiting review'&&invoice.financingAvailability!=='Not yet available')return'Pending approval'
    return invoice.financingAvailability??invoice.status??'Not available'
  }
  financingTone(invoice:FinancingDocument):string{
    const status=this.financingStatus(invoice)
    if(status==='Overdue')return'status-danger'
    if(status==='Available to request'||status==='Eligible'||status==='Financed')return'status-success'
    if(status==='Pending approval'||status==='Cutoff reached')return'status-warning'
    return'status-neutral'
  }
  contactSupport(invoice:FinancingDocument):void{
    const experience=this.role==='partner'?'invoice-partner':'invoice-financing'
    const partyKey=this.role==='partner'?'supplier':'buyer'
    void this.router.navigate(['/experience',experience,'support'],{queryParams:{type:'invoice-question',invoice:invoice.reference,period:invoice.periodId,[partyKey]:invoice.counterparty}})
  }

}
