import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import {
  INVOICES,
  type InvoiceFinancingStatus,
  type InvoiceRecord,
  formatDate,
  formatKes,
  invoiceStatusLabel,
  invoiceStatusTone,
} from '../../shared/customer-portal.data'
import {
  CustomerFilterBarComponent,
  type CustomerFilterField,
} from '../../shared/customer-filter-bar.component'

const STATUS_PRIORITY: Record<InvoiceFinancingStatus, number> = {
  'eligible-pending-validation': 0,
  eligible: 1,
  'partially-financed': 2,
  financed: 3,
  rejected: 4,
  'not-eligible': 5,
}

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, CustomerFilterBarComponent],
  templateUrl: './invoices.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesComponent {
  readonly statuses: InvoiceFinancingStatus[] = [
    'eligible-pending-validation',
    'eligible',
    'partially-financed',
    'financed',
    'rejected',
    'not-eligible',
  ]
  readonly partners = [...new Set(INVOICES.map(invoice => invoice.partner))].sort()
  readonly filterFields: readonly CustomerFilterField[] = [
    ...(this.partners.length > 1
      ? [{
          key: 'partner',
          label: 'Linked partner',
          allLabel: 'All partners',
          options: this.partners.map(partner => ({ value: partner, label: partner })),
        }]
      : []),
    {
      key: 'status',
      label: 'Financing status',
      allLabel: 'All statuses',
      options: this.statuses.map(status => ({ value: status, label: invoiceStatusLabel(status) })),
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
        { value: 'no-date', label: 'No due date' },
      ],
    },
  ]

  partnerFilter = ''
  financingFilter = ''
  dateFilter = ''
  searchQuery = ''
  page = 1
  readonly pageSize = 10
  toast = ''

  get filterValues(): Readonly<Record<string, string>> {
    return {
      partner: this.partnerFilter,
      status: this.financingFilter,
      dueDate: this.dateFilter,
    }
  }

  get filteredInvoices(): InvoiceRecord[] {
    const query = this.searchQuery.trim().toLowerCase()
    return INVOICES
      .filter(invoice => !this.partnerFilter || invoice.partner === this.partnerFilter)
      .filter(invoice => !this.financingFilter || invoice.financingStatus === this.financingFilter)
      .filter(invoice => this.matchesDateFilter(invoice))
      .filter(invoice => !query || [invoice.invoiceNumber, invoice.partner, invoiceStatusLabel(invoice.financingStatus)].join(' ').toLowerCase().includes(query))
  }

  get mobileInvoices(): InvoiceRecord[] {
    return [...this.filteredInvoices].sort((a, b) => STATUS_PRIORITY[a.financingStatus] - STATUS_PRIORITY[b.financingStatus])
  }

  get pageItems(): InvoiceRecord[] {
    const start = (this.page - 1) * this.pageSize
    return this.filteredInvoices.slice(start, start + this.pageSize)
  }

  get mobilePageItems(): InvoiceRecord[] {
    const start = (this.page - 1) * this.pageSize
    return this.mobileInvoices.slice(start, start + this.pageSize)
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredInvoices.length / this.pageSize))
  }

  matchesDateFilter(invoice: InvoiceRecord): boolean {
    if (!this.dateFilter) return true
    if (this.dateFilter === 'no-date') return !invoice.dueDate
    if (!invoice.dueDate) return false
    const time = new Date(`${invoice.dueDate}T00:00:00`).getTime()
    const now = Date.now()
    if (this.dateFilter === 'overdue') return time < now
    if (this.dateFilter === 'due-soon') return time >= now && time <= now + 7 * 86400000
    if (this.dateFilter === 'this-30') return time >= now && time <= now + 30 * 86400000
    if (this.dateFilter === 'this-60') return time >= now && time <= now + 60 * 86400000
    if (this.dateFilter === 'this-90') return time >= now && time <= now + 90 * 86400000
    return true
  }

  onFilterValuesChange(values: Record<string, string>): void {
    this.partnerFilter = values['partner'] ?? ''
    this.financingFilter = values['status'] ?? ''
    this.dateFilter = values['dueDate'] ?? ''
    this.page = 1
  }

  onSearchValueChange(value: string): void {
    this.searchQuery = value
    this.page = 1
  }

  resetFilters(): void {
    this.partnerFilter = ''
    this.financingFilter = ''
    this.dateFilter = ''
    this.searchQuery = ''
    this.page = 1
  }

  changePage(nextPage: number): void {
    this.page = Math.min(Math.max(1, nextPage), this.totalPages)
  }

  openInvoice(invoice: InvoiceRecord): void {
    if (!invoice.invoiceFileUrl) return
    this.toast = `Opening ${invoice.invoiceNumber}.`
    window.open(invoice.invoiceFileUrl, '_blank', 'noopener,noreferrer')
  }

  readonly formatDate = formatDate
  readonly formatKes = formatKes
  readonly invoiceStatusLabel = invoiceStatusLabel
  readonly invoiceStatusTone = invoiceStatusTone
}
