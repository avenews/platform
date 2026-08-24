import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
  CustomerFilterBarComponent,
  type CustomerFilterField,
  type CustomerSortOption,
} from '../../shared/customer-filter-bar.component'
import { formatDate, formatKes } from '../../shared/customer-portal.data'

type PartnerSection = 'invoice-uploads' | 'obligations' | 'suppliers'
type SupplierStatusKey = 'available' | 'unavailable' | 'max-used'
type PeriodStatusKey = 'open' | 'cutoff' | 'settled' | 'overdue' | 'expired'
type PaymentStatusKey = 'upcoming' | 'processing' | 'overdue' | 'paid'

interface UploadBatch {
  id: string
  fileName: string
  uploadedAt: string
  imported: number
  skipped: number
  failed: number
  supplierCount: number
  periodCount: number
  status: string
  statusTone: string
}

interface PartnerSupplierRow {
  id: string
  business: string
  identifier: string
  maxFinancing: number
  used: number
  available: number
  statusKey: SupplierStatusKey
  status: string
  statusTone: string
  lastUpload: string
  periodIds: readonly string[]
}

interface PartnerPeriod {
  id: string
  reference: string
  supplierId: string
  dueDate: string
  invoiceCount: number
  invoiceValue: number
  financedAgainst: number
  amountToPay: number
  periodStatusKey: PeriodStatusKey
  periodStatus: string
  periodTone: string
  paymentStatusKey: PaymentStatusKey
  paymentStatus: string
  paymentTone: string
  paymentReference: string
}

@Component({
  selector: 'app-partner-workspace',
  standalone: true,
  imports: [CustomerFilterBarComponent],
  templateUrl: './partner-workspace.component.html',
  styleUrl: './partner-workspace.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerWorkspaceComponent {
  private readonly route = inject(ActivatedRoute)

  readonly section = (this.route.snapshot.data['section'] ?? 'invoice-uploads') as PartnerSection
  readonly formatDate = formatDate
  readonly formatKes = formatKes

  uploadOpen = this.section === 'invoice-uploads' && this.route.snapshot.queryParamMap.get('action') === 'upload'
  selectedBatch: UploadBatch | null = null
  selectedSupplier: PartnerSupplierRow | null = null
  selectedPeriod: PartnerPeriod | null = null
  returnSupplier: PartnerSupplierRow | null = null
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

  readonly uploadBatches: readonly UploadBatch[] = [
    { id: 'batch-aug-12', fileName: 'twiga-suppliers-2026-08-12.xlsx', uploadedAt: '12 Aug 2026, 09:42', imported: 37, skipped: 1, failed: 2, supplierCount: 18, periodCount: 21, status: 'Needs attention', statusTone: 'status-warning' },
    { id: 'batch-aug-05', fileName: 'twiga-suppliers-2026-08-05.xlsx', uploadedAt: '05 Aug 2026, 10:18', imported: 42, skipped: 3, failed: 0, supplierCount: 24, periodCount: 28, status: 'Processed', statusTone: 'status-success' },
    { id: 'batch-jul-28', fileName: 'twiga-suppliers-2026-07-28.xlsx', uploadedAt: '28 Jul 2026, 14:06', imported: 31, skipped: 0, failed: 0, supplierCount: 16, periodCount: 19, status: 'Processed', statusTone: 'status-success' },
  ]

  readonly suppliers: readonly PartnerSupplierRow[] = [
    { id: 'supplier-kioko', business: 'Kioko Agri Supplies Ltd', identifier: 'SUP-0042', maxFinancing: 1500000, used: 850000, available: 650000, statusKey: 'available', status: 'Available', statusTone: 'status-success', lastUpload: '12 Aug 2026', periodIds: ['pb-kioko-sep15', 'pb-kioko-sep30'] },
    { id: 'supplier-nairobi', business: 'Nairobi Fresh Traders Ltd', identifier: 'SUP-0068', maxFinancing: 1000000, used: 400000, available: 600000, statusKey: 'available', status: 'Available', statusTone: 'status-success', lastUpload: '12 Aug 2026', periodIds: ['pb-nairobi-aug31', 'pb-nairobi-sep30'] },
    { id: 'supplier-makueni', business: 'Makueni Produce Company', identifier: 'SUP-0091', maxFinancing: 600000, used: 0, available: 600000, statusKey: 'unavailable', status: 'Unavailable', statusTone: 'status-neutral', lastUpload: 'No eligible invoices yet', periodIds: ['pb-makueni-expired'] },
    { id: 'supplier-highlands', business: 'Highlands Food Processors', identifier: 'SUP-0104', maxFinancing: 900000, used: 900000, available: 0, statusKey: 'max-used', status: 'Max financing used', statusTone: 'status-warning', lastUpload: '05 Aug 2026', periodIds: ['pb-highlands-sep15', 'pb-highlands-oct15'] },
    { id: 'supplier-rift', business: 'Rift Valley Grains Ltd', identifier: 'SUP-0112', maxFinancing: 750000, used: 300000, available: 450000, statusKey: 'available', status: 'Available', statusTone: 'status-success', lastUpload: '05 Aug 2026', periodIds: ['pb-rift-sep20'] },
    { id: 'supplier-coast', business: 'Coastline Produce Ltd', identifier: 'SUP-0133', maxFinancing: 1200000, used: 650000, available: 550000, statusKey: 'available', status: 'Available', statusTone: 'status-success', lastUpload: '28 Jul 2026', periodIds: ['pb-coast-aug15', 'pb-coast-oct01'] },
    { id: 'supplier-kericho', business: 'Kericho Fresh Foods', identifier: 'SUP-0158', maxFinancing: 500000, used: 500000, available: 0, statusKey: 'max-used', status: 'Max financing used', statusTone: 'status-warning', lastUpload: '28 Jul 2026', periodIds: ['pb-kericho-sep10'] },
    { id: 'supplier-eldoret', business: 'Eldoret Farm Inputs', identifier: 'SUP-0174', maxFinancing: 850000, used: 250000, available: 600000, statusKey: 'available', status: 'Available', statusTone: 'status-success', lastUpload: '12 Aug 2026', periodIds: ['pb-eldoret-oct10'] },
  ]

  readonly periods: readonly PartnerPeriod[] = [
    { id: 'pb-kioko-sep15', reference: 'PER-2026-09-15-KIOKO', supplierId: 'supplier-kioko', dueDate: '2026-09-15', invoiceCount: 8, invoiceValue: 1280000, financedAgainst: 850000, amountToPay: 1280000, periodStatusKey: 'cutoff', periodStatus: 'Cutoff', periodTone: 'status-warning', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-KIOKO-150926' },
    { id: 'pb-kioko-sep30', reference: 'PER-2026-09-30-KIOKO', supplierId: 'supplier-kioko', dueDate: '2026-09-30', invoiceCount: 5, invoiceValue: 760000, financedAgainst: 0, amountToPay: 760000, periodStatusKey: 'open', periodStatus: 'Open', periodTone: 'status-info', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-KIOKO-300926' },
    { id: 'pb-nairobi-aug31', reference: 'PER-2026-08-31-NAIROBI', supplierId: 'supplier-nairobi', dueDate: '2026-08-31', invoiceCount: 6, invoiceValue: 940000, financedAgainst: 400000, amountToPay: 940000, periodStatusKey: 'cutoff', periodStatus: 'Cutoff', periodTone: 'status-warning', paymentStatusKey: 'processing', paymentStatus: 'Payment processing', paymentTone: 'status-warning', paymentReference: 'TWIGA-NAIROBI-310826' },
    { id: 'pb-nairobi-sep30', reference: 'PER-2026-09-30-NAIROBI', supplierId: 'supplier-nairobi', dueDate: '2026-09-30', invoiceCount: 4, invoiceValue: 620000, financedAgainst: 0, amountToPay: 620000, periodStatusKey: 'open', periodStatus: 'Open', periodTone: 'status-info', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-NAIROBI-300926' },
    { id: 'pb-makueni-expired', reference: 'PER-2026-07-31-MAKUENI', supplierId: 'supplier-makueni', dueDate: '2026-07-31', invoiceCount: 2, invoiceValue: 180000, financedAgainst: 0, amountToPay: 180000, periodStatusKey: 'expired', periodStatus: 'Expired', periodTone: 'status-neutral', paymentStatusKey: 'paid', paymentStatus: 'Paid', paymentTone: 'status-success', paymentReference: 'TWIGA-MAKUENI-310726' },
    { id: 'pb-highlands-sep15', reference: 'PER-2026-09-15-HIGHLANDS', supplierId: 'supplier-highlands', dueDate: '2026-09-15', invoiceCount: 7, invoiceValue: 1320000, financedAgainst: 900000, amountToPay: 1320000, periodStatusKey: 'cutoff', periodStatus: 'Cutoff', periodTone: 'status-warning', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-HIGHLANDS-150926' },
    { id: 'pb-highlands-oct15', reference: 'PER-2026-10-15-HIGHLANDS', supplierId: 'supplier-highlands', dueDate: '2026-10-15', invoiceCount: 3, invoiceValue: 410000, financedAgainst: 0, amountToPay: 410000, periodStatusKey: 'open', periodStatus: 'Open', periodTone: 'status-info', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-HIGHLANDS-151026' },
    { id: 'pb-rift-sep20', reference: 'PER-2026-09-20-RIFT', supplierId: 'supplier-rift', dueDate: '2026-09-20', invoiceCount: 5, invoiceValue: 590000, financedAgainst: 300000, amountToPay: 590000, periodStatusKey: 'open', periodStatus: 'Open', periodTone: 'status-info', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-RIFT-200926' },
    { id: 'pb-coast-aug15', reference: 'PER-2026-08-15-COAST', supplierId: 'supplier-coast', dueDate: '2026-08-15', invoiceCount: 9, invoiceValue: 1040000, financedAgainst: 650000, amountToPay: 1040000, periodStatusKey: 'overdue', periodStatus: 'Overdue', periodTone: 'status-danger', paymentStatusKey: 'overdue', paymentStatus: 'Overdue', paymentTone: 'status-danger', paymentReference: 'TWIGA-COAST-150826' },
    { id: 'pb-coast-oct01', reference: 'PER-2026-10-01-COAST', supplierId: 'supplier-coast', dueDate: '2026-10-01', invoiceCount: 4, invoiceValue: 510000, financedAgainst: 0, amountToPay: 510000, periodStatusKey: 'open', periodStatus: 'Open', periodTone: 'status-info', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-COAST-011026' },
    { id: 'pb-kericho-sep10', reference: 'PER-2026-09-10-KERICHO', supplierId: 'supplier-kericho', dueDate: '2026-09-10', invoiceCount: 4, invoiceValue: 720000, financedAgainst: 500000, amountToPay: 720000, periodStatusKey: 'cutoff', periodStatus: 'Cutoff', periodTone: 'status-warning', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-KERICHO-100926' },
    { id: 'pb-eldoret-oct10', reference: 'PER-2026-10-10-ELDORET', supplierId: 'supplier-eldoret', dueDate: '2026-10-10', invoiceCount: 3, invoiceValue: 480000, financedAgainst: 250000, amountToPay: 480000, periodStatusKey: 'open', periodStatus: 'Open', periodTone: 'status-info', paymentStatusKey: 'upcoming', paymentStatus: 'Upcoming', paymentTone: 'status-info', paymentReference: 'TWIGA-ELDORET-101026' },
  ]

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

  openUpload(): void { this.closeDetailModals(); this.uploadOpen = true }
  closeUpload(): void { this.uploadOpen = false }
  completeUpload(): void { this.uploadOpen = false; this.toast = 'Invoice batch received. Eligible invoices will update the matching Supplier periods.' }
  openBatch(batch: UploadBatch): void { this.closeDetailModals(); this.selectedBatch = batch }
  closeBatch(): void { this.selectedBatch = null }
  openSupplier(supplier: PartnerSupplierRow): void { this.closeDetailModals(); this.selectedSupplier = supplier }
  closeSupplier(): void { this.selectedSupplier = null }
  openSupplierPeriod(period: PartnerPeriod): void { this.returnSupplier = this.selectedSupplier; this.selectedSupplier = null; this.selectedPeriod = period }
  openPaymentPeriod(period: PartnerPeriod): void { this.closeDetailModals(); this.selectedPeriod = period }
  backToSupplier(): void { this.selectedPeriod = null; if (this.returnSupplier) this.selectedSupplier = this.returnSupplier; this.returnSupplier = null }
  closePeriod(): void { this.selectedPeriod = null; this.returnSupplier = null }

  onSupplierSearchValueChange(value: string): void { this.supplierSearch = value; this.supplierPage = 1 }
  onSupplierFilterValuesChange(values: Record<string, string>): void { this.supplierStatusFilter = values['supplierStatus'] ?? ''; this.supplierPage = 1 }
  onSupplierSortValueChange(value: string): void { this.supplierSort = value; this.supplierPage = 1 }
  changeSupplierPage(page: number): void { this.supplierPage = Math.min(Math.max(1, page), this.supplierTotalPages) }

  onPaymentSearchValueChange(value: string): void { this.paymentSearch = value; this.paymentPage = 1 }
  onPaymentFilterValuesChange(values: Record<string, string>): void { this.paymentStatusFilter = values['paymentStatus'] ?? ''; this.paymentPage = 1 }
  onPaymentSortValueChange(value: string): void { this.paymentSort = value; this.paymentPage = 1 }
  changePaymentPage(page: number): void { this.paymentPage = Math.min(Math.max(1, page), this.paymentTotalPages) }

  async copyPaymentReference(reference: string): Promise<void> {
    try { await navigator.clipboard.writeText(reference); this.toast = 'Payment reference copied.' }
    catch { this.toast = `Payment reference: ${reference}` }
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
  private closeDetailModals(): void { this.selectedBatch = null; this.selectedSupplier = null; this.selectedPeriod = null; this.returnSupplier = null }
}
