import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { CustomerFilterBarComponent, CustomerFilterField, CustomerSortOption } from '../../shared/customer-filter-bar.component'
import { ReviewHelpComponent } from './review-help.component'

export interface ReviewColumn { key: string; label: string; help: string; numeric?: boolean; sortable?: boolean }
export interface ReviewCell { text: string; secondary?: string; sort?: string | number; status?: boolean }
export interface ReviewAction { key: string; label: string; href?: string; primary?: boolean }
export interface ReviewRow { id: string; cells: Record<string, ReviewCell>; actions: ReviewAction[]; open?: string; overdue?: boolean }

@Component({
  selector: 'app-review-table', standalone: true, imports: [CustomerFilterBarComponent, ReviewHelpComponent],
  template: `
    <div class="table-stack">
      <div class="table-toolbar">
        @if (heading) { <h2>{{ heading }}</h2> }
        <app-customer-filter-bar [searchValue]="search" searchPlaceholder="Search" [searchAriaLabel]="'Search ' + label"
          [filters]="filters" [values]="filterValues" [sortOptions]="sortOptions" [sortValue]="sort"
          (searchValueChange)="setSearch($event)" (valuesChange)="setFilter($event)" (sortValueChange)="setSort($event)" />
      </div>
      <div class="table-scroll">
        <table class="baseline-table review-table" [attr.aria-label]="label">
          <thead><tr>
            @for (column of columns; track column.key) {
              <th scope="col" [attr.aria-sort]="ariaSort(column.key)">{{ column.label }}<app-review-help [label]="column.label" [text]="column.help" /></th>
            }
            <th scope="col">Action<app-review-help label="Action" [text]="actionHelp" /></th>
          </tr></thead>
          <tbody>
            @for (row of pageItems; track row.id) {
              <tr [class.is-overdue]="row.overdue" [class.is-clickable]="!!row.open" [attr.tabindex]="row.open ? 0 : null"
                [attr.aria-label]="row.open ? 'View details for ' + row.cells[columns[0].key].text : null"
                (click)="openRow(row, $event)" (keydown.enter)="keyboardRow(row, $event)" (keydown.space)="keyboardRow(row, $event)">
                @for (column of columns; track column.key) {
                  <td [class.numeric]="column.numeric">
                    @if (row.cells[column.key]; as cell) {
                      @if (cell.status) { <span class="status-pill" [attr.data-tone]="tone(cell.text)">{{ cell.text }}</span> }
                      @else { <span [class.primary-cell]="column.key === columns[0].key">{{ cell.text }}</span> }
                      @if (cell.secondary) { <small>{{ cell.secondary }}</small> }
                    }
                  </td>
                }
                <td><div class="table-actions">
                  @for (action of row.actions; track action.key) {
                    @if (action.href) { <a class="baseline-button baseline-button--secondary" [href]="action.href" target="_blank" rel="noopener noreferrer">{{ action.label }}</a> }
                    @else { <button type="button" class="baseline-button baseline-button--secondary" [class.upload-action]="action.primary" (click)="takeAction.emit({key: action.key, id: row.id}); $event.stopPropagation()">{{ action.label }}</button> }
                  }
                </div></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="mobile-records" [attr.aria-label]="label">
        @for (row of pageItems; track row.id) {
          <article class="mobile-record" [class.is-overdue]="row.overdue">
            <header><div><strong>{{ row.cells[columns[0].key].text }}</strong><app-review-help [label]="columns[0].label" [text]="columns[0].help" />
              @if (row.cells[columns[0].key].secondary) { <small>{{ row.cells[columns[0].key].secondary }}</small> }</div></header>
            <dl>
              @for (column of columns.slice(1); track column.key) {
                <div><dt>{{ column.label }}<app-review-help [label]="column.label" [text]="column.help" /></dt><dd>
                  @if (row.cells[column.key]; as cell) {
                    @if (cell.status) { <span class="status-pill" [attr.data-tone]="tone(cell.text)">{{ cell.text }}</span> } @else { {{ cell.text }} }
                    @if (cell.secondary) { <small>{{ cell.secondary }}</small> }
                  }
                </dd></div>
              }
            </dl>
            @if (row.actions.length) { <div class="table-actions">
              @for (action of row.actions; track action.key) {
                @if (action.href) { <a class="baseline-button baseline-button--secondary" [href]="action.href" target="_blank" rel="noopener noreferrer">{{ action.label }}</a> }
                @else { <button type="button" class="baseline-button baseline-button--secondary" [class.upload-action]="action.primary" (click)="takeAction.emit({key: action.key, id: row.id})">{{ action.label }}</button> }
              }
            </div> }
          </article>
        }
      </div>
      @if (!filteredRows.length) {
        <div class="empty" role="status"><strong>{{ rows.length ? 'No matching records' : emptyTitle }}</strong><p>{{ rows.length ? 'Try changing your search or filters.' : emptyMessage }}</p></div>
      }
      @if (filteredRows.length) {
        <nav class="table-pagination" [attr.aria-label]="label + ' pagination'">
          <p aria-live="polite">Showing <strong>{{ start + 1 }}-{{ end }}</strong> of {{ filteredRows.length }}</p>
          <div><button type="button" class="baseline-button baseline-button--secondary" [disabled]="page === 1" aria-label="Previous page" (click)="page = page - 1">&#8249;</button>
            <span>Page {{ page }} of {{ totalPages }}</span>
            <button type="button" class="baseline-button baseline-button--secondary" [disabled]="page === totalPages" aria-label="Next page" (click)="page = page + 1">&#8250;</button></div>
        </nav>
      }
    </div>
  `,
  styles: [`
    :host{display:block;min-width:0}.table-stack{display:grid;gap:16px;min-width:0}.table-toolbar{display:flex;gap:20px;align-items:center;flex-wrap:wrap}.table-toolbar h2{font-size:18px;line-height:1.4;margin:0;margin-right:auto;color:#0d343f}.table-toolbar app-customer-filter-bar{flex:1;min-width:0}.table-scroll{max-width:100%;overflow:auto;border:1px solid #e1e7eb;border-radius:10px;background:#fff}.review-table{width:100%;min-width:760px;border-collapse:collapse}.review-table th{font-size:11px;line-height:1.5;white-space:nowrap}.review-table td{font-size:13px;line-height:1.5;vertical-align:middle;overflow-wrap:anywhere}.review-table small,.mobile-record small{display:block;color:#66788a;font-size:12px;line-height:1.5;margin-top:3px}.review-table td.numeric{font-variant-numeric:tabular-nums}.primary-cell{font-weight:650;color:#0d343f}.table-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.table-actions .baseline-button{min-height:44px;white-space:nowrap;font-size:12px;padding:9px 12px}.is-overdue{background:#fff5f5}.is-clickable{cursor:pointer}.is-clickable:hover{background:#f0f9fa}.is-clickable:focus-visible{outline:2px solid #12b4c6;outline-offset:-2px}.upload-action{background:var(--av-color-success,#39c173)!important;border-color:var(--av-color-success,#39c173)!important;color:#fff!important}.status-pill{display:inline-block;padding:5px 10px;border-radius:24px;background:#f1f3f6;color:#66788a;font-size:11px;line-height:1.4;font-weight:650;white-space:nowrap}.status-pill[data-tone=danger]{background:#ffebeb;color:#c2352d}.status-pill[data-tone=success]{background:#ebfcf1;color:#008650}.status-pill[data-tone=info]{background:#e7f9fb;color:#007f92}.status-pill[data-tone=warning]{background:#fff6df;color:#89610d}.empty{text-align:center;padding:28px 16px;line-height:1.6;color:#0d343f}.empty p{margin:5px 0 0;font-size:13px;color:#66788a}.mobile-records{display:none}.table-pagination{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:12px;color:#66788a}.table-pagination p{margin:0}.table-pagination>div{display:flex;gap:10px;align-items:center}.table-pagination .baseline-button{min-height:44px;min-width:44px;padding:8px}.table-pagination .baseline-button:disabled{opacity:.5}.mobile-record{border:1px solid #e1e7eb;border-radius:10px;padding:16px;min-width:0;background:#fff}.mobile-record.is-overdue{background:#fff5f5}.mobile-record header{display:flex;justify-content:space-between;gap:10px}.mobile-record header>div{min-width:0;overflow-wrap:anywhere}.mobile-record header strong{color:#0d343f;font-size:15px}.mobile-record dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0}.mobile-record dl>div{min-width:0}.mobile-record dt{font-size:11px;color:#66788a;line-height:1.5;display:flex;align-items:center}.mobile-record dd{margin:3px 0 0;font-size:13px;color:#0d343f;overflow-wrap:anywhere}.mobile-record .table-actions .baseline-button{flex:1;min-height:44px}.table-actions a:focus-visible,.table-actions button:focus-visible{outline:2px solid #12b4c6;outline-offset:2px}@media(min-width:768px) and (max-width:1100px){.table-toolbar{flex-direction:column;align-items:stretch}.table-toolbar app-customer-filter-bar{width:100%}}@media(max-width:767px){.table-scroll{display:none}.mobile-records{display:grid;gap:12px}.table-toolbar{display:grid;gap:14px}.table-toolbar app-customer-filter-bar{width:100%}.table-pagination{flex-wrap:wrap;gap:12px}.table-pagination>div{margin-left:auto}}@media(max-width:359px){.mobile-record dl{grid-template-columns:1fr}}
  `],
})
export class ReviewTableComponent implements OnChanges {
  @Input() rows: ReviewRow[] = []
  @Input() columns: ReviewColumn[] = []
  @Input() label = 'records'
  @Input() heading = ''
  @Input() filterColumn = 'status'
  @Input() emptyTitle = 'No records yet'
  @Input() emptyMessage = 'Records will appear here when available.'
  @Input() contextKey = ''
  @Input() pageSize = 10
  @Output() takeAction = new EventEmitter<{key: string; id: string}>()
  search = ''
  status = ''
  sort = ''
  page = 1
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contextKey']) { this.search = ''; this.status = ''; this.sort = ''; this.page = 1 }
    this.page = Math.min(this.page, this.totalPages)
  }
  get actionHelp(): string {
    if (this.label === 'invoices') return 'Open the attached source invoice file. Invoices without a file remain visible but have no file-opening action.'
    if (this.label === 'payments') return 'Open this payment’s invoice balance, clearing-account instructions and linked invoices. Opening payment details does not transfer money.'
    if (this.label === 'financing periods') return 'Open this period’s Overview and Invoices tabs. Request funds is available only where eligible financing remains.'
    return 'Open the selected record for its details. Invoice upload actions appear only where you are responsible for uploading.'
  }
  get filters(): CustomerFilterField[] {
    const column = this.columns.find(c => c.key === this.filterColumn)
    if (!column) return []
    const allLabel = /status$/i.test(column.label) ? 'All statuses' : 'All upload owners'
    return [{key: 'status', label: column.label, allLabel,
      options: [...new Set(this.rows.map(r => r.cells[this.filterColumn]?.text).filter(Boolean))].sort().map(value => ({value, label: value}))}]
  }
  get filterValues(): Readonly<Record<string,string>> { return {status: this.status} }
  get sortOptions(): CustomerSortOption[] {
    return this.columns.filter(c => c.sortable !== false).flatMap(c => {
      const date = /date|saved at/i.test(c.label)
      return [
        {value: `${c.key}:asc`, label: `${c.label}: ${c.numeric ? 'low to high' : date ? 'earliest' : 'A-Z'}`},
        {value: `${c.key}:desc`, label: `${c.label}: ${c.numeric ? 'high to low' : date ? 'latest' : 'Z-A'}`},
      ]
    })
  }
  get filteredRows(): ReviewRow[] {
    const q = this.search.trim().toLowerCase()
    const items = this.rows.filter(r => !this.status || r.cells[this.filterColumn]?.text === this.status)
      .filter(r => !q || this.columns.map(c => { const cell = r.cells[c.key]; return [cell?.text, cell?.secondary, cell?.sort].join(' ') }).join(' ').toLowerCase().includes(q))
    if (!this.sort) return items
    const [key, direction] = this.sort.split(':')
    return [...items].sort((a,b) => {
      const left = a.cells[key]?.sort ?? a.cells[key]?.text ?? '', right = b.cells[key]?.sort ?? b.cells[key]?.text ?? ''
      const order = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right))
      return direction === 'desc' ? -order : order
    })
  }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize)) }
  get start(): number { return (this.page - 1) * this.pageSize }
  get end(): number { return Math.min(this.page * this.pageSize, this.filteredRows.length) }
  get pageItems(): ReviewRow[] { return this.filteredRows.slice(this.start, this.end) }
  setSearch(value: string): void { this.search = value; this.page = 1 }
  setFilter(value: Record<string,string>): void { this.status = value['status'] ?? ''; this.page = 1 }
  setSort(value: string): void { this.sort = value; this.page = 1 }
  ariaSort(key: string): string | null { return this.sort === `${key}:asc` ? 'ascending' : this.sort === `${key}:desc` ? 'descending' : null }
  tone(status: string): string {
    if (status === 'Overdue') return 'danger'
    if (['Paid','Settled','Eligible','Approved','Available'].includes(status)) return 'success'
    if (['Cutoff','Part paid','Processing','Under review','Review upload'].includes(status)) return 'warning'
    if (['Open','Financed','Upcoming'].includes(status)) return 'info'
    return 'neutral'
  }
  openRow(row: ReviewRow, event: Event): void {
    if ((event.target as HTMLElement).closest('button,a,app-review-help')) return
    if (row.open) this.takeAction.emit({key: row.open, id: row.id})
  }
  keyboardRow(row: ReviewRow, event: Event): void {
    if (event.target !== event.currentTarget || !row.open) return
    event.preventDefault(); this.takeAction.emit({key: row.open, id: row.id})
  }
}
