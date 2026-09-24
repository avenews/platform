import { PortalActionIconComponent } from '../../shared/portal-action-icon.component'
import { InvoiceHelpComponent } from '../../shared/invoice-help.component'
import { InvoiceUploadComponent } from '../../shared/invoice-upload.component'
import { CustomerInvoicesComponent } from '../customer-invoices/customer-invoices.component'
import { ClearingAccountDetailsComponent } from '../../shared/clearing-account-details.component'
import { InvoiceDocumentsStore, invoiceRelationshipTerms } from '../../core/experience/invoice-portal.data'
import { PARTNER_UPLOAD_BATCHES, PARTNER_SUPPLIERS, PARTNER_PERIODS, type PartnerSection, type UploadBatch, type PartnerSupplierRow, type PartnerPeriod } from '../../core/experience/partner-workspace.data'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
  CustomerFilterBarComponent,
  type CustomerFilterField,
  type CustomerSortOption,
} from '../../shared/customer-filter-bar.component'
import { formatDate, formatKes } from '../../shared/customer-portal.data'

@Component({
  selector: 'app-partner-workspace',
  standalone: true,
  imports: [PortalActionIconComponent, CustomerFilterBarComponent, InvoiceHelpComponent, InvoiceUploadComponent, CustomerInvoicesComponent, ClearingAccountDetailsComponent],
  templateUrl: './partner-workspace.component.html',
  styleUrl: './partner-workspace.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerWorkspaceComponent {
  private readonly route = inject(ActivatedRoute)

  @Input() section = (this.route.snapshot.data['section'] ?? 'invoice-uploads') as PartnerSection
  @Input() embeddedPayments=false
  readonly documents=inject(InvoiceDocumentsStore)
  readonly relationshipTerms=invoiceRelationshipTerms
  readonly formatDate = formatDate
  readonly formatKes = formatKes

  uploadOpen = this.section === 'invoice-uploads' && this.route.snapshot.queryParamMap.get('action') === 'upload'
  selectedBatch: UploadBatch | null = null
  selectedSupplier: PartnerSupplierRow | null = null
  selectedPeriod: PartnerPeriod | null = null
  returnSupplier: PartnerSupplierRow | null = null
  supplierPeriodsOpen = false
  returnSupplierPeriodsOpen = false
  toast = ''

  supplierSearch = ''
  supplierStatusFilter = ''
  supplierSort = ''
  supplierPage = 1
  readonly supplierPageSize = 5

  paymentSearch = ''
  paymentStatusFilter = ''
  paymentSort = ''
  paymentPage = 1
  readonly paymentPageSize = 6

  supplierPeriodSearch = ''
  supplierPeriodStatusFilter = ''
  supplierPeriodSort = ''
  supplierPeriodPage = 1
  readonly supplierPeriodPageSize = 10

  readonly supplierSortOptions: readonly CustomerSortOption[] = [
    { value: 'name-asc', label: 'Supplier: A-Z' },
    { value: 'available-desc', label: 'Available financing: high to low' },
    { value: 'available-asc', label: 'Available financing: low to high' },
    { value: 'active-desc', label: 'Active periods: high to low' },
    { value: 'active-asc', label: 'Active periods: low to high' },
    { value: 'payment-due-asc', label: 'Next payment: earliest' },
    { value: 'status-asc', label: 'Status: A-Z' },
  ]

  readonly paymentSortOptions: readonly CustomerSortOption[] = [
    { value: 'supplier-asc', label: 'Supplier: A-Z' },
    { value: 'period-asc', label: 'Financing period: A-Z' },
    { value: 'due-asc', label: 'Due date: earliest' },
    { value: 'due-desc', label: 'Due date: latest' },
    { value: 'amount-desc', label: 'Amount to pay: high to low' },
    { value: 'amount-asc', label: 'Amount to pay: low to high' },
    { value: 'status-asc', label: 'Status: A-Z' },
  ]

  readonly supplierPeriodSortOptions: readonly CustomerSortOption[] = [
    { value: 'reference-asc', label: 'Financing period: A-Z' },
    { value: 'due-asc', label: 'Due date: earliest' },
    { value: 'due-desc', label: 'Due date: latest' },
    { value: 'amount-desc', label: 'Amount to pay: high to low' },
    { value: 'amount-asc', label: 'Amount to pay: low to high' },
    { value: 'invoices-desc', label: 'Invoices: high to low' },
    { value: 'financing-desc', label: 'Financing: high to low' },
    { value: 'status-asc', label: 'Status: A-Z' },
  ]

  readonly uploadBatches = PARTNER_UPLOAD_BATCHES

  readonly suppliers = PARTNER_SUPPLIERS

  readonly periods = PARTNER_PERIODS

  get supplierFilterFields(): readonly CustomerFilterField[] {
    return [{ key: 'supplierStatus', label: 'Status', allLabel: 'All statuses', options: [
      { value: 'available', label: 'Available' },
      { value: 'unavailable', label: 'Unavailable' },
      { value: 'max-used', label: 'Max financing used' },
    ] }]
  }

  get supplierFilterValues(): Readonly<Record<string, string>> {
    return { supplierStatus: this.supplierStatusFilter }
  }

  get paymentFilterFields(): readonly CustomerFilterField[] {
    return [{ key: 'paymentStatus', label: 'Status', allLabel: 'All statuses', options: [
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'processing', label: 'Payment processing' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'paid', label: 'Paid' },
    ] }]
  }

  get paymentFilterValues(): Readonly<Record<string, string>> {
    return { paymentStatus: this.paymentStatusFilter }
  }

  get supplierPeriodFilterFields(): readonly CustomerFilterField[] {
    const statuses = new Map<string, string>()
    for (const period of this.selectedSupplier ? this.periodsForSupplier(this.selectedSupplier) : []) {
      statuses.set(period.periodStatus, period.periodStatus)
      statuses.set(period.paymentStatus, period.paymentStatus)
    }
    return [{ key: 'status', label: 'Status', allLabel: 'All statuses', options: Array.from(statuses.keys()).map(value => ({ value, label: value })) }]
  }

  get supplierPeriodFilterValues(): Readonly<Record<string, string>> {
    return { status: this.supplierPeriodStatusFilter }
  }

  get filteredSuppliers(): readonly PartnerSupplierRow[] {
    const query = this.supplierSearch.trim().toLowerCase()
    const items = this.suppliers
      .filter(supplier => !this.supplierStatusFilter || supplier.statusKey === this.supplierStatusFilter)
      .filter(supplier => {
        if (!query) return true
        return [
          supplier.business,
          supplier.identifier,
          formatKes(supplier.available),
          this.activePeriodCount(supplier),
          this.nextPaymentLabel(supplier),
          supplier.status,
        ].join(' ').toLowerCase().includes(query)
      })

    return [...items].sort((a, b) => {
      if (this.supplierSort === 'available-desc') return b.available - a.available
      if (this.supplierSort === 'available-asc') return a.available - b.available
      if (this.supplierSort === 'active-desc') return this.activePeriodCount(b) - this.activePeriodCount(a)
      if (this.supplierSort === 'active-asc') return this.activePeriodCount(a) - this.activePeriodCount(b)
      if (this.supplierSort === 'payment-due-asc') return this.nextPaymentDate(a).localeCompare(this.nextPaymentDate(b))
      if (this.supplierSort === 'status-asc') return a.status.localeCompare(b.status)
      if (this.supplierSort === 'name-asc') return a.business.localeCompare(b.business)
      const aOverdue = this.periodsForSupplier(a).some(period => period.paymentStatusKey === 'overdue')
      const bOverdue = this.periodsForSupplier(b).some(period => period.paymentStatusKey === 'overdue')
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1
      return a.business.localeCompare(b.business)
    })
  }

  get supplierPageItems(): readonly PartnerSupplierRow[] {
    const start = (this.supplierPage - 1) * this.supplierPageSize
    return this.filteredSuppliers.slice(start, start + this.supplierPageSize)
  }
  get supplierTotalPages(): number { return Math.max(1, Math.ceil(this.filteredSuppliers.length / this.supplierPageSize)) }
  get supplierPageNumbers(): readonly number[] { return Array.from({ length: this.supplierTotalPages }, (_, index) => index + 1) }
  get supplierRangeStart(): number { return this.filteredSuppliers.length ? (this.supplierPage - 1) * this.supplierPageSize + 1 : 0 }
  get supplierRangeEnd(): number { return Math.min(this.supplierPage * this.supplierPageSize, this.filteredSuppliers.length) }

  get filteredPaymentPeriods(): readonly PartnerPeriod[] {
    const query = this.paymentSearch.trim().toLowerCase()
    const items = this.periods
      .filter(period => !this.paymentStatusFilter || period.paymentStatusKey === this.paymentStatusFilter)
      .filter(period => {
        if (!query) return true
        const supplier = this.supplierForPeriod(period)
        return [
          supplier?.business ?? '',
          supplier?.identifier ?? '',
          period.reference,
          formatDate(period.dueDate, true),
          formatKes(period.amountToPay),
          period.paymentStatus,
        ].join(' ').toLowerCase().includes(query)
      })

    return [...items].sort((a, b) => {
      if (this.paymentSort === 'supplier-asc') return (this.supplierForPeriod(a)?.business ?? '').localeCompare(this.supplierForPeriod(b)?.business ?? '')
      if (this.paymentSort === 'period-asc') return a.reference.localeCompare(b.reference)
      if (this.paymentSort === 'due-asc') return a.dueDate.localeCompare(b.dueDate)
      if (this.paymentSort === 'due-desc') return b.dueDate.localeCompare(a.dueDate)
      if (this.paymentSort === 'amount-desc') return b.amountToPay - a.amountToPay
      if (this.paymentSort === 'amount-asc') return a.amountToPay - b.amountToPay
      if (this.paymentSort === 'status-asc') return a.paymentStatus.localeCompare(b.paymentStatus)
      return this.paymentPriority(a) - this.paymentPriority(b) || a.dueDate.localeCompare(b.dueDate)
    })
  }

  get paymentPageItems(): readonly PartnerPeriod[] {
    const start = (this.paymentPage - 1) * this.paymentPageSize
    return this.filteredPaymentPeriods.slice(start, start + this.paymentPageSize)
  }
  get paymentTotalPages(): number { return Math.max(1, Math.ceil(this.filteredPaymentPeriods.length / this.paymentPageSize)) }
  get paymentPageNumbers(): readonly number[] { return Array.from({ length: this.paymentTotalPages }, (_, index) => index + 1) }
  get paymentRangeStart(): number { return this.filteredPaymentPeriods.length ? (this.paymentPage - 1) * this.paymentPageSize + 1 : 0 }
  get paymentRangeEnd(): number { return Math.min(this.paymentPage * this.paymentPageSize, this.filteredPaymentPeriods.length) }

  get filteredSupplierPeriods(): readonly PartnerPeriod[] {
    const supplier = this.selectedSupplier
    if (!supplier) return []
    const query = this.supplierPeriodSearch.trim().toLowerCase()
    const items = this.periodsForSupplier(supplier)
      .filter(period => !this.supplierPeriodStatusFilter || period.periodStatus === this.supplierPeriodStatusFilter || period.paymentStatus === this.supplierPeriodStatusFilter)
      .filter(period => !query || [
        period.reference,
        formatDate(period.dueDate, true),
        formatKes(period.amountToPay),
        period.invoiceCount,
        formatKes(period.financedAgainst),
        period.periodStatus,
        period.paymentStatus,
      ].join(' ').toLowerCase().includes(query))

    if (!this.supplierPeriodSort) return items

    return [...items].sort((a, b) => {
      if (this.supplierPeriodSort === 'reference-asc') return a.reference.localeCompare(b.reference)
      if (this.supplierPeriodSort === 'due-asc') return a.dueDate.localeCompare(b.dueDate)
      if (this.supplierPeriodSort === 'due-desc') return b.dueDate.localeCompare(a.dueDate)
      if (this.supplierPeriodSort === 'amount-desc') return b.amountToPay - a.amountToPay
      if (this.supplierPeriodSort === 'amount-asc') return a.amountToPay - b.amountToPay
      if (this.supplierPeriodSort === 'invoices-desc') return b.invoiceCount - a.invoiceCount
      if (this.supplierPeriodSort === 'financing-desc') return b.financedAgainst - a.financedAgainst
      if (this.supplierPeriodSort === 'status-asc') return this.primaryPeriodStatus(a).localeCompare(this.primaryPeriodStatus(b))
      return 0
    })
  }

  get supplierPeriodPageItems(): readonly PartnerPeriod[] {
    const start = (this.supplierPeriodPage - 1) * this.supplierPeriodPageSize
    return this.filteredSupplierPeriods.slice(start, start + this.supplierPeriodPageSize)
  }
  get supplierPeriodTotalPages(): number { return Math.max(1, Math.ceil(this.filteredSupplierPeriods.length / this.supplierPeriodPageSize)) }
  get supplierPeriodPageNumbers(): readonly number[] { return Array.from({ length: this.supplierPeriodTotalPages }, (_, index) => index + 1) }
  get supplierPeriodRangeStart(): number { return this.filteredSupplierPeriods.length ? (this.supplierPeriodPage - 1) * this.supplierPeriodPageSize + 1 : 0 }
  get supplierPeriodRangeEnd(): number { return Math.min(this.supplierPeriodPage * this.supplierPeriodPageSize, this.filteredSupplierPeriods.length) }

  get paymentDueTotal(): number { return this.periods.filter(period => period.paymentStatusKey !== 'paid').reduce((total, period) => total + period.amountToPay, 0) }
  get paymentDueCount(): number { return this.periods.filter(period => period.paymentStatusKey !== 'paid').length }
  get overduePaymentCount(): number { return this.periods.filter(period => period.paymentStatusKey === 'overdue').length }

  periodsForSupplier(supplier: PartnerSupplierRow): readonly PartnerPeriod[] {
    return this.periods.filter(period => supplier.periodIds.includes(period.id)).sort((a, b) => this.paymentPriority(a) - this.paymentPriority(b) || a.dueDate.localeCompare(b.dueDate))
  }
  supplierForPeriod(period: PartnerPeriod): PartnerSupplierRow | undefined { return this.suppliers.find(supplier => supplier.id === period.supplierId) }
  activePeriodCount(supplier: PartnerSupplierRow): number { return this.periodsForSupplier(supplier).filter(period => !['settled', 'expired'].includes(period.periodStatusKey)).length }
  supplierPaymentDue(supplier: PartnerSupplierRow): number { return this.periodsForSupplier(supplier).filter(period => period.paymentStatusKey !== 'paid').reduce((total, period) => total + period.amountToPay, 0) }
  nextPaymentLabel(supplier: PartnerSupplierRow): string {
    const period = this.periodsForSupplier(supplier).find(item => item.paymentStatusKey !== 'paid')
    return period ? `${formatKes(period.amountToPay)} · ${formatDate(period.dueDate, true)}` : 'No payment due'
  }
  showPaymentStatus(period: PartnerPeriod): boolean { return period.paymentStatus !== period.periodStatus }
  primaryPeriodStatus(period: PartnerPeriod): string { return period.paymentStatusKey === 'overdue' ? period.paymentStatus : period.periodStatus }
  primaryPeriodTone(period: PartnerPeriod): string { return period.paymentStatusKey === 'overdue' ? period.paymentTone : period.periodTone }

  openUpload(): void { this.closeDetailModals(); this.uploadOpen = true }
  closeUpload(): void { this.uploadOpen = false }
  completeUpload(): void { this.uploadOpen = false; this.toast = 'Invoice batch received. Eligible invoices will update the matching Supplier periods.' }
  openBatch(batch: UploadBatch): void { this.closeDetailModals(); this.selectedBatch = batch }
  closeBatch(): void { this.selectedBatch = null }
  openSupplier(supplier: PartnerSupplierRow): void { this.closeDetailModals(); this.selectedSupplier = supplier; this.supplierPeriodsOpen = false; this.resetSupplierPeriodList() }
  closeSupplier(): void { this.selectedSupplier = null; this.supplierPeriodsOpen = false; this.resetSupplierPeriodList() }
  openSupplierPeriods(): void { if (!this.selectedSupplier) return; this.resetSupplierPeriodList(); this.supplierPeriodsOpen = true }
  closeSupplierPeriods(): void { this.supplierPeriodsOpen = false; this.resetSupplierPeriodList() }
  openSupplierPeriod(period: PartnerPeriod): void { this.returnSupplier = this.selectedSupplier; this.returnSupplierPeriodsOpen = this.supplierPeriodsOpen; this.selectedSupplier = null; this.supplierPeriodsOpen = false; this.selectedPeriod = period }
  openPaymentPeriod(period: PartnerPeriod): void { this.closeDetailModals(); this.selectedPeriod = period }
  backToSupplier(): void { this.selectedPeriod = null; if (this.returnSupplier) this.selectedSupplier = this.returnSupplier; this.returnSupplier = null; this.supplierPeriodsOpen = this.returnSupplierPeriodsOpen; this.returnSupplierPeriodsOpen = false }
  closePeriod(): void { this.selectedPeriod = null; this.returnSupplier = null; this.returnSupplierPeriodsOpen = false }

  onSupplierSearchValueChange(value: string): void { this.supplierSearch = value; this.supplierPage = 1 }
  onSupplierFilterValuesChange(values: Record<string, string>): void { this.supplierStatusFilter = values['supplierStatus'] ?? ''; this.supplierPage = 1 }
  onSupplierSortValueChange(value: string): void { this.supplierSort = value; this.supplierPage = 1 }
  changeSupplierPage(page: number): void { this.supplierPage = Math.min(Math.max(1, page), this.supplierTotalPages) }

  onPaymentSearchValueChange(value: string): void { this.paymentSearch = value; this.paymentPage = 1 }
  onPaymentFilterValuesChange(values: Record<string, string>): void { this.paymentStatusFilter = values['paymentStatus'] ?? ''; this.paymentPage = 1 }
  onPaymentSortValueChange(value: string): void { this.paymentSort = value; this.paymentPage = 1 }
  changePaymentPage(page: number): void { this.paymentPage = Math.min(Math.max(1, page), this.paymentTotalPages) }

  onSupplierPeriodSearchValueChange(value: string): void { this.supplierPeriodSearch = value; this.supplierPeriodPage = 1 }
  onSupplierPeriodFilterValuesChange(values: Record<string, string>): void { this.supplierPeriodStatusFilter = values['status'] ?? ''; this.supplierPeriodPage = 1 }
  onSupplierPeriodSortValueChange(value: string): void { this.supplierPeriodSort = value; this.supplierPeriodPage = 1 }
  changeSupplierPeriodPage(page: number): void { this.supplierPeriodPage = Math.min(Math.max(1, page), this.supplierPeriodTotalPages) }

  async copyPaymentReference(reference: string): Promise<void> {
    try { await navigator.clipboard.writeText(reference); this.toast = 'Payment reference copied.' }
    catch { this.toast = `Payment reference: ${reference}` }
  }

  private resetSupplierPeriodList(): void {
    this.supplierPeriodSearch = ''
    this.supplierPeriodStatusFilter = ''
    this.supplierPeriodSort = ''
    this.supplierPeriodPage = 1
  }

  private nextPaymentDate(supplier: PartnerSupplierRow): string {
    return this.periodsForSupplier(supplier).find(period => period.paymentStatusKey !== 'paid')?.dueDate ?? '9999-12-31'
  }
  private paymentPriority(period: PartnerPeriod): number {
    if (period.paymentStatusKey === 'overdue' || period.periodStatusKey === 'overdue') return 0
    if (period.paymentStatusKey === 'upcoming') return 1
    if (period.paymentStatusKey === 'processing') return 2
    return 3
  }
  private closeDetailModals(): void {
    this.selectedBatch = null
    this.selectedSupplier = null
    this.selectedPeriod = null
    this.returnSupplier = null
    this.supplierPeriodsOpen = false
    this.returnSupplierPeriodsOpen = false
    this.resetSupplierPeriodList()
  }
}
