import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
  FINANCING_RECORDS,
  type FinancingRecord,
  type FinancingStatus,
  type ProductCode,
  formatDate,
  formatKes,
  productLabel,
  statusLabel,
  statusTone,
} from '../../shared/customer-portal.data'
import {
  CustomerFilterBarComponent,
  type CustomerFilterField,
} from '../../shared/customer-filter-bar.component'

const MOBILE_PRIORITY: Record<FinancingStatus, number> = {
  delinquent: 0,
  default: 1,
  live: 2,
  offered: 3,
  validating: 4,
  requested: 5,
  repaid: 6,
  cancelled: 7,
  declined: 8,
}

@Component({
  selector: 'app-financing-activity',
  standalone: true,
  imports: [CommonModule, CustomerFilterBarComponent],
  templateUrl: './financing-activity.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancingActivityComponent {
  private readonly route = inject(ActivatedRoute)

  readonly products: { value: ProductCode; label: string }[] = [
    { value: 'ACL', label: productLabel('ACL') },
    { value: 'ABF', label: productLabel('ABF') },
    { value: 'SF', label: productLabel('SF') },
    { value: 'ASF', label: productLabel('ASF') },
    { value: 'ASFX', label: productLabel('ASFX') },
  ]

  readonly statuses: FinancingStatus[] = ['requested', 'validating', 'offered', 'live', 'repaid', 'delinquent', 'default', 'cancelled', 'declined']
  readonly filterFields: readonly CustomerFilterField[] = [
    {
      key: 'product',
      label: 'Product',
      allLabel: 'All products',
      options: this.products,
    },
    {
      key: 'status',
      label: 'Status',
      allLabel: 'All statuses',
      options: this.statuses.map(status => ({ value: status, label: statusLabel(status) })),
    },
    {
      key: 'dueDate',
      label: 'Due date',
      allLabel: 'Any due date',
      options: [
        { value: 'overdue', label: 'Overdue' },
        { value: 'due-soon', label: 'Due soon (<= 7 days)' },
        { value: 'this-30', label: 'Due <= 30 days' },
        { value: 'this-60', label: 'Due <= 60 days' },
        { value: 'this-90', label: 'Due <= 90 days' },
      ],
    },
  ]

  view = this.initialView()
  productFilter = ''
  statusFilter = ''
  dateFilter = ''
  searchQuery = ''
  page = 1
  readonly pageSize = 10

  private initialView(): string {
    const value = this.route.snapshot.queryParamMap.get('view')
    return value === 'active' || value === 'due' || value === 'overdue' ? value : ''
  }

  get filterValues(): Readonly<Record<string, string>> {
    return {
      product: this.productFilter,
      status: this.statusFilter,
      dueDate: this.dateFilter,
    }
  }

  get viewLabel(): string {
    if (this.view === 'active') return 'Active financing periods'
    if (this.view === 'due') return 'Payments due'
    if (this.view === 'overdue') return 'Payments overdue'
    return ''
  }

  get filteredRecords(): FinancingRecord[] {
    const query = this.searchQuery.trim().toLowerCase()
    return FINANCING_RECORDS
      .filter(record => this.matchesView(record))
      .filter(record => !this.productFilter || record.product === this.productFilter)
      .filter(record => !this.statusFilter || record.status === this.statusFilter)
      .filter(record => this.matchesDateFilter(record))
      .filter(record => !query || [record.partner, record.fundsRequestId, productLabel(record.product)].join(' ').toLowerCase().includes(query))
  }

  get orderedRecords(): FinancingRecord[] {
    return [...this.filteredRecords].sort((a, b) => MOBILE_PRIORITY[a.status] - MOBILE_PRIORITY[b.status])
  }

  get pageItems(): FinancingRecord[] {
    const start = (this.page - 1) * this.pageSize
    return this.filteredRecords.slice(start, start + this.pageSize)
  }

  get mobilePageItems(): FinancingRecord[] {
    const start = (this.page - 1) * this.pageSize
    return this.orderedRecords.slice(start, start + this.pageSize)
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRecords.length / this.pageSize))
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1)
  }

  get rangeStart(): number {
    return this.filteredRecords.length ? (this.page - 1) * this.pageSize + 1 : 0
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.filteredRecords.length)
  }

  matchesView(record: FinancingRecord): boolean {
    if (!this.view) return true
    if (this.view === 'active') return record.status === 'live' || record.status === 'delinquent'
    if (this.view === 'due') return record.status === 'live' && record.installments.some(item => item.status !== 'paid')
    return record.status === 'delinquent'
  }

  matchesDateFilter(record: FinancingRecord): boolean {
    if (!this.dateFilter) return true
    if (this.dateFilter === 'overdue') return record.status === 'delinquent' || record.status === 'default'
    const due = this.nextDueDateValue(record)
    if (!due) return false
    const dueTime = new Date(`${due}T00:00:00`).getTime()
    const now = Date.now()
    if (this.dateFilter === 'due-soon') return dueTime >= now && dueTime <= now + 7 * 86400000
    if (this.dateFilter === 'this-30') return dueTime >= now && dueTime <= now + 30 * 86400000
    if (this.dateFilter === 'this-60') return dueTime >= now && dueTime <= now + 60 * 86400000
    if (this.dateFilter === 'this-90') return dueTime >= now && dueTime <= now + 90 * 86400000
    return true
  }

  nextDueDateValue(record: FinancingRecord): string | null {
    return record.installments.find(item => item.status !== 'paid')?.dueDate ?? null
  }

  nextDueDate(record: FinancingRecord): string {
    return formatDate(this.nextDueDateValue(record), true)
  }

  onFilterValuesChange(values: Record<string, string>): void {
    this.productFilter = values['product'] ?? ''
    this.statusFilter = values['status'] ?? ''
    this.dateFilter = values['dueDate'] ?? ''
    this.page = 1
  }

  onSearchValueChange(value: string): void {
    this.searchQuery = value
    this.page = 1
  }

  resetFilters(): void {
    this.view = ''
    this.productFilter = ''
    this.statusFilter = ''
    this.dateFilter = ''
    this.searchQuery = ''
    this.page = 1
  }

  clearView(): void {
    this.view = ''
    this.page = 1
  }

  changePage(nextPage: number): void {
    this.page = Math.min(Math.max(1, nextPage), this.totalPages)
  }

  readonly productLabel = productLabel
  readonly formatKes = formatKes
  readonly formatDate = formatDate
  readonly statusLabel = statusLabel
  readonly statusTone = statusTone
}
